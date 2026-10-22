<?php

namespace App\Http\Controllers;

use App\Models\Demande;
use App\Models\Prestataire;
use App\Models\Quartier;
use App\Models\Secteur;
use App\Models\Ville;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * « Zones et quartiers » : l'équipe ajoute les quartiers, les active ou les désactive, choisit
 * les services proposés dans chacun et ses frais de déplacement, relie les prestataires à leurs
 * zones d'intervention, et voit la couverture : combien de prestataires actifs interviennent,
 * secteur par secteur, dans chaque quartier — les trous d'abord.
 */
class AdminZoneController extends Controller
{
    /** GET /api/admin/zones */
    public function index(): JsonResponse
    {
        $secteurs = Secteur::actifsEnCatalogue();
        $villes = Ville::with(['quartiers' => fn ($q) => $q->orderBy('ordre')->orderBy('nom')])->orderBy('ordre')->get();

        // Pour chaque prestataire visible : ses secteurs et les quartiers où il intervient.
        $couverture = [];
        $parQuartier = [];
        foreach (Prestataire::query()->visibles()->with('categories:id,slug', 'zones:id')->get(['id', 'quartier_id']) as $p) {
            $slugs = $p->categories->pluck('slug')->all();
            $siens = array_keys(array_filter($secteurs, fn (array $s) => array_intersect($slugs, $s['categories'])));
            $quartiers = array_unique(array_filter([$p->quartier_id, ...$p->zones->pluck('id')->all()]));
            foreach ($quartiers as $q) {
                $parQuartier[$q][$p->id] = true;
                foreach ($siens as $cle) {
                    $couverture[$q][$cle] = ($couverture[$q][$cle] ?? 0) + 1;
                }
            }
        }
        $demandes = Demande::where('created_at', '>=', now()->subDays(30))->selectRaw('quartier_id, COUNT(*) AS n')->groupBy('quartier_id')->pluck('n', 'quartier_id');

        $trous = 0;
        $donnees = $villes->map(fn (Ville $v) => [
            'id' => $v->id,
            'nom' => $v->nom,
            'quartiers' => $v->quartiers->map(function (Quartier $q) use ($secteurs, $couverture, $parQuartier, $demandes, &$trous) {
                $lignes = collect($secteurs)->map(fn (array $s, string $cle) => [
                    'cle' => $cle,
                    'nom' => $s['nom'],
                    'metier' => $s['metier'] ?? $s['nom'],
                    'propose' => $q->proposeSecteur($cle),
                    'prestataires' => $couverture[$q->id][$cle] ?? 0,
                ])->values();
                $manques = $q->actif ? $lignes->filter(fn (array $l) => $l['propose'] && $l['prestataires'] === 0)->pluck('metier')->values() : collect();
                $trous += $manques->count();

                return [
                    'id' => $q->id,
                    'nom' => $q->nom,
                    'actif' => $q->actif,
                    'secteurs' => $q->secteurs,
                    'frais_deplacement' => $q->frais_deplacement,
                    'prestataires' => count($parQuartier[$q->id] ?? []),
                    'demandes_30j' => (int) ($demandes[$q->id] ?? 0),
                    'couverture' => $lignes,
                    'manques' => $manques,
                ];
            })->values(),
        ]);

        return response()->json(['data' => [
            'villes' => $donnees,
            'secteurs' => collect($secteurs)->map(fn (array $s, string $cle) => ['cle' => $cle, 'nom' => $s['nom'], 'metier' => $s['metier'] ?? $s['nom']])->values(),
            'trous' => $trous,
        ]]);
    }

    /** POST /api/admin/zones — un quartier de plus, ouvert aux clients. */
    public function store(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'ville_id' => ['required', 'integer', 'exists:villes,id'],
            'nom' => ['required', 'string', 'min:2', 'max:80'],
            'frais_deplacement' => ['nullable', 'integer', 'min:0', 'max:100000'],
        ], ['nom.required' => 'Donnez le nom du quartier.']);
        $slug = Str::slug($donnees['nom']);
        if (Quartier::where('ville_id', $donnees['ville_id'])->where('slug', $slug)->exists()) {
            return response()->json(['message' => 'Ce quartier existe déjà dans cette ville.', 'errors' => ['nom' => ['Ce quartier existe déjà dans cette ville.']]], 422);
        }

        $quartier = Quartier::create([
            ...$donnees,
            'slug' => $slug,
            'actif' => true,
            'ordre' => (int) Quartier::where('ville_id', $donnees['ville_id'])->max('ordre') + 1,
        ]);

        return response()->json(['data' => ['id' => $quartier->id, 'nom' => $quartier->nom]], 201);
    }

    /** PATCH /api/admin/zones/{quartier} — nom, activation, services proposés, frais de déplacement. */
    public function update(Request $request, Quartier $quartier): JsonResponse
    {
        $donnees = $request->validate([
            'nom' => ['sometimes', 'string', 'min:2', 'max:80'],
            'actif' => ['sometimes', 'boolean'],
            'frais_deplacement' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100000'],
            // null : tous les services ; une liste : ceux-là seulement.
            'secteurs' => ['sometimes', 'nullable', 'array'],
            'secteurs.*' => ['string', 'distinct', Rule::in(array_keys(Secteur::catalogue()))],
        ], ['frais_deplacement.integer' => 'Les frais s\'écrivent en francs, sans virgule.']);
        if (isset($donnees['nom'])) {
            $slug = Str::slug($donnees['nom']);
            if (Quartier::where('ville_id', $quartier->ville_id)->where('slug', $slug)->whereKeyNot($quartier->id)->exists()) {
                return response()->json(['message' => 'Ce quartier existe déjà dans cette ville.', 'errors' => ['nom' => ['Ce quartier existe déjà dans cette ville.']]], 422);
            }
            $donnees['slug'] = $slug;
        }
        $quartier->update($donnees);

        return response()->json(['data' => $quartier->only(['id', 'nom', 'actif', 'secteurs', 'frais_deplacement'])]);
    }

    /** PUT /api/admin/prestataires/{prestataire}/zones — ses zones d'intervention. */
    public function zonesPrestataire(Request $request, Prestataire $prestataire): JsonResponse
    {
        Gate::authorize('modifier', $prestataire);
        $ids = $request->validate([
            'quartiers' => ['present', 'array', 'max:60'],
            'quartiers.*' => ['integer', 'distinct', 'exists:quartiers,id'],
        ])['quartiers'];
        $prestataire->zones()->sync($ids);

        return response()->json(['data' => $prestataire->zones()->orderBy('nom')->get(['quartiers.id', 'quartiers.nom'])->map(fn (Quartier $q) => ['id' => $q->id, 'nom' => $q->nom])]);
    }
}
