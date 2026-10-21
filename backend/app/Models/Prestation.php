<?php

namespace App\Models;

use App\Support\Montant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/** Une prestation d'un secteur, son vocabulaire de recherche et son prix indicatif. */
#[Fillable(['secteur', 'nom', 'slug', 'description', 'mots', 'prix_min', 'prix_max', 'unite', 'ordre'])]
class Prestation extends Model
{
    protected function casts(): array
    {
        return [
            'mots' => 'array',
            'prix_min' => 'integer',
            'prix_max' => 'integer',
        ];
    }

    public function prestataires(): BelongsToMany
    {
        return $this->belongsToMany(Prestataire::class)->withPivot('prix_min', 'prix_max')->withTimestamps();
    }

    /** « 7 000 – 20 000 F », avec l'unité s'il y en a une. */
    public function prixAffiche(?int $min = null, ?int $max = null): ?string
    {
        $prix = Montant::fourchette($min ?? $this->prix_min, $max ?? $this->prix_max);

        return $prix && $this->unite ? "{$prix} {$this->unite}" : $prix;
    }
}
