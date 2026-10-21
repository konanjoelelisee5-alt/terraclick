<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id', 'secteur', 'probleme', 'precision', 'quartier_id', 'repere', 'quand', 'date_souhaitee',
    'mode', 'prestataire_id', 'paiement', 'estimation', 'creneau', 'photos', 'articles', 'statut',
])]
class Demande extends Model
{
    public const QUAND = ['maintenant', 'aujourdhui', 'demain', 'date'];

    public const MODES = ['recommande', 'choisi'];

    public const PAIEMENTS = ['especes', 'mobile_money'];

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
     * config/pressing.php (jamais du client) ; un même article cité deux fois est regroupé.
     *
     * @param  list<array{cle: string, quantite: int}>  $articles
     * @return list<array{cle: string, nom: string, quantite: int, prix_unitaire: int, total: int}>
     */
    public static function composerPack(array $articles): array
    {
        $catalogue = config('pressing.articles');

        return collect($articles)
            ->groupBy('cle')
            ->map(function ($lignes, string $cle) use ($catalogue) {
                $quantite = (int) $lignes->sum('quantite');

                return ['cle' => $cle, 'nom' => $catalogue[$cle]['nom'], 'quantite' => $quantite, 'prix_unitaire' => $catalogue[$cle]['prix'], 'total' => $quantite * $catalogue[$cle]['prix']];
            })
            ->values()
            ->all();
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
}
