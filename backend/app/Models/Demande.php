<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id', 'secteur', 'probleme', 'precision', 'quartier_id', 'repere', 'quand', 'date_souhaitee',
    'mode', 'prestataire_id', 'paiement', 'photos', 'statut',
])]
class Demande extends Model
{
    public const QUAND = ['maintenant', 'aujourdhui', 'demain', 'date'];

    public const MODES = ['recommande', 'choisi'];

    public const PAIEMENTS = ['especes', 'mobile_money'];

    protected function casts(): array
    {
        return [
            'date_souhaitee' => 'date',
            'photos' => 'array',
        ];
    }

    protected static function booted(): void
    {
        // La référence suit l'identifiant : unique et lisible au téléphone (« DEM-2026-00042 »).
        static::created(function (Demande $demande) {
            $demande->forceFill(['reference' => sprintf('DEM-%s-%05d', $demande->created_at->format('Y'), $demande->id)])->saveQuietly();
        });
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function quartier(): BelongsTo
    {
        return $this->belongsTo(Quartier::class);
    }

    public function prestataire(): BelongsTo
    {
        return $this->belongsTo(Prestataire::class);
    }
}
