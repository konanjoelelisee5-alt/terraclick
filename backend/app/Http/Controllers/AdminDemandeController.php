<?php

namespace App\Http\Controllers;

use App\Http\Resources\DemandeResource;
use App\Models\Demande;
use App\Models\DemandeEvenement;
use App\Models\Prestataire;
use App\Models\SanctionPrestataire;
use App\Models\Secteur;
use App\Models\Signalement;
use App\Models\User;
use App\Services\CycleDemande;
use App\Support\Telephone;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Les demandes vues et pilotées par l'équipe TerraClick : attribuer ou réattribuer à un
 * prestataire, relancer celui qui ne répond pas, annuler en cas de problème, résoudre un
 * litige entre client et prestataire. Chaque décision s'inscrit au journal de la demande,
 * qui forme avec les signalements et les sanctions son historique complet.
 */
class AdminDemandeController extends Controller
{
    /** Le suivi vu par l'équipe, du dépôt à la clôture. */
    public const ETATS = [
        'en_attente' => 'En attente d\'un prestataire',
        'assignee' => 'Assignée, sans réponse',
        'acceptee' => 'Acceptée',
        'en_cours' => 'En cours',
        'terminee' => 'Terminée',
        'annulee' => 'Annulée',
    ];

    /** Sans réponse au-delà de ce délai, la demande est signalée à l'équipe. */
    private const DELAI_REPONSE_HEURES = 2;

    public function __construct(private readonly CycleDemande $cycle) {}

    public static function etat(Demande $d): string
    {
        return match ($d->statut) {
            'envoyee' => $d->prestataire_id ? 'assignee' : 'en_attente',
            'refusee' => 'en_attente',
            'confirmee', 'terminee' => 'terminee',
            default => $d->statut,
        };
    }

    public static function filtrerEtat(Builder $q, string $etat): void
    {
        match ($etat) {
            'en_attente' => $q->where(fn ($w) => $w->where('statut', 'refusee')->orWhere(fn ($x) => $x->where('statut', 'envoyee')->whereNull('prestataire_id'))),
            'assignee' => $q->where('statut', 'envoyee')->whereNotNull('prestataire_id'),
            'terminee' => $q->whereIn('statut', ['terminee', 'confirmee']),
            default => $q->where('statut', $etat),
        };
    }

    /** @return array<string, mixed> l'état vu par l'équipe et ce qui demande son attention */
    public static function suiviEquipe(Demande $d): array
    {
        $etat = self::etat($d);
        $sansReponse = $etat === 'assignee' && $d->created_at?->lte(now()->subHours(self::DELAI_REPONSE_HEURES));

        return [
            'etat_equipe' => ['cle' => $etat, 'libelle' => self::ETATS[$etat]],
            'alertes' => array_values(array_filter([
                $sansReponse ? 'Sans réponse depuis plus de '.self::DELAI_REPONSE_HEURES.' h' : null,
                $d->statut === 'refusee' ? 'Refusée : à réattribuer' : null,
                ($d->litiges_ouverts_count ?? $d->signalements()->where('statut', 'ouvert')->count()) ? 'Litige ouvert' : null,
            ])),
        ];
    }

