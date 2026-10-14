<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Table('avis')]
#[Fillable(['prestataire_id', 'user_id', 'note_ponctualite', 'note_qualite', 'note_prix', 'note', 'commentaire'])]
class Avis extends Model
{
    protected function casts(): array
    {
        return [
            'note' => 'float',
        ];
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
