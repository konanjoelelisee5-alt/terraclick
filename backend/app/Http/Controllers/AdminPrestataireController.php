<?php

namespace App\Http\Controllers;

use App\Http\Resources\CandidatureResource;
use App\Models\Avis;
use App\Models\Candidature;
use App\Models\Categorie;
use App\Models\DocumentPrestataire;
use App\Models\Prestataire;
use App\Models\Realisation;
use App\Models\SanctionPrestataire;
use App\Models\Secteur;
use App\Models\Signalement;
use App\Support\Telephone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Le dossier d'un prestataire, vu par l'équipe : identité, secteurs, pièces à vérifier une à une,
 * photos, activité (missions, taux d'acceptation, retards, litiges), avis des clients,
 * signalements et sanctions. Et les décisions : statut (actif, suspendu, bloqué), secteurs,
 * vérification des documents, avertissement.
 */
class AdminPrestataireController extends Controller
{
    /** Statuts d'une demande acceptée par le prestataire, puis menée ou en cours. */
    private const ACCEPTEES = ['acceptee', 'en_cours', 'terminee', 'confirmee'];

    /** GET /api/admin/prestataires/{prestataire} */
    public function show(Prestataire $prestataire): JsonResponse
    {
        Gate::authorize('view', $prestataire);

        return response()->json(['data' => $this->dossier($prestataire)]);
    }

    /** GET /api/admin/prestataires/{prestataire}/documents/{document} — la pièce, jamais publique. */
    public function document(Prestataire $prestataire, DocumentPrestataire $document): StreamedResponse
    {
        Gate::authorize('view', $prestataire);
        abort_unless($document->prestataire_id === $prestataire->id && $document->fichier && Storage::disk('local')->exists($document->fichier), 404);

        return Storage::disk('local')->response($document->fichier, null, array_filter(['Content-Type' => $document->mime]));
    }

    /** PATCH /api/admin/prestataires/{prestataire}/documents/{document} — vérifiée ou refusée (avec un motif). */
    public function verifierDocument(Request $request, Prestataire $prestataire, DocumentPrestataire $document): JsonResponse
    {
        Gate::authorize('modifier', $prestataire);
        abort_unless($document->prestataire_id === $prestataire->id, 404);
        $donnees = $request->validate([
            'statut' => ['required', Rule::in(['verifie', 'refuse', 'en_attente'])],
            'motif' => ['nullable', 'required_if:statut,refuse', 'string', 'min:5', 'max:500'],
        ], ['motif.required_if' => 'Dites pourquoi la pièce est refusée.']);

        $document->update([
            'statut' => $donnees['statut'],
            'motif' => $donnees['statut'] === 'refuse' ? $donnees['motif'] : null,
            'verifie_le' => $donnees['statut'] === 'en_attente' ? null : now(),
            'verifie_par' => $request->user()->id,
        ]);

        return response()->json(['data' => $this->piece($prestataire, $document)]);
    }

    /** PUT /api/admin/prestataires/{prestataire}/secteurs — les secteurs où il apparaît. */
    public function secteurs(Request $request, Prestataire $prestataire): JsonResponse
    {
        Gate::authorize('modifier', $prestataire);
        $catalogue = Secteur::catalogue();
        $cles = $request->validate([
            'secteurs' => ['required', 'array', 'min:1', 'max:6'],
            'secteurs.*' => ['string', 'distinct', Rule::in(array_keys($catalogue))],
        ], ['secteurs.required' => 'Choisissez au moins un secteur.', 'secteurs.min' => 'Choisissez au moins un secteur.'])['secteurs'];

        // Les catégories des secteurs retirés partent ; un secteur ajouté apporte sa première
        // catégorie. Les catégories hors secteurs (annuaire général) restent.
        $actuelles = $prestataire->categories()->pluck('slug')->all();
        $desSecteurs = array_merge([], ...array_column($catalogue, 'categories'));
        $gardees = array_diff($actuelles, $desSecteurs);
        foreach ($cles as $cle) {
            $siennes = array_intersect($actuelles, $catalogue[$cle]['categories']);
            $gardees = [...$gardees, ...($siennes ?: [$catalogue[$cle]['categories'][0]])];
        }
        $prestataire->categories()->sync(Categorie::whereIn('slug', array_unique($gardees))->pluck('id'));

        return response()->json(['data' => $this->dossier($prestataire->refresh())]);
    }

    /** POST /api/admin/prestataires/{prestataire}/statut — actif, suspendu ou bloqué, avec le motif. */
    public function statut(Request $request, Prestataire $prestataire): JsonResponse
    {
        $donnees = $request->validate([
            'statut' => ['required', Rule::in(array_keys(Prestataire::STATUTS))],
            'motif' => ['required', 'string', 'min:5', 'max:1000'],
        ], ['motif.required' => 'Indiquez le motif : il reste dans le dossier.']);
        Gate::authorize('changerStatut', [$prestataire, $donnees['statut']]);

        if ($donnees['statut'] !== $prestataire->statut) {
            $prestataire->changerStatut($donnees['statut'], $donnees['motif'], $request->user());
        }

        return response()->json(['data' => $this->dossier($prestataire->refresh())]);
    }

    /** POST /api/admin/prestataires/{prestataire}/sanctions — un avertissement inscrit au dossier. */
    public function sanctionner(Request $request, Prestataire $prestataire): JsonResponse
    {
        Gate::authorize('sanctionner', $prestataire);
        $donnees = $request->validate([
            'motif' => ['required', 'string', 'min:5', 'max:1000'],
            'signalement_id' => ['nullable', 'integer', Rule::exists('signalements', 'id')],
        ], ['motif.required' => 'Indiquez le motif de l\'avertissement.']);

        if ($id = $donnees['signalement_id'] ?? null) {
            abort_unless(Signalement::whereKey($id)->whereHas('demande', fn ($d) => $d->where('prestataire_id', $prestataire->id))->exists(), 422, 'Ce signalement ne concerne pas ce prestataire.');
        }
        $prestataire->sanctions()->create([...$donnees, 'type' => 'avertissement', 'user_id' => $request->user()->id]);

        return response()->json(['data' => $this->dossier($prestataire->refresh())], 201);
    }

    /** @return array<string, mixed> */
    private function dossier(Prestataire $p): array
    {
        $p->load('quartier', 'utilisateur', 'categories', 'documents', 'realisations', 'sanctions.auteur');
        $catalogue = Secteur::catalogue();
        $slugs = $p->categories->pluck('slug')->all();

        $parStatut = $p->demandes()->selectRaw('statut, COUNT(*) AS n')->groupBy('statut')->pluck('n', 'statut');
        $somme = fn (array $statuts) => (int) collect($statuts)->sum(fn (string $s) => $parStatut[$s] ?? 0);
        $acceptees = $somme(self::ACCEPTEES);
        $refusees = $somme(['refusee']);
        $signalements = Signalement::query()->with('auteur', 'demande')
            ->whereHas('demande', fn ($d) => $d->where('prestataire_id', $p->id))->latest('id')->get();

        $candidature = Candidature::query()->with('quartier', 'documents')
            ->where(fn ($q) => $q->where('prestataire_id', $p->id)->when($p->user_id, fn ($w) => $w->orWhere('user_id', $p->user_id)))
            ->latest('id')->first();

        return [
            'id' => $p->id,
            'nom' => $p->nom,
            'metier' => $p->metier,
            'description' => $p->description,
            'telephone' => $p->telephone ? Telephone::affichage($p->telephone) : null,
            'quartier' => $p->quartier?->nom,
            'zone' => $p->zone_intervention,
            'experience_annees' => $p->annee_debut ? max(0, now()->year - $p->annee_debut) : null,
            'inscrit_le' => $p->created_at?->toIso8601String(),
            'compte' => $p->utilisateur ? ['id' => $p->utilisateur->id, 'nom' => $p->utilisateur->nom, 'telephone' => Telephone::affichage($p->utilisateur->telephone)] : null,
            'statut' => $p->statut,
            'statut_libelle' => Prestataire::STATUTS[$p->statut] ?? $p->statut,
            'statut_motif' => $p->statut_motif,
            'statut_le' => $p->statut_le?->toIso8601String(),
            'en_vedette' => $p->en_vedette,
            'note' => (float) $p->note_moyenne,
            'nombre_avis' => $p->nombre_avis,
            'secteurs' => collect($catalogue)->filter(fn (array $s) => array_intersect($slugs, $s['categories']))->keys()->values(),
            'categories' => $p->categories->pluck('nom'),
            'documents' => $p->documents->map(fn (DocumentPrestataire $d) => $this->piece($p, $d))->values(),
            'photos' => $p->realisations->filter(fn (Realisation $r) => $r->image)->map(fn (Realisation $r) => ['legende' => $r->legende, 'image' => $r->image])->values(),
            'activite' => [
                'missions' => (int) $parStatut->sum(),
                'acceptees' => $acceptees,
                'refusees' => $refusees,
                'taux_acceptation' => $acceptees + $refusees ? (int) round($acceptees * 100 / ($acceptees + $refusees)) : null,
                'reussies' => $somme(['terminee', 'confirmee']),
                'annulees' => $somme(['annulee']),
                'sans_reponse' => $p->demandes()->where('statut', 'envoyee')->where('created_at', '<=', now()->subHours(2))->count(),
                'retards' => $signalements->where('motif', 'retard')->count(),
                'litiges' => $signalements->count(),
                'litiges_ouverts' => $signalements->where('statut', 'ouvert')->count(),
            ],
            'avis' => $p->avis()->with('auteur')->latest('id')->limit(50)->get()->map(fn (Avis $a) => [
                'id' => $a->id,
                'auteur' => $a->auteur?->nom,
                'note' => (float) $a->note,
                'ponctualite' => $a->note_ponctualite,
                'qualite' => $a->note_qualite,
                'prix' => $a->note_prix,
                'commentaire' => $a->commentaire,
                'date' => $a->created_at?->toIso8601String(),
            ]),
            'signalements' => $signalements->map(fn (Signalement $s) => [
                'id' => $s->id,
                'motif' => $s->motif,
                'motif_libelle' => config("suivi.motifs_signalement.{$s->motif}") ?? config("pressing.motifs_signalement.{$s->motif}") ?? $s->motif,
                'message' => $s->message,
                'statut' => $s->statut,
                'demande' => $s->demande?->reference,
                'auteur' => $s->auteur?->nom,
                'date' => $s->created_at?->toIso8601String(),
            ]),
            'sanctions' => $p->sanctions->map(fn (SanctionPrestataire $s) => [
                'id' => $s->id,
                'type' => $s->type,
                'type_libelle' => SanctionPrestataire::TYPES[$s->type] ?? $s->type,
                'motif' => $s->motif,
                'par' => $s->auteur?->nom,
                'date' => $s->created_at?->toIso8601String(),
            ]),
            'candidature' => $candidature ? CandidatureResource::make($candidature) : null,
        ];
    }

    /** @return array<string, mixed> */
    private function piece(Prestataire $p, DocumentPrestataire $d): array
    {
        return [
            'id' => $d->id,
            'type' => $d->type,
            'libelle' => $d->libelle(),
            'statut' => $d->statut,
            'motif' => $d->motif,
            'mime' => $d->mime ?? '',
            'url' => $d->fichier ? url("/api/admin/prestataires/{$p->id}/documents/{$d->id}") : null,
            'verifie_le' => $d->verifie_le?->toIso8601String(),
        ];
    }
}
