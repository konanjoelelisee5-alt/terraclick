<?php

namespace App\Policies;

use App\Models\Prestataire;
use App\Models\User;

/** Gestion des fiches par l'équipe : suspendre ou réactiver, mettre en avant. */
class PrestatairePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->peut('prestataires.voir');
    }

    public function suspendre(User $user, Prestataire $prestataire): bool
    {
        return $user->peut('prestataires.suspendre');
    }

    public function mettreEnAvant(User $user, Prestataire $prestataire): bool
    {
        return $user->peut('prestataires.mettre_en_avant');
    }
}
