<?php

namespace App\Http\Controllers;

use App\Http\Resources\DemandeResource;
use App\Models\Avis;
use App\Models\Candidature;
use App\Models\Demande;
use App\Models\DemandeEvenement;
use App\Models\Prestataire;
use App\Models\Prestation;
use App\Models\Role;
use App\Models\Secteur;
use App\Models\Signalement;
use App\Models\User;
use App\Services\AnalyseurBesoin;
use App\Support\Telephone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Espace administrateur et manager (selon les permissions du compte) : vue d'ensemble, signalements, demandes et
 * commandes, prestataires, utilisateurs, catalogue et prix, journal d'activité. Les
 * candidatures ont leur contrôleur (AdminCandidatureController).
 */
class AdminController extends Controller
{
    /** GET /api/admin/apercu — chiffres clés, demandes par service, et ce qui attend l'équipe. */
    public function apercu(AnalyseurBesoin $analyseur): JsonResponse
    {
        $depuis = now()->subDays(30);
        $parSecteur = Demande::where('created_at', '>=', $depuis)->selectRaw('secteur, count(*) as n')->groupBy('secteur')->pluck('n', 'secteur');

        return response()->json(['data' => [
            'a_traiter' => [
                'candidatures' => Candidature::where('statut', 'en_attente')->count(),
                'signalements' => Signalement::where('statut', 'ouvert')->count(),
                'demandes_sans_reponse' => Demande::where('statut', 'envoyee')->where('created_at', '<=', now()->subHours(2))->count(),
            ],
            'chiffres' => [
                'utilisateurs' => User::count(),
                'prestataires_actifs' => Prestataire::where('actif', true)->count(),
                'demandes_30j' => Demande::where('created_at', '>=', $depuis)->count(),
                'commandes_pressing_30j' => Demande::where('created_at', '>=', $depuis)->whereNotNull('articles')->count(),
                'depannages_accomplis_30j' => Demande::where('statut', 'confirmee')->where('updated_at', '>=', $depuis)->count(),
                'avis_30j' => Avis::where('created_at', '>=', $depuis)->count(),
            ],
            'demandes_par_secteur' => collect($analyseur->secteursOuverts())
                ->map(fn (array $s, string $cle) => ['cle' => $cle, 'nom' => $s['nom'], 'nombre' => (int) ($parSecteur[$cle] ?? 0)])
                ->sortByDesc('nombre')->values(),
            'periode' => ['depuis' => $depuis->toDateString(), 'jusqu_au' => now()->toDateString()],
        ]]);
    }

    /** GET /api/admin/signalements?statut=ouvert|traite */
    public function signalements(Request $request): JsonResponse
    {
        $statut = $request->validate(['statut' => ['nullable', Rule::in(['ouvert', 'traite'])]])['statut'] ?? 'ouvert';
        $liste = Signalement::where('statut', $statut)->with('auteur', 'demande.prestataire')->latest('id')->limit(100)->get();

        return response()->json(['data' => $liste->map(fn (Signalement $s) => $this->signalement($s))]);
    }

    /** POST /api/admin/signalements/{signalement}/traiter — avec la réponse de l'équipe. */
    public function traiterSignalement(Request $request, Signalement $signalement): JsonResponse
    {
        $reponse = $request->validate(['reponse' => ['required', 'string', 'min:3', 'max:1000']], [
            'reponse.required' => 'Notez ce qui a été fait pour ce signalement.',
        ])['reponse'];
        Gate::authorize('traiter', $signalement);
        if ($signalement->statut === 'traite') {
            throw ValidationException::withMessages(['statut' => 'Ce signalement est déjà traité.']);
        }
        $signalement->update(['statut' => 'traite', 'reponse' => $reponse, 'traite_par' => $request->user()->id, 'traite_le' => now()]);

        return response()->json(['data' => $this->signalement($signalement->load('auteur', 'demande.prestataire'))]);
    }

