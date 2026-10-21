<?php

namespace App\Http\Resources;

use App\Models\Demande;
use App\Support\Montant;
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

    private const LIBELLES_STATUT = [
        'envoyee' => 'Envoyée',
        'acceptee' => 'Acceptée',
        'refusee' => 'Refusée',
        'en_cours' => 'En cours',
        'terminee' => 'Marquée terminée',
        'confirmee' => 'Terminée',
        'annulee' => 'Annulée',
    ];

    public static function libelleStatut(string $statut): string
    {
        return self::LIBELLES_STATUT[$statut] ?? $statut;
    }

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
            // Pack pressing : articles, nombre de pièces et total estimé (prix indicatifs).
            'pack' => $this->articles ? [
                'articles' => $this->articles,
                'pieces' => array_sum(array_column($this->articles, 'quantite')),
                'total' => array_sum(array_column($this->articles, 'total')),
                'total_affichage' => Montant::format(array_sum(array_column($this->articles, 'total'))),
            ] : null,
            'statut' => $this->statut,
            'statut_libelle' => self::libelleStatut($this->statut),
            // Réponse du technicien quand il accepte.
            'estimation' => $this->estimation,
            'creneau' => $this->creneau,
            'evenements' => $this->whenLoaded('evenements', fn () => $this->evenements->map(fn ($e) => [
                'statut' => $e->statut,
                'libelle' => self::libelleStatut($e->statut),
                'auteur' => $e->auteur,
                'message' => $e->message,
                'date' => $e->created_at?->toIso8601String(),
            ])),
            'cree_le' => $this->created_at?->toIso8601String(),
        ];
    }
}
