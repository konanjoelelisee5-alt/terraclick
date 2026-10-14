<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['nom', 'slug', 'latitude', 'longitude', 'ordre'])]
class Ville extends Model
{
    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function quartiers(): HasMany
    {
        return $this->hasMany(Quartier::class)->orderBy('ordre');
    }
}
