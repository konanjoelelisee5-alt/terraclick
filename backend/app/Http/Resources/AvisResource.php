<?php

namespace App\Http\Resources;

use App\Models\Avis;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Avis */
class AvisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // « Aya Konan » s'affiche « Aya K. » : le nom complet reste privé.
        $mots = preg_split('/\s+/u', trim((string) $this->auteur?->nom), -1, PREG_SPLIT_NO_EMPTY);
        $nom = $mots ? $mots[0].(isset($mots[1]) ? ' '.mb_substr($mots[1], 0, 1).'.' : '') : 'Client';
        $initiales = mb_strtoupper(collect($mots)->take(2)->map(fn ($mot) => mb_substr($mot, 0, 1))->implode('')) ?: 'C';

        return [
            'id' => $this->id,
            'auteur' => ['nom' => $nom, 'initiales' => $initiales],
            'notes' => [
                'ponctualite' => $this->note_ponctualite,
                'qualite' => $this->note_qualite,
                'prix' => $this->note_prix,
            ],
            'note' => $this->note,
            'commentaire' => $this->commentaire,
            'date' => $this->created_at?->toIso8601String(),
            'date_affichage' => $this->created_at?->locale('fr')->translatedFormat('F Y'),
        ];
    }
}
