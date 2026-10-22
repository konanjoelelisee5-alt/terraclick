<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Support\Telephone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UtilisateurResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'telephone' => $this->telephone,
            'telephone_affichage' => Telephone::affichage($this->telephone),
            'nom' => $this->nom,
            'email' => $this->email,
            // Image prête à afficher (data URL), ou null : l'application montre alors les initiales.
            'photo' => $this->photo,
            'ville' => $this->whenLoaded('ville', fn () => $this->ville ? ['id' => $this->ville->id, 'nom' => $this->ville->nom] : null),
            'quartier' => QuartierResource::make($this->whenLoaded('quartier')),
            'profil_complet' => $this->profilComplet(),
            'a_mot_de_passe' => $this->aUnMotDePasse(),
            // Rôles et permissions : l'application n'affiche que les interfaces permises.
            'roles' => $this->roles()->pluck('cle'),
            'permissions' => $this->permissions(),
            // Ancien champ, gardé pour les applications pas encore mises à jour.
            'est_admin' => $this->peut('admin.acceder'),
        ];
    }
}