    /** Le détail complet : la demande, les contacts, les décisions possibles et l'historique. */
    public static function detail(Request $request, Demande $d): array
    {
        $d->load('quartier', 'prestataire.quartier', 'client', 'evenements', 'signalements.auteur', 'accord');
        $auteurs = User::whereIn('id', $d->evenements->pluck('user_id')->merge($d->signalements->pluck('traite_par'))->filter()->unique())->pluck('nom', 'id');
        $qui = ['client' => 'Client', 'technicien' => 'Prestataire', 'equipe' => 'Équipe TerraClick'];

        $historique = collect([[
            'date' => $d->created_at?->toIso8601String(),
            'qui' => 'Client'.($d->client?->nom ? " · {$d->client->nom}" : ''),
            'type' => 'client',
            'titre' => 'Demande envoyée',
            'texte' => trim($d->probleme.($d->precision ? " — {$d->precision}" : '')),
        ]])
            ->merge($d->evenements->map(fn (DemandeEvenement $e) => [
                'date' => $e->created_at?->toIso8601String(),
                'qui' => ($qui[$e->auteur] ?? $e->auteur).(isset($auteurs[$e->user_id]) ? " · {$auteurs[$e->user_id]}" : ''),
                'type' => $e->auteur,
                'titre' => DemandeResource::libelleStatut($e->statut),
                'texte' => $e->message,
            ]))
            ->merge($d->signalements->flatMap(fn (Signalement $s) => array_filter([
                [
                    'date' => $s->created_at?->toIso8601String(),
                    'qui' => 'Client'.($s->auteur?->nom ? " · {$s->auteur->nom}" : ''),
                    'type' => 'litige',
                    'titre' => 'Signalement : '.($d->motifsSignalement()[$s->motif] ?? $s->motif),
                    'texte' => $s->message,
                ],
                $s->statut === 'traite' ? [
                    'date' => $s->traite_le?->toIso8601String(),
                    'qui' => 'Équipe TerraClick'.(isset($auteurs[$s->traite_par]) ? " · {$auteurs[$s->traite_par]}" : ''),
                    'type' => 'equipe',
                    'titre' => 'Signalement traité',
                    'texte' => $s->reponse,
                ] : null,
            ])))
            ->merge(SanctionPrestataire::with('auteur')->whereIn('signalement_id', $d->signalements->pluck('id'))->get()->map(fn (SanctionPrestataire $s) => [
                'date' => $s->created_at?->toIso8601String(),
                'qui' => 'Équipe TerraClick'.($s->auteur?->nom ? " · {$s->auteur->nom}" : ''),
                'type' => 'equipe',
                'titre' => (SanctionPrestataire::TYPES[$s->type] ?? $s->type).' du prestataire',
                'texte' => $s->motif,
            ]))
            ->sortBy('date')->values();

        $actions = collect(CycleDemande::ACTIONS_EQUIPE)
            ->filter(fn (array $a, string $action) => in_array($d->statut, $a[0], true) && ($action !== 'relancer' || $d->prestataire_id))
            ->keys()->reject(fn (string $a) => $a === 'cloturer')->values();

        return [
            ...DemandeResource::make($d)->resolve($request),
            ...self::suiviEquipe($d),
            'client' => ['nom' => $d->client?->nom, 'telephone' => $d->client ? Telephone::affichage($d->client->telephone) : null],
            'prestataire_contact' => $d->prestataire ? ['nom' => $d->prestataire->nom, 'telephone' => $d->prestataire->telephone ? Telephone::affichage($d->prestataire->telephone) : null] : null,
            'actions' => $actions,
            'cloturable' => in_array($d->statut, CycleDemande::ACTIONS_EQUIPE['cloturer'][0], true),
            'historique' => $historique,
        ];
    }

    /** GET /api/admin/demandes/{demande}/candidats — à qui confier la demande. */
    public function candidats(Demande $demande): JsonResponse
    {
        $categories = Secteur::catalogue()[$demande->secteur]['categories'] ?? [];
        $liste = Prestataire::query()->visibles()
            ->whereHas('categories', fn ($c) => $c->whereIn('slug', $categories))
            ->when($demande->prestataire_id, fn ($q, $id) => $q->whereKeyNot($id))
            ->with('quartier')
            ->withCount(['demandes as en_cours_count' => fn ($q) => $q->whereIn('statut', ['envoyee', 'acceptee', 'en_cours'])])
            ->orderByRaw('quartier_id = ? DESC', [$demande->quartier_id])
            ->orderByDesc('note_moyenne')->orderBy('nom')
            ->limit(30)->get();

        return response()->json(['data' => $liste->map(fn (Prestataire $p) => [
            'id' => $p->id,
            'nom' => $p->nom,
            'metier' => $p->metier,
            'quartier' => $p->quartier?->nom,
            'meme_quartier' => $p->quartier_id === $demande->quartier_id,
            'note' => (float) $p->note_moyenne,
            'nombre_avis' => $p->nombre_avis,
            'en_cours' => $p->en_cours_count,
            'compte' => $p->user_id !== null,
        ])]);
    }

