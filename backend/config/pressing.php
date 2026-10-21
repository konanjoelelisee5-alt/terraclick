<?php

/*
| Articles du pack pressing : ce que le client peut envoyer au pressing, rangés par catégorie,
| avec un prix INDICATIF par pièce (F CFA), à valider avec les pressings partenaires. L'API
| recalcule toujours le total à partir de cette liste : le client ne fixe pas lui-même les prix.
*/

return [

    'categories' => [
        'vetements' => 'Vêtements',
        'tenues' => 'Tenues',
        'maison' => 'Linge de maison',
    ],

    'articles' => [
        'chemise' => ['nom' => 'Chemise', 'prix' => 500, 'categorie' => 'vetements'],
        'pantalon' => ['nom' => 'Pantalon', 'prix' => 500, 'categorie' => 'vetements'],
        'tshirt' => ['nom' => 'T-shirt ou polo', 'prix' => 300, 'categorie' => 'vetements'],
        'robe' => ['nom' => 'Robe', 'prix' => 1500, 'categorie' => 'vetements'],
        'jupe' => ['nom' => 'Jupe', 'prix' => 700, 'categorie' => 'vetements'],
        'costume' => ['nom' => 'Costume (veste et pantalon)', 'prix' => 3000, 'categorie' => 'tenues'],
        'veste' => ['nom' => 'Veste seule', 'prix' => 2000, 'categorie' => 'tenues'],
        'bazin' => ['nom' => 'Bazin ou boubou', 'prix' => 2000, 'categorie' => 'tenues'],
        'pagne' => ['nom' => 'Pagne', 'prix' => 700, 'categorie' => 'tenues'],
        'drap' => ['nom' => 'Drap', 'prix' => 1500, 'categorie' => 'maison'],
        'couette' => ['nom' => 'Couette ou couverture', 'prix' => 4000, 'categorie' => 'maison'],
        'rideau' => ['nom' => 'Rideau', 'prix' => 2500, 'categorie' => 'maison'],
    ],

];
