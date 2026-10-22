<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Un paiement de commission reçu d'un prestataire, enregistré par l'équipe. */
#[Table('paiements_commission')]
#[Fillable(['prestataire_id', 'montant', 'moyen', 'reference', 'note', 'user_id', 'paye_le'])]
class PaiementCommission extends Model
{
    protected function casts(): array
    {
        return ['paye_le' => 'date', 'montant' => 'integer'];
    }

    public function prestataire(): BelongsTo
    {
        return $this->belongsTo(Prestataire::class);
    }

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
