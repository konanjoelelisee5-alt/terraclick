<?php

namespace App\Http\Resources;

use App\Models\Accord;
use App\Models\Avis;
use App\Support\Montant;
use App\Support\Telephone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Un onglet du client : la relation aboutie, les étapes qui y ont mené et de quoi établir
 * son reçu.
 *
 * @mixin Accord
 */
class AccordResource extends JsonResource
{
    private const CANAUX = [
        'appel' => 'Appel téléphonique',
        'whatsapp' => 'WhatsApp',
        'message' => 'Message dans TerraClick',
        'demande' => 'Demande dans TerraClick',
    ];

    public function toArray(Request $request): array
    {
        $pro = $this->prestataire;
        $commande = (bool) $this->demande?->estPressing();

        // Les actions qui ont mené à l'accord, dans l'ordre.
        $etapes = array_values(array_filter([
            $this->recherche ? ['libelle' => "Recherche « {$this->recherche} »", 'date' => $this->created_at?->toIso8601String()] : null,
            ['libelle' => 'Contact : '.(self::CANAUX[$this->canal] ?? $this->canal), 'date' => $this->created_at?->toIso8601String()],
            ['libelle' => 'Accord conclu, confirmé par vous', 'date' => $this->created_at?->toIso8601String()],
            $this->termine_le ? ['libelle' => 'Intervention terminée', 'date' => $this->termine_le->toIso8601String()] : null,
        ]));

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'objet' => $this->objet,
            'recherche' => $this->recherche,
            'canal' => $this->canal,
            'canal_libelle' => self::CANAUX[$this->canal] ?? $this->canal,
            'montant' => $this->montant,
            'montant_affichage' => $this->montant !== null ? Montant::format($this->montant) : null,
            'date_intervention' => $this->date_intervention?->toDateString(),
            'statut' => $this->statut,
            'statut_libelle' => match (true) {
                $this->statut === 'termine' => 'Terminé',
                $this->statut === 'annule' => 'Annulé',
                $commande && $this->demande->etape !== null => DemandeResource::libelleStatut($this->demande->etape),
                $commande => $this->demande->statut === 'envoyee' ? 'En attente du pressing' : 'Confirmée',
                default => 'Accord conclu',
            },
            'prestation' => $this->prestation ? ['slug' => $this->prestation->slug, 'nom' => $this->prestation->nom, 'secteur' => $this->prestation->secteur] : null,
            'prestataire' => [
                'id' => $pro->id,
                'nom' => $pro->nom,
                'initiales' => $pro->initiales(),
                'metier' => $pro->metier,
                'telephone' => $pro->telephone !== null ? Telephone::affichage($pro->telephone) : null,
                'quartier' => $pro->quartier?->nom,
                'categorie' => $pro->categories->first()?->slug,
            ],
            'demande_reference' => $this->demande?->reference,
            // Commande pressing : tout le détail, son suivi et ses signalements.
            'demande' => $commande ? DemandeResource::make($this->demande) : null,
            'deja_note' => Avis::where('user_id', $this->user_id)->where('prestataire_id', $this->prestataire_id)->exists(),
            'etapes' => $etapes,
            'cree_le' => $this->created_at?->toIso8601String(),
        ];
    }
}
