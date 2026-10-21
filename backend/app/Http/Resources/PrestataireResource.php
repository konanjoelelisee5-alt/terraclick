<?php

namespace App\Http\Resources;

use App\Models\Prestataire;
use App\Support\Montant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Carte prestataire telle qu'elle apparaît dans les résultats de recherche.
 *
 * @mixin Prestataire
 */
class PrestataireResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'initiales' => $this->initiales(),
            'metier' => $this->metier,
            'description' => $this->description,
            'note' => $this->note_moyenne,
            'nombre_avis' => $this->nombre_avis,
            'prix' => [
                'min' => $this->prix_min,
                'max' => $this->prix_max,
                'affichage' => Montant::fourchette($this->prix_min, $this->prix_max),
            ],
            // Recherche d'une prestation précise : son prix chez ce technicien (le sien s'il l'a
            // fixé, sinon le prix indicatif de la prestation).
            'prestation' => $this->whenLoaded('offres', function () {
                $p = $this->offres->first();

                return $p ? [
                    'slug' => $p->slug,
                    'nom' => $p->nom,
                    'prix' => [
                        'min' => $p->pivot->prix_min ?? $p->prix_min,
                        'max' => $p->pivot->prix_max ?? $p->prix_max,
                        'affichage' => $p->prixAffiche($p->pivot->prix_min, $p->pivot->prix_max),
                    ],
                ] : null;
            }),
            'delai_reponse' => [
                'minutes' => $this->delai_reponse_minutes,
                'affichage' => Montant::delai($this->delai_reponse_minutes),
            ],
            'quartier' => QuartierResource::make($this->whenLoaded('quartier')),
            'position' => $this->latitude !== null ? ['lat' => $this->latitude, 'lng' => $this->longitude] : null,
            // Présent seulement quand la recherche porte une position.
            'distance_km' => $this->when(isset($this->distance_km), fn () => round((float) $this->distance_km, 1)),
            'categories' => $this->whenLoaded('categories', fn () => $this->categories->pluck('nom')),
            'verifie' => $this->when(
                isset($this->documents_count),
                fn () => (int) $this->documents_count > 0 && (int) $this->documents_count === (int) $this->documents_verifies_count,
            ),
            'accepte_suivi' => $this->accepte_suivi,
            'en_vedette' => $this->en_vedette,
        ];
    }
}
