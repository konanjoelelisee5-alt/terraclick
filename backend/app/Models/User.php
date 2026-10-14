<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Compte client. Pas de mot de passe : l'accès se prouve par un code
 * envoyé sur le numéro (voir OtpService).
 */
#[Fillable(['telephone', 'nom', 'email', 'ville_id', 'quartier_id', 'telephone_verifie_le'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'telephone_verifie_le' => 'datetime',
        ];
    }

    public function ville(): BelongsTo
    {
        return $this->belongsTo(Ville::class);
    }

    public function quartier(): BelongsTo
    {
        return $this->belongsTo(Quartier::class);
    }

    public function avis(): HasMany
    {
        return $this->hasMany(Avis::class);
    }

    /** Le profil se complète après la première vérification du numéro. */
    public function profilComplet(): bool
    {
        return filled($this->nom);
    }

    /** Laravel attend un mot de passe ; ce compte n'en a pas. */
    public function getAuthPassword(): string
    {
        return '';
    }
}
