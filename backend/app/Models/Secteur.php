<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

/**
 * Un secteur d'activité (Plomberie, Pressing…), géré par l'administrateur : nom, icône et
 * couleur pour l'accueil client, ordre d'affichage, catégories de l'annuaire qu'il ouvre,
 * problèmes proposés au client et vocabulaire de la barre de recherche. Désactivé, il
 * disparaît de l'application (accueil, recherche, demandes) sans être supprimé.
 */
#[Fillable(['cle', 'nom', 'metier', 'description', 'icone', 'couleur', 'commission', 'actif', 'ordre', 'categories', 'problemes', 'mots'])]
class Secteur extends Model
{
    private const CACHE = 'secteurs.catalogue';

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
            'ordre' => 'integer',
            'categories' => 'array',
            'problemes' => 'array',
            'mots' => 'array',
        ];
    }

    protected static function booted(): void
    {
        // Toute modification se voit aussitôt dans l'application.
        static::saved(fn () => self::oublier());
        static::deleted(fn () => self::oublier());
    }

    public static function oublier(): void
    {
        Cache::forget(self::CACHE);
        Cache::forget('correcteur.vocabulaire');
    }

    public function scopeActifs(Builder $query): void
    {
        $query->where('actif', true);
    }

    public function scopeClasses(Builder $query): void
    {
        $query->orderBy('ordre')->orderBy('id');
    }

    /** Ses sous-services : les prestations et leur prix indicatif. */
    public function prestations(): HasMany
    {
        return $this->hasMany(Prestation::class, 'secteur', 'cle')->orderBy('ordre');
    }

    /**
     * Tous les secteurs, actifs ou non, dans l'ordre d'affichage, lus une fois puis gardés en cache.
     *
     * @return array<string, array{nom: string, metier: ?string, description: ?string, icone: string, couleur: ?string, actif: bool, categories: list<string>, problemes: list<string>, mots: array<string, int>}>
     */
    public static function catalogue(): array
    {
        return Cache::rememberForever(self::CACHE, fn () => self::query()->classes()->get()
            ->mapWithKeys(fn (Secteur $s) => [$s->cle => [
                'nom' => $s->nom,
                'metier' => $s->metier,
                'description' => $s->description,
                'icone' => $s->icone,
                'couleur' => $s->couleur,
                'actif' => $s->actif,
                'categories' => $s->categories ?? [],
                'problemes' => $s->problemes ?? [],
                'mots' => $s->mots ?? [],
            ]])->all());
    }

    /** @return array<string, array<string, mixed>> les secteurs actifs, dans l'ordre d'affichage */
    public static function actifsEnCatalogue(): array
    {
        return array_filter(self::catalogue(), fn (array $s) => $s['actif']);
    }

    /** Nom d'un secteur, même désactivé (demandes et dossiers anciens). */
    public static function nomDe(?string $cle): ?string
    {
        return $cle === null ? null : (self::catalogue()[$cle]['nom'] ?? $cle);
    }

    /** @return list<string> les catégories de l'annuaire ouvertes par les secteurs actifs */
    public static function categoriesOuvertes(): array
    {
        return array_values(array_unique(array_merge([], ...array_column(self::actifsEnCatalogue(), 'categories'))));
    }
}
