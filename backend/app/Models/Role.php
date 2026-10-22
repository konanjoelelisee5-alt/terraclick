<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/** Un rôle (client, prestataire, manager, admin) et les permissions qu'il donne. */
#[Fillable(['cle', 'nom', 'description'])]
class Role extends Model
{
    /** Le rôle administrateur a toujours toutes les permissions : il ne se modifie pas. */
    public const ADMIN = 'admin';

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class);
    }

    public function utilisateurs(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
