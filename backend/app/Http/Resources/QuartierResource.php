<?php

namespace App\Http\Resources;

use App\Models\Quartier;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Quartier */
class QuartierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'slug' => $this->slug,
            // Services proposés (null : tous) et frais de déplacement, réglés par l'équipe.
            'secteurs' => $this->secteurs,
            'frais_deplacement' => $this->frais_deplacement,
            'ville' => $this->whenLoaded('ville', fn () => $this->ville->nom),
        ];
    }
}
