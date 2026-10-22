<?php

namespace App\Http\Controllers;

use App\Models\Avis;
use App\Models\Candidature;
use App\Models\Commission;
use App\Models\Demande;
use App\Models\Quartier;
use App\Models\Recherche;
use App\Models\Secteur;
use App\Models\Signalement;
use App\Models\User;
use App\Models\Ville;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/**
 * Tableau de bord de l'équipe : indicateurs de la période comparés à la période précédente,
 * courbe jour par jour, parcours d'une demande (envoyée → confirmée), clients actifs, demandes
 * par secteur et par quartier — pour une ville ou toutes.
 */
class AdminTableauController extends Controller
{
    /** Statuts atteints après l'acceptation, la fin de l'intervention, la confirmation. */
    private const ACCEPTEES = ['acceptee', 'en_cours', 'terminee', 'confirmee'];

    private const TERMINEES = ['terminee', 'confirmee'];

    /** GET /api/admin/tableau?jours=7|30|90&ville= */
    public function __invoke(Request $request): JsonResponse
    {
        $criteres = $request->validate([
            'jours' => ['nullable', 'integer', Rule::in([7, 30, 90])],
            'ville' => ['nullable', 'integer', 'exists:villes,id'],
        ]);
        $jours = (int) ($criteres['jours'] ?? 7);
        $ville = $criteres['ville'] ?? null;
        $au = now()->endOfDay();
        $du = now()->subDays($jours - 1)->startOfDay();
        $avantDu = $du->copy()->subDays($jours);
        $avantAu = $du->copy()->subSecond();

        $demandes = fn (Carbon $a, Carbon $b) => Demande::query()
            ->whereBetween('demandes.created_at', [$a, $b])
            ->when($ville, fn (Builder $q, $v) => $q->whereHas('quartier', fn (Builder $x) => $x->where('ville_id', $v)));
        $accomplies = fn (Carbon $a, Carbon $b) => Demande::query()->where('statut', 'confirmee')
            ->whereBetween('updated_at', [$a, $b])
            ->when($ville, fn (Builder $q, $v) => $q->whereHas('quartier', fn (Builder $x) => $x->where('ville_id', $v)))
            ->with('accord')->get();
        $encaisse = fn ($liste) => (int) $liste->sum(fn (Demande $d) => Commission::montantMission($d) ?? 0);

        $actuelles = $demandes($du, $au)->get(['id', 'statut', 'secteur', 'quartier_id', 'user_id', 'created_at']);
        $precedentes = $demandes($avantDu, $avantAu)->get(['id', 'statut', 'secteur', 'quartier_id']);
        $faites = $accomplies($du, $au);
        $faitesAvant = $accomplies($avantDu, $avantAu);
        $taux = fn ($liste) => $liste->count() ? round($liste->where('statut', 'annulee')->count() * 100 / $liste->count(), 1) : 0.0;
        $clients = fn (Carbon $a, Carbon $b) => User::whereBetween('created_at', [$a, $b])
            ->whereDoesntHave('roles', fn (Builder $r) => $r->whereIn('cle', config('acces.roles_equipe')))->count();

        $kpis = [
            ['cle' => 'demandes', 'libelle' => 'Demandes', 'format' => 'nombre', 'valeur' => $actuelles->count(), 'precedent' => $precedentes->count(), 'bon' => 'hausse'],
            ['cle' => 'missions', 'libelle' => 'Missions accomplies', 'format' => 'nombre', 'valeur' => $faites->count(), 'precedent' => $faitesAvant->count(), 'bon' => 'hausse'],
            ['cle' => 'encaisse', 'libelle' => 'Montant encaissé', 'format' => 'francs', 'valeur' => $encaisse($faites), 'precedent' => $encaisse($faitesAvant), 'bon' => 'hausse'],
            ['cle' => 'clients', 'libelle' => 'Nouveaux inscrits', 'format' => 'nombre', 'valeur' => $clients($du, $au), 'precedent' => $clients($avantDu, $avantAu), 'bon' => 'hausse'],
            ['cle' => 'annulation', 'libelle' => 'Taux d\'annulation', 'format' => 'pourcent', 'valeur' => $taux($actuelles), 'precedent' => $taux($precedentes), 'bon' => 'baisse'],
        ];

        // Jour par jour : demandes et annulations.
        $courbe = [];
        for ($jour = $du->copy(); $jour->lte($au); $jour->addDay()) {
            $duJour = $actuelles->filter(fn (Demande $d) => $d->created_at->isSameDay($jour));
            $courbe[] = ['date' => $jour->toDateString(), 'demandes' => $duJour->count(), 'annulees' => $duJour->where('statut', 'annulee')->count()];
        }

        $envoyees = $actuelles->count();
        $etape = fn (string $libelle, int $n) => ['libelle' => $libelle, 'nombre' => $n, 'part' => $envoyees ? (int) round($n * 100 / $envoyees) : 0];

        $secteurs = Secteur::catalogue();
        $parSecteur = $actuelles->countBy('secteur');
        $quartiers = $actuelles->countBy('quartier_id');
        $quartiersAvant = $precedentes->countBy('quartier_id');
        $montantsQuartier = $faites->groupBy('quartier_id')->map(fn ($l) => $encaisse($l));
        $noms = Quartier::whereIn('id', $quartiers->keys()->merge($montantsQuartier->keys()))->pluck('nom', 'id');

        $actifs = $actuelles->pluck('user_id')->unique()->count();
        $inscrits = User::whereDoesntHave('roles', fn (Builder $r) => $r->whereIn('cle', config('acces.roles_equipe')))->count();

        return response()->json(['data' => [
            'periode' => ['jours' => $jours, 'du' => $du->toDateString(), 'au' => $au->toDateString()],
            'villes' => Ville::orderBy('ordre')->get(['id', 'nom']),
            'a_traiter' => [
                'candidatures' => Candidature::where('statut', 'en_attente')->count(),
                'signalements' => Signalement::where('statut', 'ouvert')->count(),
                'demandes_sans_reponse' => Demande::where('statut', 'envoyee')->where('created_at', '<=', now()->subHours(2))->count(),
            ],
            'kpis' => $kpis,
            'courbe' => $courbe,
            'totaux_courbe' => ['demandes' => $envoyees, 'annulees' => $actuelles->where('statut', 'annulee')->count(), 'demandes_avant' => $precedentes->count(), 'annulees_avant' => $precedentes->where('statut', 'annulee')->count()],
            'entonnoir' => [
                $etape('Envoyées', $envoyees),
                $etape('Acceptées', $actuelles->whereIn('statut', self::ACCEPTEES)->count()),
                $etape('Terminées', $actuelles->whereIn('statut', self::TERMINEES)->count()),
                $etape('Confirmées', $actuelles->where('statut', 'confirmee')->count()),
            ],
            'clients' => ['actifs' => $actifs, 'inscrits' => $inscrits],
            'activite' => [
                'encaisse' => $encaisse($faites),
                'panier_moyen' => $faites->count() ? (int) round($encaisse($faites) / $faites->count()) : 0,
                'recherches' => Recherche::whereBetween('created_at', [$du, $au])->count(),
                'avis' => Avis::whereBetween('created_at', [$du, $au])->count(),
            ],
            'secteurs' => collect($secteurs)->map(fn (array $s, string $cle) => ['cle' => $cle, 'nom' => $s['nom'], 'couleur' => $s['couleur'], 'nombre' => (int) ($parSecteur[$cle] ?? 0)])
                ->filter(fn (array $s) => $s['nombre'] > 0 || ($secteurs[$s['cle']]['actif'] ?? false))
                ->sortByDesc('nombre')->values(),
            'quartiers' => $quartiers->keys()->merge($montantsQuartier->keys())->unique()
                ->map(fn ($id) => [
                    'nom' => $noms[$id] ?? '—',
                    'demandes' => (int) ($quartiers[$id] ?? 0),
                    'tendance' => ($quartiers[$id] ?? 0) <=> ($quartiersAvant[$id] ?? 0),
                    'encaisse' => (int) ($montantsQuartier[$id] ?? 0),
                ])->sortByDesc('demandes')->take(6)->values(),
        ]]);
    }
}
