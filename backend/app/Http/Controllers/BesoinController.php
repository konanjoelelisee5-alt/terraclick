<?php

namespace App\Http\Controllers;

use App\Http\Resources\PrestataireResource;
use App\Models\Prestataire;
use App\Models\Reglage;
use App\Services\AnalyseurBesoin;
use App\Support\Montant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * L'assistant de besoin, en accès libre : services proposés, lecture de la recherche,
 * techniciens recommandés. Seul l'envoi de la demande demande un compte (DemandeController).
 */
class BesoinController extends Controller
{
    public function __construct(private AnalyseurBesoin $analyseur) {}

    /** GET /api/secteurs — les services ouverts et leurs problèmes types. */
    public function secteurs(): JsonResponse
    {
        // Dans l'ordre d'affichage choisi par l'administrateur, avec de quoi les dessiner.
        $secteurs = collect($this->analyseur->secteursOuverts())->map(fn (array $s, string $cle) => [
            'cle' => $cle,
            'nom' => $s['nom'],
            'metier' => $s['metier'] ?? $s['nom'],
            'description' => $s['description'] ?? null,
            'icone' => $s['icone'] ?? 'wrench',
            'couleur' => $s['couleur'] ?? null,
            'categorie' => $s['categories'][0],
            'problemes' => $s['problemes'],
        ])->values();

        return response()->json(['data' => $secteurs]);
    }

    /** GET /api/reglages — ce que le client doit savoir des règles de la plateforme. */
    public function reglages(): JsonResponse
    {
        return response()->json(['data' => [
            'paiements' => collect(Reglage::paiements())->map(fn (string $cle) => ['valeur' => $cle, 'libelle' => config("finances.moyens.{$cle}.0"), 'detail' => config("finances.moyens.{$cle}.1")])->values(),
            'negociation_directe' => (bool) Reglage::lire('negociation_directe'),
        ]]);
    }

    /**
     * GET /api/analyse?q= — ce que la barre de recherche a compris : le secteur (un seul,
     * sinon l'assistant demande lequel) et, s'il est cité, le problème type.
     */
    public function analyse(Request $request): JsonResponse
    {
        $q = (string) $request->validate(['q' => ['required', 'string', 'max:255']])['q'];
        $secteurs = $this->analyseur->analyser($q);
        $seul = count($secteurs) === 1 ? $secteurs[0]['cle'] : null;

        return response()->json([
            'secteurs' => array_map(fn (array $s) => ['cle' => $s['cle'], 'nom' => $s['nom']], $secteurs),
            'probleme' => $seul ? $this->analyseur->problemeReconnu($q, $seul) : null,
        ]);
    }

    /**
     * GET /api/recommandations?secteur=&quartier= — les meilleurs techniciens pour ce besoin :
     * ceux du quartier d'abord, puis les mis en avant, les mieux notés et les plus réactifs.
     * `exclure[]` écarte ceux déjà proposés (« Demander d'autres techniciens »).
     */
    public function recommandations(Request $request): AnonymousResourceCollection
    {
        $secteurs = $this->analyseur->secteursOuverts();
        $criteres = $request->validate([
            'secteur' => ['required', Rule::in(array_keys($secteurs))],
            'quartier' => ['nullable', 'integer', 'exists:quartiers,id'],
            'exclure' => ['nullable', 'array'],
            'exclure.*' => ['integer'],
            'nombre' => ['nullable', 'integer', 'min:1', 'max:10'],
        ]);
        $categories = $secteurs[$criteres['secteur']]['categories'];
        $quartier = (int) ($criteres['quartier'] ?? 0);

        $prestataires = Prestataire::query()->visibles()
            ->whereHas('categories', fn (Builder $c) => $c->whereIn('categories.slug', $categories))
            ->whereNotIn('id', $criteres['exclure'] ?? [])
            ->with('quartier')
            ->withCount(Prestataire::comptesDocuments())
            // Ceux qui interviennent dans le quartier d'abord : le leur, ou l'une de leurs zones.
            ->orderByRaw('(quartier_id = ? OR EXISTS (SELECT 1 FROM prestataire_quartier pq WHERE pq.prestataire_id = prestataires.id AND pq.quartier_id = ?)) DESC', [$quartier, $quartier])
            ->orderByDesc('en_vedette')
            ->orderByDesc('note_moyenne')
            ->orderByDesc('nombre_avis')
            ->orderByRaw('delai_reponse_minutes IS NULL')
            ->orderBy('delai_reponse_minutes')
            ->orderBy('id')
            ->limit($criteres['nombre'] ?? 3)
            ->get();

        return PrestataireResource::collection($prestataires);
    }

    /** GET /api/pressing/articles — articles du pack pressing et leur prix indicatif par pièce. */
    public function articlesPressing(): JsonResponse
    {
        return response()->json(['data' => collect(config('pressing.articles'))
            ->map(fn (array $a, string $cle) => [
                'cle' => $cle,
                'nom' => $a['nom'],
                'prix' => $a['prix'],
                'prix_affichage' => Montant::format($a['prix']),
                'categorie' => $a['categorie'],
                'categorie_nom' => config("pressing.categories.{$a['categorie']}"),
            ])
            ->values()]);
    }

    /** GET /api/pressing/options — services, express, modes de dépôt, heures et motifs de signalement. */
    public function optionsPressing(): JsonResponse
    {
        $liste = fn (array $elements) => collect($elements)->map(fn (array $e, string $cle) => ['cle' => $cle, ...$e])->values();

        return response()->json(['data' => [
            'services' => $liste(config('pressing.services')),
            'express' => config('pressing.express'),
            'depots' => $liste(config('pressing.depots')),
            'heures' => config('pressing.heures'),
            'motifs' => collect(config('pressing.motifs_signalement'))->map(fn (string $nom, string $cle) => ['cle' => $cle, 'nom' => $nom])->values(),
        ]]);
    }
}
