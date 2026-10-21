<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Compte client. Connexion par numéro et mot de passe ; le numéro est prouvé par un
 * code à l'inscription et à la réinitialisation du mot de passe (voir OtpService).
 * Les comptes créés par code seul n'ont pas de mot de passe tant qu'ils n'en choisissent pas.
 */
#[Fillable(['telephone', 'nom', 'email', 'photo', 'ville_id', 'quartier_id', 'telephone_verifie_le'])]
#[Hidden(['password'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'telephone_verifie_le' => 'datetime',
            'password' => 'hashed',
            'est_admin' => 'boolean',
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

    public function aUnMotDePasse(): bool
    {
        return filled($this->password);
    }
}
