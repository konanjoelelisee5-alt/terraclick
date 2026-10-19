<?php

namespace App\Http\Controllers;

use App\Http\Requests\Demande\CreerDemandeRequest;
use App\Http\Resources\DemandeResource;
use App\Models\Demande;
use App\Models\Prestataire;
use App\Services\AnalyseurBesoin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Demandes d'intervention du client connecté. */
class DemandeController extends Controller
{
    public function __construct(private AnalyseurBesoin $analyseur) {}

    /** POST /api/demandes — « Confirmer ma demande ». Photos en multipart, trois au plus. */
    public function store(CreerDemandeRequest $request): JsonResponse
    {
        $donnees = $request->safe()->except('photos');

        if ($id = $donnees['prestataire_id'] ?? null) {
            $this->verifierTechnicien(Prestataire::findOrFail($id), $donnees['secteur']);
        }

        $demande = DB::transaction(function () use ($request, $donnees) {
            $demande = Demande::create([...$donnees, 'user_id' => $request->user()->id]);

            $photos = collect($request->file('photos', []))
                ->map(fn ($photo) => $photo->store("demandes/{$demande->id}", 'public'))
                ->all();
            if ($photos) {
                $demande->update(['photos' => $photos]);
            }

            return $demande;
        });

        return DemandeResource::make($demande->refresh()->load('quartier', 'prestataire.quartier'))
            ->additional(['message' => 'Votre demande est envoyée. Vous recevrez une réponse dans environ 10 minutes.'])
            ->response()
            ->setStatusCode(201);
    }

    /** GET /api/demandes/{demande} — seul son auteur la voit. */
    public function show(Request $request, Demande $demande): DemandeResource
    {
        abort_unless($demande->user_id === $request->user()->id, 404, 'Demande introuvable.');

        return DemandeResource::make($demande->load('quartier', 'prestataire.quartier'));
    }

    /** Le technicien demandé doit être référencé et exercer le service demandé. */
    private function verifierTechnicien(Prestataire $prestataire, string $secteur): void
    {
        $categories = $this->analyseur->secteursOuverts()[$secteur]['categories'] ?? [];

        if (! $prestataire->estVisible() || ! $prestataire->categories()->whereIn('categories.slug', $categories)->exists()) {
            throw ValidationException::withMessages([
                'prestataire_id' => 'Ce technicien ne propose pas ce service.',
            ]);
        }
    }
}
