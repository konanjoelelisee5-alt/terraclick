<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Une recherche faite dans l'application (historique, onglets, statistiques d'administration). */
#[Fillable(['user_id', 'appareil_id', 'appareil', 'texte', 'categorie', 'secteur', 'ville'])]
class Recherche extends Model
{
    protected function casts(): array
    {
        return [
            'efface_le' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Recherches que leur auteur n'a pas effacées de son historique. */
    public function scopeVisiblesPourAuteur(Builder $query): void
    {
        $query->whereNull('efface_le');
    }
}
