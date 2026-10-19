<?php

namespace App\Http\Resources;

use App\Models\Demande;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * Une demande d'intervention, vue par son auteur.
 *
 * @mixin Demande
 */
class DemandeResource extends JsonResource
{
    private const LIBELLES_QUAND = [
        'maintenant' => 'Maintenant',
        'aujourdhui' => 'Aujourd\'hui',
        'demain' => 'Demain',
    ];

    public function toArray(Request $request): array
    {
        $secteur = config("secteurs.{$this->secteur}.nom", $this->secteur);
        $quand = self::LIBELLES_QUAND[$this->quand] ?? $this->date_souhaitee?->translatedFormat('j F Y');

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'secteur' => ['cle' => $this->secteur, 'nom' => $secteur],
            'probleme' => $this->probleme,
            'precision' => $this->precision,
            'quartier' => QuartierResource::make($this->whenLoaded('quartier')),
            'repere' => $this->repere,
            'quand' => $this->quand,
            'date_souhaitee' => $this->date_souhaitee?->toDateString(),
            // « Plomberie · Fuite d'eau · Habitat · Maintenant »
            'resume' => collect([$secteur, $this->probleme, $this->quartier?->nom, $quand])->filter()->implode(' · '),
            'mode' => $this->mode,
            'prestataire' => PrestataireResource::make($this->whenLoaded('prestataire')),
            'paiement' => $this->paiement,
            'photos' => collect($this->photos ?? [])->map(fn (string $chemin) => Storage::disk('public')->url($chemin))->all(),
            'statut' => $this->statut,
            'cree_le' => $this->created_at?->toIso8601String(),
        ];
    }
}
