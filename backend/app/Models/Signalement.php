<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Un problème signalé par le client sur une commande (motifs : config/pressing.php). */
#[Fillable(['demande_id', 'user_id', 'motif', 'message', 'statut'])]
class Signalement extends Model
{
    public function demande(): BelongsTo
    {
        return $this->belongsTo(Demande::class);
    }
}
