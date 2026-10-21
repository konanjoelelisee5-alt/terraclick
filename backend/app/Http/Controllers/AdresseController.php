<?php

namespace App\Http\Controllers;

use App\Models\Adresse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

/** Adresses enregistrées du client connecté : domicile, bureau ou autre lieu. */
class AdresseController extends Controller
{
    private const NOMS = ['domicile' => 'Domicile', 'bureau' => 'Bureau'];

    /** GET /api/moi/adresses */
    public function index(Request $request): JsonResponse
    {
        $adresses = Adresse::where('user_id', $request->user()->id)->with('quartier')->oldest('id')->get();

        return response()->json(['data' => $adresses->map($this->format(...))]);
    }

    /** POST /api/moi/adresses — « Autre » demande un nom (« Chez maman »). */
    public function store(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'type' => ['required', Rule::in(Adresse::TYPES)],
            'nom' => [Rule::requiredIf($request->input('type') === 'autre'), 'nullable', 'string', 'max:40'],
            'quartier_id' => ['required', 'integer', 'exists:quartiers,id'],
            'repere' => ['nullable', 'string', 'max:160'],
        ], [
            'nom.required' => 'Donnez un nom à ce lieu.',
            'quartier_id.required' => 'Indiquez le quartier.',
        ]);
        abort_if(Adresse::where('user_id', $request->user()->id)->count() >= 10, 422, 'Dix adresses au plus.');

        $adresse = Adresse::create([
            ...$donnees,
            'nom' => trim((string) ($donnees['nom'] ?? '')) ?: self::NOMS[$donnees['type']] ?? 'Autre lieu',
            'user_id' => $request->user()->id,
        ]);

        return response()->json(['data' => $this->format($adresse->load('quartier'))], 201);
    }

    /** DELETE /api/moi/adresses/{adresse} */
    public function destroy(Request $request, Adresse $adresse): Response
    {
        abort_unless($adresse->user_id === $request->user()->id, 404, 'Adresse introuvable.');
        $adresse->delete();

        return response()->noContent();
    }

    private function format(Adresse $a): array
    {
        return [
            'id' => $a->id,
            'type' => $a->type,
            'nom' => $a->nom,
            'quartier' => ['id' => $a->quartier_id, 'nom' => $a->quartier?->nom],
            'repere' => $a->repere,
        ];
    }
}
