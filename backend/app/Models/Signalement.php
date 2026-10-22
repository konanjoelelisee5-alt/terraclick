<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Un problème signalé par le client sur une commande (motifs : config/pressing.php). */
#[Fillable(['demande_id', 'user_id', 'motif', 'message', 'statut', 'reponse', 'traite_par', 'traite_le'])]
class Signalement extends Model
{
    protected function casts(): array
    {
        return ['traite_le' => 'datetime'];
    }

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function demande(): BelongsTo
    {
        return $this->belongsTo(Demande::class);
    }
}
