<?php

namespace App\Http\Resources;

use App\Models\Candidature;
use App\Models\Quartier;
use App\Support\Telephone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Une candidature « Devenir prestataire ». L'équipe (admin) voit en plus l'adresse de chaque
 * pièce jointe ; le candidat ne voit que la liste de ce qu'il a envoyé.
 *
 * @mixin Candidature
 */
class CandidatureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $admin = (bool) $request->user()?->est_admin;
        $pieces = Candidature::documentsPour($this->type);
        $nomsQuartiers = Quartier::whereIn('id', [...$this->quartiers, ...($this->details['quartiers_collecte'] ?? [])])->pluck('nom', 'id');
        $details = $this->details ?? [];
        if (isset($details['quartiers_collecte'])) {
            $details['quartiers_collecte'] = collect($details['quartiers_collecte'])->map(fn ($id) => $nomsQuartiers[$id] ?? $id)->values()->all();
        }

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'type' => ['cle' => $this->type, 'nom' => config("candidature.types.{$this->type}.nom")],
            'statut' => $this->statut,
            'statut_libelle' => config("candidature.statuts.{$this->statut}", $this->statut),
            'nom_activite' => $this->nom_activite,
            'responsable' => $this->responsable,
            'telephone' => Telephone::affichage($this->telephone),
            'secteurs' => collect($this->secteurs)->map(fn (string $s) => ['cle' => $s, 'nom' => config("secteurs.{$s}.nom", $s)])->values(),
            'quartier' => QuartierResource::make($this->whenLoaded('quartier')),
            'quartiers' => collect($this->quartiers)->map(fn ($id) => $nomsQuartiers[$id] ?? $id)->values(),
            'description' => $this->description,
            'experience_annees' => $this->experience_annees,
            'horaires' => $this->horaires,
            'prix' => $this->prix,
            'paiements' => collect($this->paiements)->map(fn (string $p) => config("candidature.paiements.{$p}", $p))->values(),
            'details' => $details,
            'documents' => $this->whenLoaded('documents', fn () => $this->documents->map(fn ($d) => [
                'type' => $d->type,
                'libelle' => $pieces[$d->type][0] ?? $d->type,
                'mime' => $d->mime,
                // Lecture réservée à l'équipe, à travers l'API (disque privé).
                'url' => $admin ? url("/api/admin/candidatures/{$this->id}/documents/{$d->type}") : null,
            ])->values()),
            'motif_refus' => $this->motif_refus,
            'prestataire_id' => $this->prestataire_id,
            'traite_le' => $this->traite_le?->toIso8601String(),
            'cree_le' => $this->created_at?->toIso8601String(),
        ];
    }
}
