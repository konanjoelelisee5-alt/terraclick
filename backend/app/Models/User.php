<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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

    /** Permissions du compte, calculées une fois par requête (voir peut()). */
    private ?array $permissionsEnMemoire = null;

    protected static function booted(): void
    {
        // Chaque nouveau compte reçoit le rôle par défaut (client), s'il existe en base.
        static::created(function (User $user) {
            if ($role = Role::where('cle', config('acces.role_par_defaut'))->first()) {
                $user->roles()->syncWithoutDetaching([$role->id]);
            }
        });
    }

    protected function casts(): array
    {
        return [
            'telephone_verifie_le' => 'datetime',
            'password' => 'hashed',
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

    /** Demandes envoyées par ce compte, en tant que client. */
    public function demandes(): HasMany
    {
        return $this->hasMany(Demande::class);
    }

    public function avis(): HasMany
    {
        return $this->hasMany(Avis::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    public function aRole(string $cle): bool
    {
        return $this->roles->contains('cle', $cle);
    }

    /**
     * Les permissions du compte : celles de ses rôles ; toutes pour un administrateur. Un compte
     * sans aucun rôle (créé avant les rôles) a celles du rôle par défaut, comme un client.
     *
     * @return list<string>
     */
    public function permissions(): array
    {
        if ($this->permissionsEnMemoire !== null) {
            return $this->permissionsEnMemoire;
        }

        $roles = $this->roles()->with('permissions')->get();
        $this->setRelation('roles', $roles);

        $permissions = match (true) {
            $roles->contains('cle', 'admin') => Permission::query()->pluck('cle')->all() ?: array_keys(array_merge(...array_values(config('acces.permissions')))),
            $roles->isEmpty() => config('acces.roles.'.config('acces.role_par_defaut').'.permissions', []),
            default => $roles->flatMap->permissions->pluck('cle')->unique()->values()->all(),
        };

        // Un compte public n'ouvre en aucun cas l'interface de l'équipe, quoi qu'en dise la base.
        if (! $this->estEquipe()) {
            $permissions = array_diff($permissions, self::permissionsEquipe());
        }

        return $this->permissionsEnMemoire = array_values($permissions);
    }

    /** Compte de l'équipe (administrateur, manager), distinct des comptes publics. */
    public function estEquipe(): bool
    {
        return $this->roles->pluck('cle')->intersect(config('acces.roles_equipe'))->isNotEmpty();
    }

    /** @return list<string> les permissions de l'interface de l'équipe */
    public static function permissionsEquipe(): array
    {
        return array_keys(config('acces.permissions.'.config('acces.interface_equipe'), []));
    }

    public function peut(string $permission): bool
    {
        return in_array($permission, $this->permissions(), true);
    }

    /** Après un changement de rôle, les permissions sont recalculées. */
    public function oublierPermissions(): void
    {
        $this->permissionsEnMemoire = null;
        $this->unsetRelation('roles');
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
