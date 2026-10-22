<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Pièce justificative contrôlée avant d'afficher le badge « vérifié ». */
#[Table('documents_prestataire')]
#[Fillable(['prestataire_id', 'type', 'statut', 'motif', 'fichier', 'mime', 'verifie_le', 'verifie_par'])]
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

    /** Le nom de la pièce : ceux de la fiche, sinon ceux du formulaire « Devenir prestataire ». */
    public function libelle(): string
    {
        if (isset(self::TYPES[$this->type])) {
            return self::TYPES[$this->type];
        }
        $pieces = config('candidature.documents_communs') + array_merge(...array_values(config('candidature.documents')));

        return $pieces[$this->type][0] ?? $this->type;
    }

    public function estUneImage(): bool
    {
        return str_starts_with((string) $this->mime, 'image/');
    }
}
