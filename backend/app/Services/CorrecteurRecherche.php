<?php

namespace App\Services;

use App\Models\Categorie;
use App\Models\Prestataire;
use App\Models\Prestation;
use App\Models\Quartier;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * « Essayez avec cette orthographe », comme Google ou Chrome : une faute de frappe dans la
 * barre de recherche (« plonbier », « electrisien », « climatiseur » mal tapé) est rapprochée
 * du mot le plus proche du vocabulaire de TerraClick — métiers, services, prestations,
 * problèmes types, catégories, quartiers et noms des prestataires.
 *
 * Seuls les mots d'au moins 4 lettres inconnus du vocabulaire sont corrigés, et seulement si
 * un mot connu est assez proche (fautes admises : 1 jusqu'à 6 lettres, 2 jusqu'à 10, 3 au-delà ;
 * deux lettres voisines inversées comptent pour une).
 */
class CorrecteurRecherche
{
    /** Mots de tous les jours, jamais « corrigés » vers un mot du vocabulaire (comparés sans accents). */
    public const COURANTS = [
        'avec', 'besoin', 'bonjour', 'cherche', 'chercher', 'dans', 'depuis', 'elle', 'faire', 'faut',
        'leur', 'mais', 'merci', 'mettre', 'pour', 'quelqu', 'quelquun', 'sans', 'tres', 'trouver',
        'urgent', 'veux', 'voudrais', 'votre', 'vous', 'nous', 'chez', 'maison', 'aujourd', 'demain',
        'matin', 'soir', 'hier', 'probleme', 'quelque', 'chose', 'personne', 'aide', 'aider', 'marche',
        'plus', 'encore', 'toujours', 'cette', 'notre', 'mon', 'mes', 'tout', 'tous', 'bien', 'peut',
        'quand', 'comme', 'avoir', 'etre', 'suis', 'sont', 'fait', 'vite', 'rapide', 'prix', 'combien',
    ];

    /**
     * La recherche corrigée, ou null si rien n'est à corriger. Les mots justes sont gardés tels
     * que tapés ; un mot corrigé prend la forme du vocabulaire, accents compris.
     */
    public function corriger(string $recherche): ?string
    {
        $vocabulaire = $this->vocabulaire();
        $prefixes = $this->prefixes();
        $corrige = false;

        $resultat = preg_replace_callback('/[\p{L}\p{N}]+/u', function (array $m) use ($vocabulaire, $prefixes, &$corrige) {
            $mot = $m[0];
            $cle = $this->cle($mot);
            if (mb_strlen($cle) < 4 || ctype_digit($cle) || isset($vocabulaire[$cle]) || in_array($cle, self::COURANTS, true) || $this->commencePar($cle, $prefixes)) {
                return $mot;
            }

            $seuil = mb_strlen($cle) <= 6 ? 1 : (mb_strlen($cle) <= 10 ? 2 : 3);
            $meilleur = null;
            $scoreMin = null;
            foreach ($vocabulaire as $connu => $forme) {
                $ecart = abs(strlen($connu) - strlen($cle));
                if ($ecart > $seuil) {
                    continue;
                }
                // Le plus proche d'abord ; à égalité, la même première lettre, puis la même longueur.
                $score = [$this->distance($cle, (string) $connu), $connu[0] === $cle[0] ? 0 : 1, $ecart];
                if ($scoreMin === null || $score < $scoreMin) {
                    [$meilleur, $scoreMin] = [$forme, $score];
                }
            }

            if ($meilleur === null || $scoreMin[0] > $seuil) {
                return $mot;
            }
            $corrige = true;

            // « Tanho » → « Tanoh » : la majuscule tapée est gardée.
            return mb_strtoupper(mb_substr($mot, 0, 1)) === mb_substr($mot, 0, 1) ? Str::ucfirst($meilleur) : $meilleur;
        }, $recherche);

        return $corrige ? $resultat : null;
    }

