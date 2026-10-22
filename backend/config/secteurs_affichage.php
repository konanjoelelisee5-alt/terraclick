<?php

/*
| Ce que l'administrateur peut choisir pour l'affichage d'un secteur côté client : les icônes
| (noms Lucide, déclarés aussi dans frontend/src/components/Icon.tsx) et les couleurs proposées.
| Une autre couleur reste possible (code #RRGGBB).
*/

return [

    'icones' => [
        'droplets', 'zap', 'snowflake', 'key-round', 'hammer', 'shirt', 'wrench', 'paint-roller',
        'paintbrush', 'spray-can', 'sparkles', 'washing-machine', 'refrigerator', 'tv', 'plug',
        'flame', 'wind', 'sun', 'tree-pine', 'bug', 'car', 'truck', 'scissors', 'laptop',
        'smartphone', 'home', 'hard-hat', 'brush',
    ],

    'couleurs' => [
        '#E25B1A' => 'Kola',
        '#1F7A57' => 'Lagune',
        '#B88700' => 'Soleil',
        '#5C5348' => 'Argile',
        '#1F5FA8' => 'Indigo',
        '#8E3B8A' => 'Bissap',
    ],

    // Catégorie de l'annuaire créée pour un secteur neuf quand aucune n'est choisie.
    'rubrique_nouveaux' => ['departement' => 'Maison & Bâtiment', 'nom' => 'Autres services'],

];
