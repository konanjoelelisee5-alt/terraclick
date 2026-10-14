<?php

namespace App\Http\Resources;

use App\Models\Ville;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Ville */
class VilleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'slug' => $this->slug,
            'position' => $this->latitude !== null ? ['lat' => $this->latitude, 'lng' => $this->longitude] : null,
            'quartiers' => QuartierResource::collection($this->whenLoaded('quartiers')),
        ];
    }
}
