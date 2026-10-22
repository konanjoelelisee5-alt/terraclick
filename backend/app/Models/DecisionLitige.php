<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** La décision finale d'un litige et les mesures prises. */
#[Table('decisions_litige')]
#[Fillable(['demande_id', 'user_id', 'decision', 'mesures', 'issue', 'remboursement'])]
class DecisionLitige extends Model
{
    public const MESURES = [
        'remboursement' => 'Remboursement du client',
        'reintervention' => 'Nouvelle intervention',
        'avertissement' => 'Avertissement du prestataire',
        'suspension' => 'Suspension du prestataire',
        'blocage' => 'Blocage du prestataire',
    ];

    protected function casts(): array
    {
        return ['mesures' => 'array', 'remboursement' => 'integer'];
    }

    public function demande(): BelongsTo
    {
        return $this->belongsTo(Demande::class);
    }

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
