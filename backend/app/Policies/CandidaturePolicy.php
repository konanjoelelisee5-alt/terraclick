<?php

namespace App\Policies;

use App\Models\Candidature;
use App\Models\User;

/** Une candidature : son auteur la voit ; l'équipe la voit, ouvre ses pièces et la traite. */
class CandidaturePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->peut('candidatures.voir');
    }

    public function view(User $user, Candidature $candidature): bool
    {
        return $candidature->user_id === $user->id || $user->peut('candidatures.voir');
    }

    /** Pièces jointes : jamais publiques, seulement l'équipe. */
    public function voirPieces(User $user, Candidature $candidature): bool
    {
        return $user->peut('candidatures.voir');
    }

    public function traiter(User $user, Candidature $candidature): bool
    {
        return $user->peut('candidatures.traiter');
    }
}
