<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Un quartier, géré par l'équipe : actif ou non (désactivé, il n'est plus proposé aux clients),
 * secteurs disponibles (null : tous) et frais de déplacement éventuels.
 */
#[Fillable(['ville_id', 'nom', 'slug', 'ordre', 'actif', 'secteurs', 'frais_deplacement'])]
class Quartier extends Model
{
    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
            'secteurs' => 'array',
            'frais_deplacement' => 'integer',
        ];
    }

    public function ville(): BelongsTo
    {
        return $this->belongsTo(Ville::class);
    }

    public function prestataires(): HasMany
    {
        return $this->hasMany(Prestataire::class);
    }

    /** Les prestataires qui y interviennent (leurs zones d'intervention). */
    public function intervenants(): BelongsToMany
    {
        return $this->belongsToMany(Prestataire::class, 'prestataire_quartier');
    }

    public function scopeActifs(Builder $query): void
    {
        $query->where('actif', true);
    }

    /** Le secteur est-il proposé dans ce quartier ? Sans liste, tous le sont. */
    public function proposeSecteur(string $cle): bool
    {
        return $this->secteurs === null || in_array($cle, $this->secteurs, true);
    }
}
