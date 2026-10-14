<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

#[Fillable(['nom', 'slug', 'icone', 'apercu', 'ordre'])]
class Departement extends Model
{
    public function rubriques(): HasMany
    {
        return $this->hasMany(Rubrique::class)->orderBy('ordre');
    }

    public function categories(): HasManyThrough
    {
        return $this->hasManyThrough(Categorie::class, Rubrique::class);
    }
}
