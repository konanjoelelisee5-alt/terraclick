<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * La commission d'une mission accomplie : le montant encaissé par le prestataire, le taux du jour
 * (celui du secteur, sinon le taux global) et la commission due à TerraClick.
 */
#[Fillable(['demande_id', 'prestataire_id', 'secteur', 'montant_mission', 'taux', 'montant'])]
class Commission extends Model
{
    protected function casts(): array
    {
        return ['taux' => 'float', 'montant_mission' => 'integer', 'montant' => 'integer'];
    }

    public function demande(): BelongsTo
    {
        return $this->belongsTo(Demande::class);
    }

    public function prestataire(): BelongsTo
    {
        return $this->belongsTo(Prestataire::class);
    }

    /** Le taux appliqué à un secteur : le sien s'il en a un, sinon le taux global ; null : aucun. */
    public static function tauxPour(string $secteur): ?float
    {
        $propre = Secteur::query()->where('cle', $secteur)->value('commission');

        return $propre !== null ? (float) $propre : (Reglage::lire('commission_taux') !== null ? (float) Reglage::lire('commission_taux') : null);
    }

    /** Montant de la mission : celui de l'onglet, sinon l'estimation du prestataire, sinon le pack. */
    public static function montantMission(Demande $demande): ?int
    {
        $pack = $demande->articles ? array_sum(array_column($demande->articles, 'total')) : null;

        return $demande->accord?->montant ?? $demande->estimation ?? $pack;
    }

    /**
     * Inscrit la commission d'une mission accomplie, une seule fois, au taux du jour. Sans taux,
     * sans prestataire ou sans montant connu, il n'y a rien à percevoir.
     */
    public static function pourDemande(Demande $demande): ?self
    {
        $demande->loadMissing('accord');
        $taux = self::tauxPour($demande->secteur);
        $montant = self::montantMission($demande);
        if (! $demande->prestataire_id || ! $taux || ! $montant) {
            return null;
        }

        return self::firstOrCreate(['demande_id' => $demande->id], [
            'prestataire_id' => $demande->prestataire_id,
            'secteur' => $demande->secteur,
            'montant_mission' => $montant,
            'taux' => $taux,
            'montant' => (int) round($montant * $taux / 100),
        ]);
    }
}
