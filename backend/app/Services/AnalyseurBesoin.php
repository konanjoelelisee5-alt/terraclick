<?php

namespace App\Services;

use App\Models\Prestation;
use Illuminate\Support\Str;

/**
 * Lit ce que le client tape dans la barre de recherche — un métier, un service ou une
 * phrase (« l'eau coule sous mon évier ») — et en déduit le ou les secteurs concernés,
 * d'après le vocabulaire de config/secteurs.php. Seuls les secteurs dont une catégorie
 * est ouverte au public sont proposés.
 */
class AnalyseurBesoin
{
    /**
     * @return array<int, array{cle: string, nom: string, categories: list<string>, score: int}>
     *                                                                                           Les secteurs retenus (ex æquo au meilleur score), vide si rien n'est reconnu.
     */
    public function analyser(string $demande): array
    {
        $texte = $this->normaliser($demande);
        if ($texte === '') {
            return [];
        }

        $mots = explode(' ', $texte);
        $scores = [];

        foreach ($this->secteursOuverts() as $cle => $secteur) {
            $categories = $secteur['categories'];
            $score = 0;
            foreach ($secteur['mots'] as $motCle => $poids) {
                if ($this->reconnait($motCle, $texte, $mots)) {
                    $score += $poids;
                }
            }

            if ($score > 0) {
                $scores[$cle] = ['cle' => $cle, 'nom' => $secteur['nom'], 'categories' => $categories, 'score' => $score];
            }
        }

        if ($scores === []) {
            return [];
        }

        $meilleur = max(array_column($scores, 'score'));

        return array_values(array_filter($scores, fn (array $s) => $s['score'] === $meilleur));
    }

    /**
     * Les secteurs dont au moins une catégorie est ouverte au public, avec ces seules catégories.
     *
     * @return array<string, array{nom: string, categories: list<string>, problemes: list<string>, mots: array<string, int>}>
     */
    public function secteursOuverts(): array
    {
        $ouverts = [];
        foreach (config('secteurs') as $cle => $secteur) {
            $categories = $this->categoriesOuvertes($secteur['categories']);
            if ($categories !== []) {
                $ouverts[$cle] = [...$secteur, 'categories' => $categories, 'problemes' => $secteur['problemes'] ?? []];
            }
        }

        return $ouverts;
    }

    /** Le problème type du secteur que la demande cite mot pour mot (« fuite d'eau »), sinon null. */
    public function problemeReconnu(string $demande, string $cleSecteur): ?string
    {
        $texte = " {$this->normaliser($demande)} ";

        foreach ($this->secteursOuverts()[$cleSecteur]['problemes'] ?? [] as $probleme) {
            if (str_contains($texte, " {$this->normaliser($probleme)} ")) {
                return $probleme;
            }
        }

        return null;
    }

    /**
     * La prestation que la demande décrit le mieux (« tuyau cassé » → « Réparation de tuyau
     * cassé »), parmi celles des secteurs donnés (tous les secteurs ouverts sinon). Il faut au
     * moins un mot propre à la prestation (score de 3 : « porte » seul ne suffit pas) ; à égalité, la première du catalogue l'emporte.
     *
     * @param  list<string>  $secteurs  clés de secteurs où chercher
     */
    public function prestationReconnue(string $demande, array $secteurs = []): ?Prestation
    {
        $texte = $this->normaliser($demande);
        if ($texte === '') {
            return null;
        }
        $mots = explode(' ', $texte);
        $ouverts = array_keys($this->secteursOuverts());
        $candidats = $secteurs !== [] ? array_values(array_intersect($secteurs, $ouverts)) : $ouverts;

        $meilleure = null;
        $meilleurScore = 2;
        foreach (Prestation::whereIn('secteur', $candidats)->orderBy('secteur')->orderBy('ordre')->get() as $prestation) {
            $score = 0;
            foreach ($prestation->mots as $motCle => $poids) {
                if ($this->reconnait($motCle, $texte, $mots)) {
                    $score += $poids;
                }
            }
            if ($score > $meilleurScore) {
                [$meilleure, $meilleurScore] = [$prestation, $score];
            }
        }

        return $meilleure;
    }

    /** Minuscules, sans accents ; apostrophes, tirets et ponctuation deviennent des espaces. */
    private function normaliser(string $texte): string
    {
        $texte = Str::lower(Str::ascii($texte));
        $texte = preg_replace('/[^a-z0-9]+/', ' ', $texte);

        return trim($texte);
    }

    /** @param list<string> $mots */
    private function reconnait(string $motCle, string $texte, array $mots): bool
    {
        if (str_contains($motCle, ' ')) {
            return str_contains(" {$texte} ", " {$motCle} ");
        }

        if (str_ends_with($motCle, '*')) {
            $prefixe = rtrim($motCle, '*');

            return collect($mots)->contains(fn (string $mot) => str_starts_with($mot, $prefixe));
        }

        // Mot exact, pluriel en -s ou -x admis.
        return collect($mots)->contains(fn (string $mot) => in_array($mot, [$motCle, $motCle.'s', $motCle.'x'], true));
    }

    /**
     * @param  list<string>  $categories
     * @return list<string>
     */
    private function categoriesOuvertes(array $categories): array
    {
        if (! config('mvp.actif')) {
            return $categories;
        }

        return array_values(array_intersect($categories, config('mvp.categories')));
    }
}
