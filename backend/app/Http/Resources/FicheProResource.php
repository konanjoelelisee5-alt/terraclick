<?php

namespace App\Http\Resources;

use App\Models\Prestataire;
use App\Support\Montant;
use App\Support\Telephone;
use Illuminate\Http\Request;

/**
 * Fiche professionnelle complète : la carte de recherche plus tout ce qui
 * construit la confiance avant le premier contact.
 *
 * @mixin Prestataire
 */
class FicheProResource extends PrestataireResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'zone_intervention' => $this->zone_intervention,
            'experience' => $this->annee_debut ? [
                'depuis' => $this->annee_debut,
                'annees' => now()->year - $this->annee_debut,
            ] : null,
            // Le numéro n'est donné qu'aux personnes connectées : appeler, c'est agir.
            // Tout le monde sait en revanche s'il existe, pour ne pas faire se connecter en vain.
            'joignable_par_telephone' => $this->telephone !== null,
            'telephone' => $this->when(
                $request->user('sanctum') !== null && $this->telephone !== null,
                fn () => Telephone::affichage($this->telephone),
            ),
            'prestations' => $this->prestations ?? [],
            'tarifs' => collect($this->tarifs ?? [])->map(fn (array $tarif) => [
                ...$tarif,
                'affichage' => match (true) {
                    ($tarif['montant'] ?? null) === null => null,
                    $tarif['montant'] === 0 => 'Gratuit',
                    ! empty($tarif['a_partir_de']) => 'à partir de '.Montant::format($tarif['montant']),
                    default => Montant::format($tarif['montant']),
                },
            ]),
            'horaires' => $this->horaires ?? [],
            'garanties' => $this->garanties ?? [],
            'documents' => $this->whenLoaded('documents', fn () => $this->documents->map(fn ($document) => [
                'type' => $document->type,
                'libelle' => $document->libelle(),
                'statut' => $document->statut,
            ])),
            'realisations' => $this->whenLoaded('realisations', fn () => $this->realisations->map(fn ($realisation) => [
                'id' => $realisation->id,
                'legende' => $realisation->legende,
                'image' => $realisation->image,
            ])),
            'avis_recents' => AvisResource::collection($this->whenLoaded('avis')),
        ];
    }
}
