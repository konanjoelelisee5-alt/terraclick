<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'user_id', 'secteur', 'probleme', 'precision', 'quartier_id', 'repere', 'quand', 'date_souhaitee',
    'mode', 'prestataire_id', 'paiement', 'estimation', 'frais_deplacement', 'creneau', 'photos', 'articles', 'statut',
    'service', 'express', 'depot', 'heure', 'adresse_libelle', 'etape',
])]
class Demande extends Model
{
    public const QUAND = ['maintenant', 'aujourdhui', 'demain', 'date'];

    public const MODES = ['recommande', 'choisi'];

    /** « autre » : moyen à convenir avec le prestataire (virement, carte…). */
    public const PAIEMENTS = ['especes', 'mobile_money', 'autre'];

    /**
     * Cycle de vie : envoyee → acceptee → en_cours → terminee → confirmee.
     * Le technicien peut refuser une demande envoyée ; le client peut annuler tant que
     * l'intervention n'a pas commencé.
     */
    public const STATUTS = ['envoyee', 'acceptee', 'refusee', 'en_cours', 'terminee', 'confirmee', 'annulee'];

    /** Statuts où le technicien voit le numéro du client pour le joindre. */
    public const STATUTS_CONTACT = ['acceptee', 'en_cours', 'terminee', 'confirmee'];

    protected function casts(): array
    {
        return [
            'date_souhaitee' => 'date',
            'photos' => 'array',
            'articles' => 'array',
            'estimation' => 'integer',
            'express' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        // La référence suit l'identifiant : unique et lisible au téléphone (« DEM-2026-00042 »).
        static::created(function (Demande $demande) {
            $demande->forceFill(['reference' => sprintf('DEM-%s-%05d', $demande->created_at->format('Y'), $demande->id)])->saveQuietly();
            $demande->evenements()->create(['user_id' => $demande->user_id, 'auteur' => 'client', 'statut' => 'envoyee']);
        });
    }

    /**
     * Lignes du pack pressing à partir des articles choisis : nom et prix par pièce viennent de
     * config/pressing.php (jamais du client), selon le service et l'express ; un même article
     * cité deux fois est regroupé.
     *
     * @param  list<array{cle: string, quantite: int}>  $articles
     * @return list<array{cle: string, nom: string, quantite: int, prix_unitaire: int, total: int}>
     */
    public static function composerPack(array $articles, ?string $service = null, bool $express = false): array
    {
        $catalogue = config('pressing.articles');

        return collect($articles)
            ->groupBy('cle')
            ->map(function ($lignes, string $cle) use ($catalogue, $service, $express) {
                $quantite = (int) $lignes->sum('quantite');
                $prix = self::prixPressing($catalogue[$cle]['prix'], $service, $express);

                return ['cle' => $cle, 'nom' => $catalogue[$cle]['nom'], 'quantite' => $quantite, 'prix_unitaire' => $prix, 'total' => $quantite * $prix];
            })
            ->values()
            ->all();
    }

    /** Prix d'une pièce : prix de base × coefficient du service, majoré en express, arrondi à 25 F. */
    public static function prixPressing(int $base, ?string $service, bool $express): int
    {
        $coef = config("pressing.services.{$service}.coef", 100) / 100;
        $majoration = $express ? 1 + config('pressing.express.majoration') / 100 : 1;

        return (int) (round($base * $coef * $majoration / 25) * 25);
    }

    public function estPressing(): bool
    {
        return $this->secteur === 'pressing';
    }

    /** Ce que le client peut signaler : motifs du pressing, ou ceux d'une intervention. */
    public function motifsSignalement(): array
    {
        return $this->estPressing() ? config('pressing.motifs_signalement') : config('suivi.motifs_signalement');
    }

    /** Étapes du suivi de cette commande pressing, selon son mode de dépôt. */
    public function etapesPressing(): array
    {
        return config('pressing.etapes.'.($this->depot ?? 'pressing'), []);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function quartier(): BelongsTo
    {
        return $this->belongsTo(Quartier::class);
    }

    public function prestataire(): BelongsTo
    {
        return $this->belongsTo(Prestataire::class);
    }

    public function evenements(): HasMany
    {
        return $this->hasMany(DemandeEvenement::class)->orderBy('id');
    }

    public function signalements(): HasMany
    {
        return $this->hasMany(Signalement::class)->latest('id');
    }

    public function accord(): HasOne
    {
        return $this->hasOne(Accord::class);
    }
}
