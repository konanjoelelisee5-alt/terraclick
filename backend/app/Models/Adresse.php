<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Une adresse enregistrée du client : domicile, bureau ou autre lieu. */
#[Fillable(['user_id', 'type', 'nom', 'quartier_id', 'repere'])]
class Adresse extends Model
{
    public const TYPES = ['domicile', 'bureau', 'autre'];

    public function quartier(): BelongsTo
    {
        return $this->belongsTo(Quartier::class);
    }
}
