<?php

namespace App\Http\Controllers;

use App\Http\Requests\Annuaire\PublierAvisRequest;
use App\Http\Resources\AvisResource;
use App\Models\Avis;
use App\Models\Prestataire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class AvisController extends Controller
{
    /** GET /api/prestataires/{prestataire}/avis */
    public function index(Prestataire $prestataire): AnonymousResourceCollection
    {
        abort_unless($prestataire->estVisible(), 404, 'Ce prestataire n\'est plus référencé.');

        return AvisResource::collection($prestataire->avis()->with('auteur')->latest()->paginate(10));
    }

    /** POST /api/prestataires/{prestataire}/avis */
    public function store(PublierAvisRequest $request, Prestataire $prestataire): JsonResponse
    {
        $user = $request->user();

        abort_unless($prestataire->estVisible(), 404, 'Ce prestataire n\'est plus référencé.');
        abort_unless($user->profilComplet(), 403, 'Complétez votre profil avant de publier un avis.');
        abort_if($prestataire->user_id === $user->id, 403, 'Vous ne pouvez pas noter votre propre fiche.');

        $avis = DB::transaction(function () use ($request, $prestataire, $user) {
            // Verrou : deux avis simultanés ne doivent pas fausser la moyenne.
            $prestataire = Prestataire::lockForUpdate()->find($prestataire->id);

            abort_if(
                $prestataire->avis()->where('user_id', $user->id)->exists(),
                409,
                'Vous avez déjà donné votre avis sur ce prestataire.',
            );

            $notes = $request->validated();
            $note = round(($notes['ponctualite'] + $notes['qualite'] + $notes['prix']) / 3, 1);

            $avis = Avis::create([
                'prestataire_id' => $prestataire->id,
                'user_id' => $user->id,
                'note_ponctualite' => $notes['ponctualite'],
                'note_qualite' => $notes['qualite'],
                'note_prix' => $notes['prix'],
                'note' => $note,
                'commentaire' => $notes['commentaire'] ?? null,
            ]);

            $prestataire->integrerNote($note);

            return $avis;
        });

        return AvisResource::make($avis->load('auteur'))->response()->setStatusCode(201);
    }
}
