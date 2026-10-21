<?php

namespace App\Services;

use App\Models\Accord;
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

            $this->suivreAccord($demande, $vers);

            // Fin confirmée par le client : la relation a abouti, elle rejoint ses onglets.
            if ($vers === 'confirmee' && $demande->prestataire_id && ! Accord::where('demande_id', $demande->id)->exists()) {
                Accord::create([
                    'user_id' => $demande->user_id,
                    'prestataire_id' => $demande->prestataire_id,
                    'demande_id' => $demande->id,
                    'objet' => $demande->probleme,
                    'canal' => 'demande',
                    'montant' => $demande->estimation,
                    'statut' => 'termine',
                    'termine_le' => now(),
                ]);
            }

            return $demande;
        });
    }

    /**
     * Commande pressing : le pressing passe à l'étape suivante du suivi (collectée, reçue,
     * en traitement, prête, en livraison, livrée). La commande doit être acceptée ; la
     * dernière étape la marque terminée, le client n'a plus qu'à confirmer.
     *
     * @throws ValidationException commande pas encore acceptée, ou déjà livrée
     */
    public function avancer(Demande $demande, User $par): Demande
    {
        return DB::transaction(function () use ($demande, $par) {
            $demande = Demande::whereKey($demande->id)->lockForUpdate()->firstOrFail();
            $etapes = $demande->etapesPressing();
            $position = $demande->etape === null ? -1 : array_search($demande->etape, $etapes, true);

            if (! $demande->estPressing() || ! in_array($demande->statut, ['acceptee', 'en_cours'], true) || $position === false || ! isset($etapes[$position + 1])) {
                throw ValidationException::withMessages([
                    'etape' => $demande->statut === 'envoyee' ? 'Acceptez d\'abord la commande.' : (self::REFUS[$demande->statut] ?? 'Cette commande n\'a plus d\'étape à suivre.'),
                ]);
            }

            $etape = $etapes[$position + 1];
            $derniere = ! isset($etapes[$position + 2]);
            $demande->update(['etape' => $etape, 'statut' => $derniere ? 'terminee' : 'en_cours']);
            $demande->evenements()->create(['user_id' => $par->id, 'auteur' => 'technicien', 'statut' => $etape]);
            if ($derniere) {
                $this->suivreAccord($demande, 'terminee');
            }

            return $demande;
        });
    }

    /** L'onglet d'une commande suit la demande : annulé avec elle, terminé à la livraison. */
    private function suivreAccord(Demande $demande, string $statut): void
    {
        $accord = Accord::where('demande_id', $demande->id)->first();
        if (! $accord) {
            return;
        }

        if (in_array($statut, ['refusee', 'annulee'], true)) {
            $accord->update(['statut' => 'annule']);
        } elseif (in_array($statut, ['terminee', 'confirmee'], true) && $accord->statut !== 'termine') {
            $accord->update(['statut' => 'termine', 'termine_le' => now()]);
        }
    }
}
