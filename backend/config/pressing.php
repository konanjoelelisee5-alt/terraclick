<?php

/*
| Articles du pack pressing : ce que le client peut envoyer au pressing, avec un prix
| INDICATIF par pièce (F CFA), à valider avec les pressings partenaires. L'API recalcule
| toujours le total à partir de cette liste : le client ne fixe pas lui-même les prix.
*/

return [

    'articles' => [
        'chemise' => ['nom' => 'Chemise', 'prix' => 500],
        'pantalon' => ['nom' => 'Pantalon', 'prix' => 500],
        'tshirt' => ['nom' => 'T-shirt ou polo', 'prix' => 300],
        'robe' => ['nom' => 'Robe', 'prix' => 1500],
        'jupe' => ['nom' => 'Jupe', 'prix' => 700],
        'costume' => ['nom' => 'Costume (veste et pantalon)', 'prix' => 3000],
        'veste' => ['nom' => 'Veste seule', 'prix' => 2000],
        'bazin' => ['nom' => 'Bazin ou boubou', 'prix' => 2000],
        'pagne' => ['nom' => 'Pagne', 'prix' => 700],
        'drap' => ['nom' => 'Drap', 'prix' => 1500],
        'couette' => ['nom' => 'Couette ou couverture', 'prix' => 4000],
        'rideau' => ['nom' => 'Rideau', 'prix' => 2500],
    ],

];
