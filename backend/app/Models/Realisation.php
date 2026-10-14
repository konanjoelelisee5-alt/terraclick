<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['prestataire_id', 'legende', 'image', 'ordre'])]
class Realisation extends Model
{
    public function prestataire(): BelongsTo
    {
        return $this->belongsTo(Prestataire::class);
    }
}
