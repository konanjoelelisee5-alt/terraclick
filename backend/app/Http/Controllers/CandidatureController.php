<?php

namespace App\Http\Controllers;

use App\Http\Requests\Candidature\EnvoyerCandidatureRequest;
use App\Http\Resources\CandidatureResource;
use App\Models\Candidature;
use App\Models\Prestataire;
use App\Services\AnalyseurBesoin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** « Devenir prestataire » : ce qu'il faut fournir, l'envoi du dossier et son suivi. */
class CandidatureController extends Controller
{
    /** GET /api/candidature/exigences — types, pièces, services et paiements, pour le formulaire. */
    public function exigences(AnalyseurBesoin $analyseur): JsonResponse
    {
        $liste = fn (array $elements) => collect($elements)->map(fn ($v, string $cle) => ['cle' => $cle, ...(is_array($v) ? $v : ['nom' => $v])])->values();
        $pieces = fn (string $type) => collect(Candidature::documentsPour($type))
            ->map(fn (array $d, string $cle) => ['cle' => $cle, 'nom' => $d[0], 'obligatoire' => $d[1], 'aide' => $d[2]])->values();

        return response()->json(['data' => [
            'types' => $liste(config('candidature.types')),
            'documents' => collect(config('candidature.types'))->keys()->mapWithKeys(fn (string $t) => [$t => $pieces($t)]),
            'secteurs' => collect($analyseur->secteursOuverts())->except('pressing')->map(fn (array $s, string $cle) => ['cle' => $cle, 'nom' => $s['nom']])->values(),
            'services_pressing' => collect(config('pressing.services'))->map(fn (array $s, string $cle) => ['cle' => $cle, 'nom' => $s['nom']])->values(),
            'paiements' => $liste(config('candidature.paiements')),
        ]]);
    }

    /** GET /api/moi/candidature — la dernière candidature du compte, ou null. */
    public function moi(Request $request): JsonResponse
    {
        $candidature = Candidature::where('user_id', $request->user()->id)->with('quartier', 'documents')->latest('id')->first();

        return response()->json(['data' => $candidature ? CandidatureResource::make($candidature) : null]);
    }

    /**
     * POST /api/moi/candidature — envoi du dossier (multipart). Une seule candidature en cours ;
     * après un refus, le candidat corrige et renvoie un nouveau dossier.
     */
    public function store(EnvoyerCandidatureRequest $request): JsonResponse
    {
        $user = $request->user();
        abort_if(Prestataire::where('user_id', $user->id)->exists(), 409, 'Votre compte est déjà relié à une fiche de prestataire.');
        abort_if(
            Candidature::where('user_id', $user->id)->whereIn('statut', ['en_attente', 'validee'])->exists(),
            409,
            'Votre candidature est déjà en cours de vérification.',
        );
        abort_if(Candidature::where('user_id', $user->id)->where('statut', 'rejetee')->exists(), 409, 'Votre candidature a été rejetée par l\'équipe TerraClick.');

        $donnees = $request->safe()->except(['documents', 'engagement']);
        $candidature = DB::transaction(function () use ($request, $user, $donnees) {
            $candidature = Candidature::create([
                ...$donnees,
                'user_id' => $user->id,
                'telephone' => $user->telephone,
                // Pressing : un seul service, le sien.
                'secteurs' => $donnees['type'] === 'pressing' ? ['pressing'] : array_values(array_unique($donnees['secteurs'])),
                'quartiers' => array_values(array_unique(array_map('intval', $donnees['quartiers']))),
                'details' => $donnees['details'] ?? null,
            ]);

            foreach ($request->file('documents', []) as $type => $fichier) {
                $candidature->documents()->create([
                    'type' => $type,
                    // Disque privé : jamais servi tel quel, seulement à l'équipe, à travers l'API.
                    'fichier' => $fichier->storeAs("candidatures/{$candidature->id}", $type.'.'.$fichier->extension(), 'local'),
                    'mime' => $fichier->getMimeType(),
                ]);
            }

            return $candidature;
        });

        return CandidatureResource::make($candidature->refresh()->load('quartier', 'documents'))
            ->additional(['message' => 'Votre candidature est envoyée. L\'équipe TerraClick la vérifie et vous répond.'])
            ->response()
            ->setStatusCode(201);
    }
}
