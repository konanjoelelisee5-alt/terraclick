<?php

namespace App\Http\Controllers;

use App\Http\Resources\DemandeResource;
use App\Models\Commission;
use App\Models\DecisionLitige;
use App\Models\Demande;
use App\Models\DemandeEvenement;
use App\Models\Prestataire;
use App\Models\Reglage;
use App\Models\SanctionPrestataire;
use App\Models\Secteur;
use App\Models\Signalement;
use App\Models\User;
use App\Services\CycleDemande;
use App\Support\Montant;
use App\Support\Telephone;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
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
                    'qui' => ($s->role === 'prestataire' ? 'Prestataire' : 'Client').($s->auteur?->nom ? " · {$s->auteur->nom}" : ''),
                    'type' => 'litige',
                    'titre' => 'Signalement : '.$s->libelle($d),
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
            ->merge($d->decisions()->with('auteur')->get()->map(fn (DecisionLitige $x) => [
                'date' => $x->created_at?->toIso8601String(),
                'qui' => 'Équipe TerraClick'.($x->auteur?->nom ? " · {$x->auteur->nom}" : ''),
                'type' => 'equipe',
                'titre' => 'Décision finale'.($x->mesures ? ' : '.collect($x->mesures)->map(fn (string $m) => mb_strtolower(DecisionLitige::MESURES[$m] ?? $m))->implode(', ') : ''),
                'texte' => $x->decision.($x->remboursement ? ' Remboursement : '.Montant::format($x->remboursement).'.' : ''),
            ]))
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
            ->keys()->reject(fn (string $a) => in_array($a, ['cloturer', 'reintervenir'], true))->values();

        return [
            ...DemandeResource::make($d)->resolve($request),
            ...self::suiviEquipe($d),
            'client' => ['nom' => $d->client?->nom, 'telephone' => $d->client ? Telephone::affichage($d->client->telephone) : null],
            'prestataire_contact' => $d->prestataire ? ['nom' => $d->prestataire->nom, 'telephone' => ($tel = $d->prestataire->telephone ?? $d->prestataire->utilisateur?->telephone) ? Telephone::affichage($tel) : null] : null,
            'actions' => $actions,
            'cloturable' => in_array($d->statut, CycleDemande::ACTIONS_EQUIPE['cloturer'][0], true),
            'reinterventionnable' => in_array($d->statut, CycleDemande::ACTIONS_EQUIPE['reintervenir'][0], true),
            // Les déclarations des deux parties, avec leurs preuves.
            'declarations' => $d->signalements->sortBy('id')->map(fn (Signalement $s) => [
                'id' => $s->id,
                'role' => $s->role,
                'auteur' => $s->auteur?->nom,
                'motif' => $s->motif,
                'motif_libelle' => $s->libelle($d),
                'message' => $s->message,
                'photos' => $s->urlsPhotos(),
                'statut' => $s->statut,
                'reponse' => $s->reponse,
                'date' => $s->created_at?->toIso8601String(),
            ])->values(),
            'decisions' => $d->decisions()->with('auteur')->get()->map(fn (DecisionLitige $x) => [
                'id' => $x->id,
                'decision' => $x->decision,
                'mesures' => collect($x->mesures)->map(fn (string $m) => DecisionLitige::MESURES[$m] ?? $m)->values(),
                'remboursement' => $x->remboursement,
                'par' => $x->auteur?->nom,
                'date' => $x->created_at?->toIso8601String(),
            ]),
            'dossier_prestataire' => $d->prestataire ? self::recidive($d->prestataire) : null,
            'historique' => $historique,
        ];
    }

    /**
     * Un prestataire fautif à répétition : ses litiges tranchés contre lui (avertissement,
     * suspension, blocage, remboursement ou nouvelle intervention) sur la fenêtre de récidive.
     *
     * @return array<string, mixed>
     */
    public static function recidive(Prestataire $p): array
    {
        $depuis = now()->subDays(config('finances.fenetre_recidive'));
        $contre = DecisionLitige::query()->where('created_at', '>=', $depuis)
            ->whereHas('demande', fn ($d) => $d->where('prestataire_id', $p->id))->get()
            ->filter(fn (DecisionLitige $x) => array_intersect($x->mesures, ['remboursement', 'reintervention', 'avertissement', 'suspension', 'blocage']))->count();
        $seuil = (int) Reglage::lire('seuil_recidive');

        return [
            'id' => $p->id,
            'statut' => $p->statut,
            'statut_libelle' => Prestataire::STATUTS[$p->statut] ?? $p->statut,
            'litiges' => Signalement::whereHas('demande', fn ($d) => $d->where('prestataire_id', $p->id))->where('created_at', '>=', $depuis)->distinct('demande_id')->count('demande_id'),
            'contre' => $contre,
            'avertissements' => $p->sanctions()->where('type', 'avertissement')->where('created_at', '>=', $depuis)->count(),
            'fenetre_jours' => config('finances.fenetre_recidive'),
            'seuil' => $seuil,
            'recidive' => $seuil > 0 && $contre >= $seuil,
        ];
    }

    /** GET /api/admin/litiges?etat=ouverts|traites|tous&motif=&role= — toutes les demandes en litige. */
    public function litiges(Request $request): JsonResponse
    {
        $filtres = $request->validate([
            'etat' => ['nullable', Rule::in(['ouverts', 'traites', 'tous'])],
            'motif' => ['nullable', 'string', 'max:12'],
            'role' => ['nullable', Rule::in(['client', 'prestataire'])],
        ]);
        $etat = $filtres['etat'] ?? 'ouverts';
        $filtre = fn ($s) => $s
            ->when($filtres['motif'] ?? null, fn ($q, $m) => $q->where('motif', $m))
            ->when($filtres['role'] ?? null, fn ($q, $r) => $q->where('role', $r));

        $demandes = Demande::query()
            ->whereHas('signalements', $filtre)
            ->when($etat === 'ouverts', fn ($q) => $q->whereHas('signalements', fn ($s) => $s->where('statut', 'ouvert')))
            ->when($etat === 'traites', fn ($q) => $q->whereDoesntHave('signalements', fn ($s) => $s->where('statut', 'ouvert')))
            ->with(['client', 'prestataire', 'signalements', 'decisions'])
            ->latest('updated_at')->limit(100)->get();

        return response()->json(['data' => $demandes->map(fn (Demande $d) => [
            'id' => $d->id,
            'reference' => $d->reference,
            'secteur' => Secteur::nomDe($d->secteur),
            'client' => $d->client?->nom,
            'prestataire' => $d->prestataire?->nom,
            'statut_libelle' => DemandeResource::libelleStatut($d->statut),
            'motifs' => $d->signalements->map(fn (Signalement $s) => ['role' => $s->role, 'libelle' => $s->libelle($d)])->unique('libelle')->values(),
            'ouverts' => $d->signalements->where('statut', 'ouvert')->count(),
            'preuves' => $d->signalements->sum(fn (Signalement $s) => count($s->photos ?? [])) + count($d->photos ?? []),
            'depuis' => $d->signalements->min('created_at')?->toIso8601String(),
            'decision' => $d->decisions->first()?->decision,
            'recidive' => $d->prestataire ? self::recidive($d->prestataire)['recidive'] : false,
        ])]);
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
            ->orderByRaw('(quartier_id = ? OR EXISTS (SELECT 1 FROM prestataire_quartier pq WHERE pq.prestataire_id = prestataires.id AND pq.quartier_id = ?)) DESC', [$demande->quartier_id, $demande->quartier_id])
            ->orderByDesc('note_moyenne')->orderBy('nom')
            ->limit(30)->get();

        return response()->json(['data' => $liste->map(fn (Prestataire $p) => [
            'id' => $p->id,
            'nom' => $p->nom,
            'metier' => $p->metier,
            'quartier' => $p->quartier?->nom,
            'meme_quartier' => $p->quartier_id === $demande->quartier_id || $p->zones()->whereKey($demande->quartier_id)->exists(),
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
            'mesures' => ['sometimes', 'array'],
            'mesures.*' => ['string', 'distinct', Rule::in(array_keys(DecisionLitige::MESURES))],
            'remboursement' => ['nullable', 'integer', 'min:1', 'max:10000000'],
        ], [
            'decision.required' => 'Écrivez la décision : le client et le dossier du prestataire la gardent.',
            'remboursement.min' => 'Indiquez le montant remboursé au client.',
        ]);
        // « avertir » : l'ancienne case, devenue une mesure comme les autres.
        $mesures = array_values(array_unique([...($donnees['mesures'] ?? []), ...(($donnees['avertir'] ?? false) ? ['avertissement'] : [])]));
        $surPrestataire = array_intersect($mesures, ['avertissement', 'suspension', 'blocage', 'reintervention']);

        if ($surPrestataire && ! $demande->prestataire_id) {
            throw ValidationException::withMessages(['mesures' => 'Cette demande n\'a pas de prestataire.']);
        }
        if (in_array('remboursement', $mesures, true) && empty($donnees['remboursement'])) {
            throw ValidationException::withMessages(['remboursement' => 'Indiquez le montant remboursé au client.']);
        }
        if (in_array('reintervention', $mesures, true) && $donnees['issue'] !== 'aucune') {
            throw ValidationException::withMessages(['issue' => 'Une nouvelle intervention garde la demande ouverte : ni annulation ni clôture.']);
        }
        if (in_array('suspension', $mesures, true) && in_array('blocage', $mesures, true)) {
            throw ValidationException::withMessages(['mesures' => 'Choisissez la suspension ou le blocage, pas les deux.']);
        }
        foreach (['suspension' => 'suspendu', 'blocage' => 'bloque'] as $mesure => $statut) {
            if (in_array($mesure, $mesures, true)) {
                Gate::authorize('changerStatut', [$demande->prestataire, $statut]);
            }
        }

        DB::transaction(function () use ($request, $demande, $donnees, $mesures) {
            $ouverts = $demande->signalements()->where('statut', 'ouvert')->get();
            foreach ($ouverts as $s) {
                $s->update(['statut' => 'traite', 'reponse' => $donnees['decision'], 'traite_par' => $request->user()->id, 'traite_le' => now()]);
            }
            $demande->evenements()->create(['user_id' => $request->user()->id, 'auteur' => 'equipe', 'statut' => 'litige_resolu', 'message' => $donnees['decision']]);

            if ($donnees['issue'] !== 'aucune') {
                $this->cycle->parEquipe($demande, $donnees['issue'], $request->user(), $donnees['decision']);
            }
            if (in_array('reintervention', $mesures, true)) {
                $this->cycle->parEquipe($demande, 'reintervenir', $request->user(), $donnees['decision']);
            }
            $motif = "Litige {$demande->reference} : {$donnees['decision']}";
            if (in_array('avertissement', $mesures, true)) {
                $demande->prestataire->sanctions()->create([
                    'type' => 'avertissement',
                    'motif' => $motif,
                    'signalement_id' => $ouverts->first()?->id ?? $demande->signalements()->latest('id')->value('id'),
                    'user_id' => $request->user()->id,
                ]);
            }
            foreach (['suspension' => 'suspendu', 'blocage' => 'bloque'] as $mesure => $statut) {
                if (in_array($mesure, $mesures, true) && $demande->prestataire->statut !== $statut) {
                    $demande->prestataire->changerStatut($statut, $motif, $request->user());
                }
            }
            // Remboursé : la mission ne rapporte plus de commission.
            if (in_array('remboursement', $mesures, true)) {
                Commission::where('demande_id', $demande->id)->delete();
            }
            $demande->decisions()->create([
                'user_id' => $request->user()->id,
                'decision' => $donnees['decision'],
                'mesures' => $mesures,
                'issue' => $donnees['issue'],
                'remboursement' => in_array('remboursement', $mesures, true) ? $donnees['remboursement'] : null,
            ]);
        });

        return response()->json(['data' => self::detail($request, $demande->refresh())]);
    }
}
