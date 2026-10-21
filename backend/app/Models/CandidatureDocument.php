<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Pièce jointe d'une candidature, rangée sur le disque privé. */
#[Fillable(['candidature_id', 'type', 'fichier', 'mime'])]
class CandidatureDocument extends Model
{
    public function candidature(): BelongsTo
    {
        return $this->belongsTo(Candidature::class);
    }
}
