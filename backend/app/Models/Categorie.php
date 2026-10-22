<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['rubrique_id', 'nom', 'slug', 'ordre'])]
class Categorie extends Model
{
    public function rubrique(): BelongsTo
    {
        return $this->belongsTo(Rubrique::class);
    }

    public function prestataires(): BelongsToMany
    {
        return $this->belongsToMany(Prestataire::class);
    }

    /**
     * Catégories ouvertes au public : celles des secteurs actifs (gérés par l'administrateur),
     * ou toutes quand le MVP est coupé (config/mvp.php).
     */
    public function scopeOuvertes(Builder $query): void
    {
        if (config('mvp.actif')) {
            $query->whereIn('categories.slug', Secteur::categoriesOuvertes());
        }
    }
}