    /**
     * Distance d'édition où deux lettres voisines inversées (« tanho » / « tanoh ») ne comptent
     * que pour une faute, comme une lettre en trop, en moins ou remplacée.
     */
    private function distance(string $a, string $b): int
    {
        $la = strlen($a);
        $lb = strlen($b);
        $d = [];
        for ($i = 0; $i <= $la; $i++) {
            $d[$i] = [$i];
        }
        for ($j = 0; $j <= $lb; $j++) {
            $d[0][$j] = $j;
        }
        for ($i = 1; $i <= $la; $i++) {
            for ($j = 1; $j <= $lb; $j++) {
                $cout = $a[$i - 1] === $b[$j - 1] ? 0 : 1;
                $d[$i][$j] = min($d[$i - 1][$j] + 1, $d[$i][$j - 1] + 1, $d[$i - 1][$j - 1] + $cout);
                if ($i > 1 && $j > 1 && $a[$i - 1] === $b[$j - 2] && $a[$i - 2] === $b[$j - 1]) {
                    $d[$i][$j] = min($d[$i][$j], $d[$i - 2][$j - 2] + 1);
                }
            }
        }

        return $d[$la][$lb];
    }

    /** Mot sans accents ni majuscules, en ASCII : la clé de comparaison. */
    private function cle(string $mot): string
    {
        return Str::lower(Str::ascii($mot));
    }

    /** @param list<string> $prefixes */
    private function commencePar(string $cle, array $prefixes): bool
    {
        foreach ($prefixes as $prefixe) {
            if (str_starts_with($cle, $prefixe)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Préfixes du vocabulaire des secteurs (« fuit* », « plomb* ») : un mot qui en commence
     * par un est déjà compris, il n'est pas corrigé.
     *
     * @return list<string>
     */
    private function prefixes(): array
    {
        return collect(config('secteurs'))
            ->flatMap(fn (array $s) => array_keys($s['mots'] ?? []))
            ->filter(fn (string $m) => str_ends_with($m, '*') && strlen($m) >= 5)
            ->map(fn (string $m) => rtrim($m, '*'))
            ->values()
            ->all();
    }

    /**
     * Clé ASCII → forme affichée (« electricien » → « électricien »).
     *
     * @return array<string, string>
     */
    private function vocabulaire(): array
    {
        return Cache::remember('correcteur.vocabulaire', now()->addMinutes(10), function () {
            $textes = collect(config('secteurs'))
                ->flatMap(fn (array $s) => [
                    $s['nom'],
                    ...($s['problemes'] ?? []),
                    // Mots exacts du vocabulaire (sans « * ») : « wc », « chasse d eau »…
                    ...array_filter(array_keys($s['mots'] ?? []), fn (string $m) => ! str_ends_with($m, '*')),
                ])
                ->merge(['plombier', 'électricien', 'climaticien', 'serrurier', 'menuisier', 'pressing', 'technicien', 'dépannage', 'réparation', 'installation', 'entretien'])
                ->merge(collect(config('pressing.articles'))->pluck('nom'))
                ->merge(Prestation::query()->pluck('nom'))
                ->merge(Prestataire::query()->visibles()->pluck('metier'))
                ->merge(Prestataire::query()->visibles()->pluck('nom'))
                ->merge(Categorie::query()->ouvertes()->pluck('nom'))
                ->merge(Quartier::query()->pluck('nom'));

            $vocabulaire = [];
            foreach ($textes->filter() as $texte) {
                foreach (preg_split('/[^\p{L}\p{N}]+/u', (string) $texte, -1, PREG_SPLIT_NO_EMPTY) as $mot) {
                    if (mb_strlen($mot) >= 3) {
                        // La forme en minuscules, accents gardés ; la première rencontrée reste.
                        $vocabulaire[$this->cle($mot)] ??= mb_strtolower($mot);
                    }
                }
            }

            return $vocabulaire;
        });
    }
}
