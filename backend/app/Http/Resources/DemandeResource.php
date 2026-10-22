<?php

namespace App\Http\Resources;

use App\Models\Demande;
use App\Models\Secteur;
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
        // Décisions de l'équipe TerraClick, inscrites au journal de la demande.
        'attribuee' => 'Confiée à un prestataire par l\'équipe',
        'relance' => 'Prestataire relancé par l\'équipe',
        'litige_resolu' => 'Litige résolu par l\'équipe',
        'reintervention' => 'Nouvelle intervention décidée par l\'équipe',
    ];

    private const PAIEMENTS = [
        'especes' => 'Espèces',
        'mobile_money' => 'Mobile Money',
        'virement' => 'Virement',
        'autre' => 'Autre moyen, à convenir',
    ];

    /** Statut de la demande, ou étape du suivi d'une commande pressing (« Prête »). */
    public static function libelleStatut(string $statut): string
    {
        return self::LIBELLES_STATUT[$statut] ?? config("pressing.libelles_etapes.{$statut}", $statut);
    }

    /**
     * Commande pressing : service, dépôt, créneau, adresse, suivi étape par étape et
     * signalements. Les dates du suivi viennent du journal.
     */
    private function commande(): array
    {
        $dates = $this->relationLoaded('evenements') ? $this->evenements->pluck('created_at', 'statut') : collect();
        $faites = $this->etape === null ? [] : array_slice($this->etapesPressing(), 0, array_search($this->etape, $this->etapesPressing(), true) + 1);
        $suivi = collect(['envoyee' => 'Commande envoyée', 'acceptee' => 'Confirmée par le pressing'])
            ->merge(collect($this->etapesPressing())->mapWithKeys(fn (string $e) => [$e => config("pressing.libelles_etapes.{$e}")]))
            ->map(fn (string $libelle, string $cle) => [
                'cle' => $cle,
                // Dépôt au pressing : « Livrée » veut dire récupérée par le client.
                'libelle' => $cle === 'livree' && $this->depot === 'pressing' ? 'Récupérée' : $libelle,
                'fait' => $cle === 'envoyee' || $dates->has($cle) || in_array($cle, $faites, true)
                    || ($cle === 'acceptee' && in_array($this->statut, Demande::STATUTS_CONTACT, true)),
                'date' => $dates->get($cle)?->toIso8601String(),
            ])->values();

        return [
            'service' => $this->service ? ['cle' => $this->service, 'nom' => config("pressing.services.{$this->service}.nom")] : null,
            'express' => (bool) $this->express,
            'depot' => $this->depot ? ['cle' => $this->depot, 'nom' => config("pressing.depots.{$this->depot}.nom")] : null,
            'heure' => $this->heure,
            'adresse' => $this->adresse_libelle,
            'etape' => $this->etape,
            'etape_libelle' => $this->etape ? self::libelleStatut($this->etape) : null,
            // Prochaine étape, pour le bouton du pressing.
            'etape_suivante' => $this->etapeSuivante(),
            'suivi' => $suivi,
            'signalements' => $this->whenLoaded('signalements', fn () => $this->signalements->map(fn ($s) => [
                'id' => $s->id,
                'motif' => $s->motif,
                'motif_libelle' => $s->libelle($this->resource),
                'message' => $s->message,
                'statut' => $s->statut,
                'date' => $s->created_at?->toIso8601String(),
            ])),
        ];
    }

    /**
     * Suivi d'une intervention (hors pressing) : envoyée, acceptée, en cours, terminée,
     * confirmée. Refusée ou annulée, le suivi s'arrête là.
     */
    private function suiviIntervention(): array
    {
        $dates = $this->relationLoaded('evenements') ? $this->evenements->pluck('created_at', 'statut') : collect();
        $ordre = array_keys(config('suivi.etapes'));
        $position = array_search($this->statut, $ordre, true);

        return collect(config('suivi.etapes'))->map(fn (string $libelle, string $cle) => [
            'cle' => $cle,
            'libelle' => $libelle,
            'fait' => $dates->has($cle) || ($position !== false && array_search($cle, $ordre, true) <= $position),
            'date' => $dates->get($cle)?->toIso8601String(),
        ])->values()->all();
    }

    private function etapeSuivante(): ?array
    {
        if (! in_array($this->statut, ['acceptee', 'en_cours'], true)) {
            return null;
        }
        $etapes = $this->etapesPressing();
        $suivante = $etapes[$this->etape === null ? 0 : array_search($this->etape, $etapes, true) + 1] ?? null;

        return $suivante ? ['cle' => $suivante, 'libelle' => self::libelleStatut($suivante)] : null;
    }

    public function toArray(Request $request): array
    {
        $secteur = Secteur::nomDe($this->secteur);
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
            'paiement_libelle' => self::PAIEMENTS[$this->paiement] ?? $this->paiement,
            'photos' => collect($this->photos ?? [])->map(fn (string $chemin) => Storage::disk('public')->url($chemin))->all(),
            // Pack pressing : articles, nombre de pièces et total estimé (prix indicatifs).
            'pack' => $this->articles ? [
                'articles' => $this->articles,
                'pieces' => array_sum(array_column($this->articles, 'quantite')),
                'total' => array_sum(array_column($this->articles, 'total')),
                'total_affichage' => Montant::format(array_sum(array_column($this->articles, 'total'))),
            ] : null,
            'commande' => $this->estPressing() && $this->articles ? $this->commande() : null,
            // Intervention : son suivi (une commande pressing a le sien, dans `commande`).
            'suivi' => $this->estPressing() && $this->articles ? null : $this->suiviIntervention(),
            'signalements' => $this->whenLoaded('signalements', fn () => $this->signalements->map(fn ($s) => [
                'id' => $s->id,
                'motif' => $s->motif,
                'motif_libelle' => $s->libelle($this->resource),
                'role' => $s->role,
                'photos' => $s->urlsPhotos(),
                'message' => $s->message,
                'statut' => $s->statut,
                'date' => $s->created_at?->toIso8601String(),
            ])),
            'motifs_signalement' => collect($this->motifsSignalement())->map(fn (string $nom, string $cle) => ['cle' => $cle, 'nom' => $nom])->values(),
            // L'onglet de la commande, où le client la suit.
            'accord_id' => $this->whenLoaded('accord', fn () => $this->accord?->id),
            'statut' => $this->statut,
            'statut_libelle' => self::libelleStatut($this->statut),
            // Réponse du technicien quand il accepte.
            'estimation' => $this->estimation,
            'frais_deplacement' => $this->frais_deplacement,
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
