<?php

namespace App\Policies;

use App\Models\Signalement;
use App\Models\User;

/** Les signalements des clients, vus et traités par l'équipe. */
class SignalementPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->peut('signalements.voir');
    }

    public function traiter(User $user, Signalement $signalement): bool
    {
        return $user->peut('signalements.traiter');
    }
}
