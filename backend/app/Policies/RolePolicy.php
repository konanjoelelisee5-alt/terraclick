<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/** La matrice des rôles et permissions : réservée à qui peut gérer les rôles. */
class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->peut('roles.gerer');
    }

    /** Le rôle administrateur garde toujours tout : il ne se modifie pas. */
    public function update(User $user, Role $role): Response
    {
        if (! $user->peut('roles.gerer')) {
            return Response::deny('Votre compte ne peut pas gérer les rôles.');
        }

        return $role->cle === Role::ADMIN
            ? Response::deny('Le rôle administrateur a toujours toutes les permissions.')
            : Response::allow();
    }
}
