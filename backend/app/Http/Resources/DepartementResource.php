<?php

namespace App\Http\Resources;

use App\Models\Departement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Un département du méga-menu, avec ses rubriques et leurs catégories.
 *
 * @mixin Departement
 */
class DepartementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'slug' => $this->slug,
            'icone' => $this->icone,
            'apercu' => $this->apercu,
            'nombre_prestataires' => (int) $this->nombre_prestataires,
            'rubriques' => $this->whenLoaded('rubriques', fn () => $this->rubriques->map(fn ($rubrique) => [
                'id' => $rubrique->id,
                'nom' => $rubrique->nom,
                'slug' => $rubrique->slug,
                'categories' => $rubrique->categories->map(fn ($categorie) => [
                    'id' => $categorie->id,
                    'nom' => $categorie->nom,
                    'slug' => $categorie->slug,
                ]),
            ])),
        ];
    }
}
