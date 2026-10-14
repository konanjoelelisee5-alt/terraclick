<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['departement_id', 'nom', 'slug', 'ordre'])]
class Rubrique extends Model
{
    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Categorie::class)->orderBy('ordre');
    }
}
