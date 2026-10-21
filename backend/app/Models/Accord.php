<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Une relation aboutie : le client a conclu avec un technicien (onglet, reçu). */
#[Fillable([
    'user_id', 'prestataire_id', 'prestation_id', 'demande_id', 'objet', 'recherche', 'canal',
    'montant', 'date_intervention', 'statut', 'termine_le',
])]
class Accord extends Model
{
    public const CANAUX = ['appel', 'whatsapp', 'message', 'demande'];

    protected function casts(): array
    {
        return [
            'montant' => 'integer',
            'date_intervention' => 'date',
            'termine_le' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::created(function (Accord $accord) {
            $accord->forceFill(['reference' => self::referencePour($accord)])->saveQuietly();
        });
    }

    /** « ACC-2026-00042 » : unique et lisible au téléphone. */
    public static function referencePour(Accord $accord): string
    {
        return sprintf('ACC-%s-%05d', $accord->created_at->format('Y'), $accord->id);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function prestataire(): BelongsTo
    {
        return $this->belongsTo(Prestataire::class);
    }

    public function prestation(): BelongsTo
    {
        return $this->belongsTo(Prestation::class);
    }

    public function demande(): BelongsTo
    {
        return $this->belongsTo(Demande::class);
    }
}
