<?php

namespace App\Models;

use Database\Factories\PrestataireFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id', 'quartier_id', 'nom', 'metier', 'description', 'zone_intervention', 'telephone',
    'latitude', 'longitude', 'prix_min', 'prix_max', 'delai_reponse_minutes', 'annee_debut',
    'prestations', 'tarifs', 'horaires', 'garanties', 'note_moyenne', 'nombre_avis',
    'accepte_suivi', 'en_vedette', 'actif',
])]
class Prestataire extends Model
{
    /** @use HasFactory<PrestataireFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'note_moyenne' => 'float',
            'prestations' => 'array',
            'tarifs' => 'array',
            'horaires' => 'array',
            'garanties' => 'array',
            'accepte_suivi' => 'boolean',
            'en_vedette' => 'boolean',
            'actif' => 'boolean',
        ];
    }

    public function quartier(): BelongsTo
    {
        return $this->belongsTo(Quartier::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Categorie::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(DocumentPrestataire::class);
    }

    public function realisations(): HasMany
    {
        return $this->hasMany(Realisation::class)->orderBy('ordre');
    }

    public function avis(): HasMany
    {
        return $this->hasMany(Avis::class);
    }

    public function scopeActifs(Builder $query): void
    {
        $query->where('actif', true);
    }

    /** Initiales affichées dans la pastille quand il n'y a pas de photo. */
    public function initiales(): string
    {
        $mots = preg_split('/[\s.\-]+/u', trim($this->nom), -1, PREG_SPLIT_NO_EMPTY);

        return mb_strtoupper(collect($mots)->take(2)->map(fn (string $mot) => mb_substr($mot, 0, 1))->implode(''));
    }

    /** Ajoute un avis aux agrégats sans relire tout l'historique. */
    public function integrerNote(float $note): void
    {
        $total = $this->note_moyenne * $this->nombre_avis + $note;
        $this->nombre_avis++;
        $this->note_moyenne = round($total / $this->nombre_avis, 1);
        $this->save();
    }
}
