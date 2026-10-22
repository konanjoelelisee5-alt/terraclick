<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * Un problème déclaré sur une demande, par le client ou par le prestataire (`role`), avec ses
 * photos à l'appui. Motifs : config/suivi.php et config/pressing.php.
 */
#[Fillable(['demande_id', 'user_id', 'role', 'motif', 'message', 'photos', 'statut', 'reponse', 'traite_par', 'traite_le'])]
class Signalement extends Model
{
    protected function casts(): array
    {
        return ['traite_le' => 'datetime', 'photos' => 'array'];
    }

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function demande(): BelongsTo
    {
        return $this->belongsTo(Demande::class);
    }

    /** Le motif en clair, selon qui le déclare et le type de demande. */
    public function libelle(?Demande $demande = null): string
    {
        $motifs = $this->role === 'prestataire'
            ? config('suivi.motifs_prestataire')
            : (($demande ?? $this->demande)?->motifsSignalement() ?? config('suivi.motifs_signalement'));

        return $motifs[$this->motif] ?? config("suivi.motifs_signalement.{$this->motif}") ?? config("pressing.motifs_signalement.{$this->motif}") ?? $this->motif;
    }

    /** @return list<string> adresses des photos jointes */
    public function urlsPhotos(): array
    {
        return array_map(fn (string $chemin) => Storage::disk('public')->url($chemin), $this->photos ?? []);
    }
}
