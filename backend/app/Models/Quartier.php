<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['ville_id', 'nom', 'slug', 'ordre'])]
class Quartier extends Model
{
    public function ville(): BelongsTo
    {
        return $this->belongsTo(Ville::class);
    }

    public function prestataires(): HasMany
    {
        return $this->hasMany(Prestataire::class);
    }
}