    /** POST /api/admin/demandes/{demande}/attribuer — confier, ou réattribuer, à un prestataire. */
    public function attribuer(Request $request, Demande $demande): JsonResponse
    {
        $donnees = $request->validate([
            'prestataire_id' => ['required', 'integer', 'exists:prestataires,id'],
            'message' => ['nullable', 'string', 'max:500'],
        ], ['prestataire_id.required' => 'Choisissez le prestataire.']);
        $prestataire = Prestataire::findOrFail($donnees['prestataire_id']);
        $categories = Secteur::catalogue()[$demande->secteur]['categories'] ?? [];

        if (! $prestataire->estVisible() || ! $prestataire->categories()->whereIn('categories.slug', $categories)->exists()) {
            throw ValidationException::withMessages(['prestataire_id' => 'Ce prestataire n\'est pas actif dans ce secteur.']);
        }
        if ($demande->statut === 'envoyee' && $demande->prestataire_id === $prestataire->id) {
            throw ValidationException::withMessages(['prestataire_id' => 'La demande est déjà confiée à ce prestataire.']);
        }

        $message = trim(($demande->prestataire_id ? 'Réattribuée' : 'Attribuée')." à {$prestataire->nom}.".(($donnees['message'] ?? '') !== '' ? " {$donnees['message']}" : ''));
        $this->cycle->parEquipe($demande, 'attribuer', $request->user(), $message, [
            'prestataire_id' => $prestataire->id,
            'mode' => 'choisi',
            'estimation' => null,
            'creneau' => null,
            'etape' => null,
        ]);

        return response()->json(['data' => self::detail($request, $demande->refresh())]);
    }

    /** POST /api/admin/demandes/{demande}/relancer — rappeler au prestataire qu'un client attend. */
    public function relancer(Request $request, Demande $demande): JsonResponse
    {
        $message = $request->validate(['message' => ['nullable', 'string', 'max:500']])['message'] ?? null;
        $this->cycle->parEquipe($demande, 'relancer', $request->user(), $message ?: 'Un client attend votre réponse.');

        return response()->json(['data' => self::detail($request, $demande->refresh())]);
    }

    /** POST /api/admin/demandes/{demande}/annuler — en cas de problème, avec le motif. */
    public function annuler(Request $request, Demande $demande): JsonResponse
    {
        $motif = $request->validate(['motif' => ['required', 'string', 'min:5', 'max:500']], [
            'motif.required' => 'Indiquez le motif : le client le lit.',
        ])['motif'];
        $this->cycle->parEquipe($demande, 'annuler', $request->user(), $motif);

        return response()->json(['data' => self::detail($request, $demande->refresh())]);
    }

    /**
     * POST /api/admin/demandes/{demande}/litige — trancher entre client et prestataire : la
     * décision clôt les signalements ouverts ; la demande peut être annulée ou clôturée, et le
     * prestataire averti.
     */
    public function litige(Request $request, Demande $demande): JsonResponse
    {
        $donnees = $request->validate([
            'decision' => ['required', 'string', 'min:5', 'max:1000'],
            'issue' => ['required', Rule::in(['aucune', 'annuler', 'cloturer'])],
            'avertir' => ['sometimes', 'boolean'],
        ], ['decision.required' => 'Écrivez la décision : le client et le dossier du prestataire la gardent.']);

        if (($donnees['avertir'] ?? false) && ! $demande->prestataire_id) {
            throw ValidationException::withMessages(['avertir' => 'Cette demande n\'a pas de prestataire à avertir.']);
        }

        DB::transaction(function () use ($request, $demande, $donnees) {
            $ouverts = $demande->signalements()->where('statut', 'ouvert')->get();
            foreach ($ouverts as $s) {
                $s->update(['statut' => 'traite', 'reponse' => $donnees['decision'], 'traite_par' => $request->user()->id, 'traite_le' => now()]);
            }
            $demande->evenements()->create(['user_id' => $request->user()->id, 'auteur' => 'equipe', 'statut' => 'litige_resolu', 'message' => $donnees['decision']]);

            if ($donnees['issue'] !== 'aucune') {
                $this->cycle->parEquipe($demande, $donnees['issue'], $request->user(), $donnees['decision']);
            }
            if ($donnees['avertir'] ?? false) {
                $demande->prestataire->sanctions()->create([
                    'type' => 'avertissement',
                    'motif' => "Litige {$demande->reference} : {$donnees['decision']}",
                    'signalement_id' => $ouverts->first()?->id ?? $demande->signalements()->latest('id')->value('id'),
                    'user_id' => $request->user()->id,
                ]);
            }
        });

        return response()->json(['data' => self::detail($request, $demande->refresh())]);
    }
}
