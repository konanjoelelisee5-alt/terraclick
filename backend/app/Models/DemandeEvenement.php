<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Un changement de statut d'une demande (journal de suivi). */
#[Fillable(['demande_id', 'user_id', 'auteur', 'statut', 'message'])]
class DemandeEvenement extends Model
{
    public const UPDATED_AT = null;

    public function demande(): BelongsTo
    {
        return $this->belongsTo(Demande::class);
    }
}
