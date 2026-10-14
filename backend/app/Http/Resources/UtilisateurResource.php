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
            'quartier' => QuartierResource::make($this->whenLoaded('quartier')),
            'profil_complet' => $this->profilComplet(),
        ];
    }
}
