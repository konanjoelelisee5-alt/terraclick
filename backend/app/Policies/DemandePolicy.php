<?php

namespace App\Policies;

use App\Models\Demande;
use App\Models\Prestataire;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Qui voit et agit sur une demande : son client, le prestataire à qui elle est envoyée, et
 * l'équipe qui a la permission de voir toutes les demandes. Pour les autres, elle n'existe
 * pas (404), pour ne rien révéler.
 */
class DemandePolicy
{
    public function view(User $user, Demande $demande): Response
    {
        return $this->estSonClient($user, $demande) || $this->estSonPrestataire($user, $demande) || $user->peut('demandes.voir_toutes')
            ? Response::allow()
            : Response::denyAsNotFound('Demande introuvable.');
    }

    /** Annuler, confirmer, signaler : le client de la demande seulement. */
    public function gererCommeClient(User $user, Demande $demande): Response
    {
        return $this->estSonClient($user, $demande) && $user->peut('onglets.suivre')
            ? Response::allow()
            : Response::denyAsNotFound('Demande introuvable.');
    }

    /** Accepter, refuser, faire avancer : le prestataire de la demande, avec l'espace pro. */
    public function traiterCommePrestataire(User $user, Demande $demande): Response
    {
        return $this->estSonPrestataire($user, $demande) && $user->peut('pro.demandes')
            ? Response::allow()
            : Response::denyAsNotFound('Demande introuvable.');
    }

    private function estSonClient(User $user, Demande $demande): bool
    {
        return $demande->user_id === $user->id;
    }

    private function estSonPrestataire(User $user, Demande $demande): bool
    {
        return $demande->prestataire_id !== null && Prestataire::whereKey($demande->prestataire_id)->where('user_id', $user->id)->exists();
    }
}
