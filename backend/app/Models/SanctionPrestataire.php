<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Journal des décisions de l'équipe sur un prestataire : avertissement, suspension, blocage, réactivation. */
#[Table('sanctions_prestataire')]
#[Fillable(['prestataire_id', 'type', 'motif', 'signalement_id', 'user_id'])]
class SanctionPrestataire extends Model
{
    public const TYPES = [
        'avertissement' => 'Avertissement',
        'suspension' => 'Suspension',
        'blocage' => 'Blocage',
        'reactivation' => 'Réactivation',
    ];

    public function prestataire(): BelongsTo
    {
        return $this->belongsTo(Prestataire::class);
    }

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function signalement(): BelongsTo
    {
        return $this->belongsTo(Signalement::class);
    }
}
