<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

/** Les comptes, vus par l'équipe ; les rôles, changés par qui en a la permission. */
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->peut('utilisateurs.voir');
    }

    /**
     * Changer les rôles d'un compte. Seul un administrateur donne ou retire le rôle
     * administrateur, et personne ne se retire le sien (l'équipe ne doit jamais se fermer la porte).
     *
     * @param  list<string>  $roles  les rôles demandés
     */
    public function changerRoles(User $user, User $cible, array $roles): Response
    {
        if (! $user->peut('utilisateurs.roles')) {
            return Response::deny('Votre compte ne peut pas changer les rôles.');
        }
        $touche = in_array('admin', $roles, true) !== $cible->aRole('admin');
        if ($touche && ! $user->aRole('admin')) {
            return Response::deny('Seul un administrateur donne ou retire le rôle administrateur.');
        }
        if ($cible->is($user) && $user->aRole('admin') && ! in_array('admin', $roles, true)) {
            return Response::deny('Vous ne pouvez pas retirer votre propre rôle administrateur.');
        }

        return Response::allow();
    }
}
