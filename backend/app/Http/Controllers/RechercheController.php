<?php

namespace App\Http\Controllers;

use App\Models\Recherche;
use App\Services\AnalyseurBesoin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Historique des recherches. Chaque recherche est enregistrée, avec son auteur s'il est
 * connecté ; l'auteur la retrouve sur tous ses appareils (« Onglets récents »). Effacer son
 * historique la masque pour lui seul : l'administration la garde.
 */
class RechercheController extends Controller
{
    public function __construct(private AnalyseurBesoin $analyseur) {}

    /** POST /api/recherches — ouverte aux visiteurs ; le jeton, s'il est fourni, rattache l'auteur. */
    public function store(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'texte' => ['required', 'string', 'max:255'],
            'categorie' => ['nullable', 'string', 'max:255'],
            'ville' => ['nullable', 'string', 'max:60'],
            'appareil_id' => ['nullable', 'string', 'max:64'],
            'appareil' => ['nullable', 'string', 'max:100'],
        ]);

        // Le secteur se déduit de la catégorie choisie, sinon de la phrase.
        $secteurs = $this->analyseur->secteursOuverts();
        $secteur = collect($secteurs)->search(fn (array $s) => in_array($donnees['categorie'] ?? null, $s['categories'], true))
            ?: ($this->analyseur->analyser($donnees['texte'])[0]['cle'] ?? null);

        $recherche = Recherche::create([
            ...$donnees,
            'user_id' => $request->user('sanctum')?->id,
            'secteur' => $secteur ?: null,
        ]);

        return response()->json(['data' => $this->versTableau($recherche)], 201);
    }

    /** GET /api/moi/recherches — l'historique du compte, tous appareils confondus. */
    public function index(Request $request): JsonResponse
    {
        $recherches = Recherche::query()->whereBelongsTo($request->user())->visiblesPourAuteur()
            ->latest()->latest('id')->limit(100)->get();

        return response()->json(['data' => $recherches->map(fn (Recherche $r) => $this->versTableau($r))]);
    }

    /** DELETE /api/moi/recherches — « Supprimer les données de navigation » : masque, sans effacer. */
    public function effacer(Request $request): JsonResponse
    {
        Recherche::query()->whereBelongsTo($request->user())->visiblesPourAuteur()->update(['efface_le' => now()]);

        return response()->json(['message' => 'Votre historique de recherche a été effacé.']);
    }

    /** @return array<string, mixed> */
    private function versTableau(Recherche $recherche): array
    {
        return [
            'id' => $recherche->id,
            'texte' => $recherche->texte,
            'categorie' => $recherche->categorie,
            'secteur' => $recherche->secteur,
            'ville' => $recherche->ville,
            'appareil_id' => $recherche->appareil_id,
            'appareil' => $recherche->appareil,
            'date' => $recherche->created_at?->toIso8601String(),
        ];
    }
}
