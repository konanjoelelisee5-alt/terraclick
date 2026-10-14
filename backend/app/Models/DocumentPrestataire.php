<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Pièce justificative contrôlée avant d'afficher le badge « vérifié ». */
#[Table('documents_prestataire')]
#[Fillable(['prestataire_id', 'type', 'statut', 'fichier', 'verifie_le'])]
class DocumentPrestataire extends Model
{
    public const TYPES = [
        'registre_commerce' => 'Registre de commerce',
        'attestation_fiscale' => 'Attestation fiscale',
        'assurance_decennale' => 'Assurance décennale',
        'cni_gerant' => 'CNI du gérant',
    ];

    protected function casts(): array
    {
        return [
            'verifie_le' => 'datetime',
        ];
    }

    public function prestataire(): BelongsTo
    {
        return $this->belongsTo(Prestataire::class);
    }

    public function libelle(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }
}