    /** GET /api/admin/demandes?statut=&secteur=&q= — toutes les demandes et commandes. */
    public function demandes(Request $request): JsonResponse
    {
        $filtres = $request->validate([
            'statut' => ['nullable', Rule::in(Demande::STATUTS)],
            'secteur' => ['nullable', 'string', 'max:30'],
            'q' => ['nullable', 'string', 'max:80'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $page = Demande::query()
            ->with('quartier', 'prestataire.quartier', 'client')
            ->when($filtres['statut'] ?? null, fn ($q, $s) => $q->where('statut', $s))
            ->when($filtres['secteur'] ?? null, fn ($q, $s) => $q->where('secteur', $s))
            ->when($filtres['q'] ?? null, fn ($q, $texte) => $q->where(fn ($w) => $w
                ->where('reference', 'like', "%{$texte}%")
                ->orWhere('probleme', 'like', "%{$texte}%")
                ->orWhereHas('client', fn ($c) => $c->where('nom', 'like', "%{$texte}%"))
                ->orWhereHas('prestataire', fn ($p) => $p->where('nom', 'like', "%{$texte}%"))))
            ->latest('id')
            ->paginate(30);

        return response()->json([
            'data' => collect($page->items())->map(fn (Demande $d) => [
                ...DemandeResource::make($d)->resolve($request),
                'client' => ['nom' => $d->client?->nom, 'telephone' => $d->client ? Telephone::affichage($d->client->telephone) : null],
            ]),
            'meta' => ['page' => $page->currentPage(), 'derniere' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    /** GET /api/admin/demandes/{demande} — le détail, le journal et les signalements. */
    public function demande(Request $request, Demande $demande): JsonResponse
    {
        $demande->load('quartier', 'prestataire.quartier', 'client', 'evenements', 'signalements', 'accord');

        return response()->json(['data' => [
            ...DemandeResource::make($demande)->resolve($request),
            'client' => ['nom' => $demande->client?->nom, 'telephone' => $demande->client ? Telephone::affichage($demande->client->telephone) : null],
        ]]);
    }

    /** GET /api/admin/prestataires?q=&etat=actifs|suspendus */
    public function prestataires(Request $request): JsonResponse
    {
        $filtres = $request->validate(['q' => ['nullable', 'string', 'max:80'], 'etat' => ['nullable', Rule::in(['actifs', 'suspendus'])]]);
        $liste = Prestataire::query()
            ->with('quartier', 'utilisateur')
            ->withCount(['documents', 'documents as documents_verifies_count' => fn ($d) => $d->where('statut', 'verifie')])
            ->withCount('demandes')
            ->when(($filtres['etat'] ?? 'actifs') === 'suspendus', fn ($q) => $q->where('actif', false), fn ($q) => $q->where('actif', true))
            ->when($filtres['q'] ?? null, fn ($q, $t) => $q->where(fn ($w) => $w->where('nom', 'like', "%{$t}%")->orWhere('metier', 'like', "%{$t}%")))
            ->orderByDesc('en_vedette')->orderBy('nom')
            ->limit(200)->get();

        return response()->json(['data' => $liste->map(fn (Prestataire $p) => $this->prestataire($p))]);
    }

    /** PATCH /api/admin/prestataires/{prestataire} — suspendre / réactiver, mettre en avant. */
    public function modifierPrestataire(Request $request, Prestataire $prestataire): JsonResponse
    {
        $donnees = $request->validate(['actif' => ['sometimes', 'boolean'], 'en_vedette' => ['sometimes', 'boolean']]);
        if (array_key_exists('actif', $donnees)) {
            Gate::authorize('suspendre', $prestataire);
        }
        if (array_key_exists('en_vedette', $donnees)) {
            Gate::authorize('mettreEnAvant', $prestataire);
        }
        $prestataire->update($donnees);

        return response()->json(['data' => $this->prestataire($prestataire->load('quartier', 'utilisateur')->loadCount([
            'documents', 'documents as documents_verifies_count' => fn ($d) => $d->where('statut', 'verifie'), 'demandes',
        ]))]);
    }

    /** GET /api/admin/utilisateurs?q= */
    public function utilisateurs(Request $request): JsonResponse
    {
        $q = $request->validate(['q' => ['nullable', 'string', 'max:80']])['q'] ?? null;
        $chiffres = $q !== null ? preg_replace('/\D/', '', $q) : '';
        $liste = User::query()
            ->with('quartier', 'roles')
            ->withCount('demandes')
            ->when($q, fn ($w) => $w->where(fn ($x) => $x->where('nom', 'like', "%{$q}%")
                ->when(strlen($chiffres) >= 4, fn ($y) => $y->orWhere('telephone', 'like', "%{$chiffres}%"))))
            ->latest('id')->limit(200)->get();
        $prestataires = Prestataire::whereIn('user_id', $liste->pluck('id'))->pluck('nom', 'user_id');

        return response()->json(['data' => $liste->map(fn (User $u) => $this->utilisateur($u, $prestataires[$u->id] ?? null))]);
    }

    /** PATCH /api/admin/utilisateurs/{user} — les rôles du compte (client, prestataire, manager, admin). */
    public function modifierUtilisateur(Request $request, User $user): JsonResponse
    {
        $roles = $request->validate(['roles' => ['required', 'array', 'min:1'], 'roles.*' => ['string', Rule::exists('roles', 'cle')]], [
            'roles.required' => 'Choisissez au moins un rôle.',
        ])['roles'];
        $roles = array_values(array_unique($roles));
        Gate::authorize('changerRoles', [$user, $roles]);

        $user->roles()->sync(Role::whereIn('cle', $roles)->pluck('id'));
        $user->oublierPermissions();

        return response()->json(['data' => $this->utilisateur($user->load('quartier', 'roles')->loadCount('demandes'), Prestataire::where('user_id', $user->id)->value('nom'))]);
    }

    /** GET /api/admin/prestations — catalogue des prestations et prix indicatifs, par service. */
    public function prestations(): JsonResponse
    {
        $noms = collect(Secteur::catalogue())->map(fn (array $s) => $s['nom']);

        return response()->json(['data' => Prestation::query()->withCount('prestataires')->orderBy('secteur')->orderBy('ordre')->get()
            ->map(fn (Prestation $p) => [
                'id' => $p->id,
                'secteur' => ['cle' => $p->secteur, 'nom' => $noms[$p->secteur] ?? $p->secteur],
                'nom' => $p->nom,
                'prix_min' => $p->prix_min,
                'prix_max' => $p->prix_max,
                'prix_affichage' => $p->prixAffiche(),
                'unite' => $p->unite,
                'prestataires' => $p->prestataires_count,
            ])]);
    }

    /** PATCH /api/admin/prestations/{prestation} — prix indicatifs. */
    public function modifierPrestation(Request $request, Prestation $prestation): JsonResponse
    {
        $donnees = $request->validate([
            'prix_min' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'prix_max' => ['nullable', 'integer', 'min:0', 'max:10000000', 'gte:prix_min'],
        ], ['prix_max.gte' => 'Le prix maximum doit être supérieur ou égal au minimum.']);
        $prestation->forceFill($donnees)->save();

        return response()->json(['data' => ['id' => $prestation->id, 'prix_min' => $prestation->prix_min, 'prix_max' => $prestation->prix_max, 'prix_affichage' => $prestation->prixAffiche()]]);
    }

    /** GET /api/admin/activite — le journal : étapes des demandes, candidatures traitées, signalements. */
    public function activite(): JsonResponse
    {
        $evenements = DemandeEvenement::with('demande.prestataire', 'demande.client')->latest('id')->limit(60)->get()->map(fn (DemandeEvenement $e) => [
            'id' => "e{$e->id}",
            'type' => 'demande',
            'titre' => DemandeResource::libelleStatut($e->statut).' · '.($e->demande?->reference ?? ''),
            'texte' => trim(($e->auteur === 'client' ? $e->demande?->client?->nom : $e->demande?->prestataire?->nom).($e->message ? " — {$e->message}" : '')),
            'date' => $e->created_at?->toIso8601String(),
        ]);
        $candidatures = Candidature::whereNotNull('traite_le')->latest('traite_le')->limit(20)->get()->map(fn (Candidature $c) => [
            'id' => "c{$c->id}",
            'type' => 'candidature',
            'titre' => ($c->statut === 'validee' ? 'Candidature validée' : 'Correction demandée').' · '.$c->reference,
            'texte' => $c->nom_activite,
            'date' => $c->traite_le?->toIso8601String(),
        ]);
        $signalements = Signalement::with('demande')->latest('id')->limit(20)->get()->map(fn (Signalement $s) => [
            'id' => "s{$s->id}",
            'type' => 'signalement',
            'titre' => 'Signalement · '.($s->demande?->reference ?? ''),
            'texte' => ($s->demande?->motifsSignalement()[$s->motif] ?? $s->motif).($s->message ? " — {$s->message}" : ''),
            'date' => $s->created_at?->toIso8601String(),
        ]);

        return response()->json(['data' => $evenements->concat($candidatures)->concat($signalements)->sortByDesc('date')->values()->take(80)]);
    }

    private function signalement(Signalement $s): array
    {
        $d = $s->demande;

        return [
            'id' => $s->id,
            'motif' => $s->motif,
            'motif_libelle' => $d?->motifsSignalement()[$s->motif] ?? $s->motif,
            'message' => $s->message,
            'statut' => $s->statut,
            'reponse' => $s->reponse,
            'client' => ['nom' => $s->auteur?->nom, 'telephone' => $s->auteur ? Telephone::affichage($s->auteur->telephone) : null],
            'demande' => $d ? ['id' => $d->id, 'reference' => $d->reference, 'secteur' => Secteur::nomDe($d->secteur), 'statut_libelle' => DemandeResource::libelleStatut($d->statut)] : null,
            'prestataire' => $d?->prestataire ? ['nom' => $d->prestataire->nom, 'telephone' => $d->prestataire->telephone ? Telephone::affichage($d->prestataire->telephone) : null] : null,
            'date' => $s->created_at?->toIso8601String(),
            'traite_le' => $s->traite_le?->toIso8601String(),
        ];
    }

    private function prestataire(Prestataire $p): array
    {
        return [
            'id' => $p->id,
            'nom' => $p->nom,
            'metier' => $p->metier,
            'quartier' => $p->quartier?->nom,
            'telephone' => $p->telephone ? Telephone::affichage($p->telephone) : null,
            'note' => (float) $p->note_moyenne,
            'nombre_avis' => $p->nombre_avis,
            'demandes' => $p->demandes_count ?? 0,
            'verifie' => ($p->documents_count ?? 0) > 0 && $p->documents_count === $p->documents_verifies_count,
            'actif' => (bool) $p->actif,
            'en_vedette' => (bool) $p->en_vedette,
            'compte' => $p->utilisateur ? ['nom' => $p->utilisateur->nom, 'telephone' => Telephone::affichage($p->utilisateur->telephone)] : null,
        ];
    }

    private function utilisateur(User $u, ?string $fiche): array
    {
        return [
            'id' => $u->id,
            'nom' => $u->nom,
            'telephone' => Telephone::affichage($u->telephone),
            'email' => $u->email,
            'quartier' => $u->quartier?->nom,
            'demandes' => $u->demandes_count ?? 0,
            'prestataire' => $fiche,
            'roles' => $u->roles->map(fn (Role $r) => ['cle' => $r->cle, 'nom' => $r->nom])->values(),
            'inscrit_le' => $u->created_at?->toIso8601String(),
        ];
    }
}
