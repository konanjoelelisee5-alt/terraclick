<?php

namespace App\Services;

use App\Models\Demande;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Fait avancer une demande dans son cycle de vie et journalise chaque étape. Une transition
 * n'est permise que depuis les statuts prévus : sinon, un message clair est renvoyé.
 */
class CycleDemande
{
    /**
     * Action → [auteur, statuts de départ permis, statut d'arrivée].
     *
     * @var array<string, array{0: string, 1: list<string>, 2: string}>
     */
    private const TRANSITIONS = [
        'accepter' => ['technicien', ['envoyee'], 'acceptee'],
        'refuser' => ['technicien', ['envoyee'], 'refusee'],
        'demarrer' => ['technicien', ['acceptee'], 'en_cours'],
        'terminer' => ['technicien', ['acceptee', 'en_cours'], 'terminee'],
        'annuler' => ['client', ['envoyee', 'acceptee'], 'annulee'],
        'confirmer' => ['client', ['terminee'], 'confirmee'],
    ];

    private const REFUS = [
        'envoyee' => 'Cette demande attend encore la réponse du technicien.',
        'acceptee' => 'Cette demande est déjà acceptée.',
        'refusee' => 'Cette demande a été refusée.',
        'en_cours' => 'L\'intervention est en cours.',
        'terminee' => 'L\'intervention est déjà marquée terminée.',
        'confirmee' => 'Cette demande est clôturée.',
        'annulee' => 'Cette demande a été annulée.',
    ];

    /**
     * @param  array<string, mixed>  $champs  colonnes à enregistrer avec la transition (estimation, créneau)
     *
     * @throws ValidationException transition impossible depuis le statut actuel
     */
    public function appliquer(Demande $demande, string $action, User $par, ?string $message = null, array $champs = []): Demande
    {
        [$auteur, $depuis, $vers] = self::TRANSITIONS[$action];

        return DB::transaction(function () use ($demande, $action, $auteur, $depuis, $vers, $par, $message, $champs) {
            $demande = Demande::whereKey($demande->id)->lockForUpdate()->firstOrFail();

            if (! in_array($demande->statut, $depuis, true)) {
                throw ValidationException::withMessages([
                    'statut' => self::REFUS[$demande->statut] ?? "Action « {$action} » impossible pour cette demande.",
                ]);
            }

            $demande->update([...$champs, 'statut' => $vers]);
            $demande->evenements()->create([
                'user_id' => $par->id,
                'auteur' => $auteur,
                'statut' => $vers,
                'message' => $message,
            ]);

            return $demande;
        });
    }
}
