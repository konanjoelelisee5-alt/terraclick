<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Dossier « Devenir prestataire », envoyé à l'équipe TerraClick pour vérification. */
#[Fillable([
    'user_id', 'type', 'statut', 'nom_activite', 'responsable', 'telephone', 'secteurs', 'quartier_id',
    'quartiers', 'description', 'experience_annees', 'horaires', 'prix', 'paiements', 'details',
    'motif_refus', 'prestataire_id', 'traite_par', 'traite_le',
])]
class Candidature extends Model
{
    protected function casts(): array
    {
        return [
            'secteurs' => 'array',
            'quartiers' => 'array',
            'paiements' => 'array',
            'details' => 'array',
            'traite_le' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // « CAN-2026-00012 » : unique et lisible au téléphone.
        static::created(function (Candidature $c) {
            $c->forceFill(['reference' => sprintf('CAN-%s-%05d', $c->created_at->format('Y'), $c->id)])->saveQuietly();
        });
    }

    /**
     * Pièces attendues pour ce type : les communes, puis les siennes.
     *
     * @return array<string, array{0: string, 1: bool, 2: ?string}>
     */
    public static function documentsPour(string $type): array
    {
        return [...config('candidature.documents_communs'), ...config("candidature.documents.{$type}", [])];
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function quartier(): BelongsTo
    {
        return $this->belongsTo(Quartier::class);
    }

    public function prestataire(): BelongsTo
    {
        return $this->belongsTo(Prestataire::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(CandidatureDocument::class);
    }
}
