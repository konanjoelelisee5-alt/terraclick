<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Une relation aboutie : le client a conclu avec un technicien (onglet, reçu). */
#[Fillable([
    'user_id', 'prestataire_id', 'prestation_id', 'demande_id', 'objet', 'recherche', 'canal',
    'montant', 'date_intervention', 'statut', 'termine_le',
])]
class Accord extends Model
{
    public const CANAUX = ['appel', 'whatsapp', 'message', 'demande'];

    protected function casts(): array
    {
        return [
            'montant' => 'integer',
            'date_intervention' => 'date',
            'termine_le' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::created(function (Accord $accord) {
            $accord->forceFill(['reference' => self::referencePour($accord)])->saveQuietly();
        });
    }

    /**
     * L'onglet d'une demande envoyée dans l'application (tout service) : créé avec la demande,
     * son statut suit celui de la demande. Sert aussi à rattraper les demandes plus anciennes.
     */
    public static function pourDemande(Demande $demande): self
    {
        $pieces = $demande->articles ? array_sum(array_column($demande->articles, 'quantite')) : 0;
        // Juste créée, la demande n'a pas encore relu son statut par défaut (« envoyee »).
        $statut = self::statutPour($demande->statut ?? 'envoyee');

        $accord = self::firstOrCreate(['demande_id' => $demande->id], [
            'user_id' => $demande->user_id,
            'prestataire_id' => $demande->prestataire_id,
            'objet' => $demande->articles
                ? "Pressing · {$pieces} pièces"
                : mb_substr($demande->probleme === 'Autre' && $demande->precision ? $demande->precision : $demande->probleme, 0, 160),
            'canal' => 'demande',
            'montant' => $demande->articles ? array_sum(array_column($demande->articles, 'total')) : $demande->estimation,
            'date_intervention' => $demande->date_souhaitee ?? $demande->created_at,
            'statut' => $statut,
            'termine_le' => $statut === 'termine' ? $demande->updated_at : null,
        ]);
        // Créé sans événements de modèle (seeders) : la référence est posée ici.
        if ($accord->reference === null) {
            $accord->forceFill(['reference' => self::referencePour($accord)])->saveQuietly();
        }

        return $accord;
    }

    /** Statut de l'onglet selon celui de la demande. */
    public static function statutPour(string $statutDemande): string
    {
        return match ($statutDemande) {
            'refusee', 'annulee' => 'annule',
            'terminee', 'confirmee' => 'termine',
            default => 'conclu',
        };
    }

    /** « ACC-2026-00042 » : unique et lisible au téléphone. */
    public static function referencePour(Accord $accord): string
    {
        return sprintf('ACC-%s-%05d', $accord->created_at->format('Y'), $accord->id);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function prestataire(): BelongsTo
    {
        return $this->belongsTo(Prestataire::class);
    }

    public function prestation(): BelongsTo
    {
        return $this->belongsTo(Prestation::class);
    }

    public function demande(): BelongsTo
    {
        return $this->belongsTo(Demande::class);
    }
}
