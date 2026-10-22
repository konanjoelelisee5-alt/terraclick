<?php

namespace App\Http\Resources;

use App\Models\Demande;
use App\Support\Telephone;
use Illuminate\Http\Request;

/**
 * Demande vue par le technicien. Le client y figure sous son prénom et l'initiale de son nom ;
 * son numéro n'apparaît qu'une fois la demande acceptée.
 *
 * @mixin Demande
 */
class DemandeProResource extends DemandeResource
{
    public function toArray(Request $request): array
    {
        $mots = preg_split('/\s+/u', trim((string) $this->client?->nom), -1, PREG_SPLIT_NO_EMPTY);
        $joignable = in_array($this->statut, Demande::STATUTS_CONTACT, true);

        return [
            ...parent::toArray($request),
            'client' => [
                'nom' => $mots ? $mots[0].(isset($mots[1]) ? ' '.mb_substr($mots[1], 0, 1).'.' : '') : 'Client',
                'telephone' => $joignable && $this->client ? Telephone::affichage($this->client->telephone) : null,
            ],
            // L'équipe TerraClick relance le prestataire qui n'a pas encore répondu.
            'relance' => $this->statut === 'envoyee' && ($r = $this->evenements()->where('statut', 'relance')->latest('id')->first())
                ? ['date' => $r->created_at?->toIso8601String(), 'message' => $r->message]
                : null,
        ];
    }
}
