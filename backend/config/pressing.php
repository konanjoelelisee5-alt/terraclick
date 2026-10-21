<?php

/*
| Commande au pressing : articles du pack, services, dépôt, créneaux, suivi et motifs de
| signalement. Les prix sont INDICATIFS (F CFA), à valider avec les pressings partenaires.
| L'API recalcule toujours le total à partir de ces réglages : le client ne fixe pas les prix.
*/

return [

    'categories' => [
        'vetements' => 'Vêtements',
        'tenues' => 'Tenues',
        'maison' => 'Linge de maison',
    ],

    // Prix par pièce pour le service de base (lavage et repassage).
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

    // Service choisi : le prix par pièce est multiplié par `coef` (en %), arrondi à 25 F.
    'services' => [
        'lavage' => ['nom' => 'Lavage et repassage', 'detail' => 'Lavé, séché, repassé et plié.', 'coef' => 100],
        'repassage' => ['nom' => 'Repassage seul', 'detail' => 'Vos vêtements déjà propres, repassés.', 'coef' => 50],
        'nettoyage_sec' => ['nom' => 'Nettoyage à sec', 'detail' => 'Pour les tissus délicats, costumes, bazin.', 'coef' => 150],
    ],

    // Express : en plus du service, majoration en %.
    'express' => ['nom' => 'Express', 'detail' => 'Prêt en 24 h', 'majoration' => 50],

    'depots' => [
        'collecte' => ['nom' => 'Collecte à domicile', 'detail' => 'Un agent du pressing vient chercher votre linge, puis vous le rapporte.'],
        'pressing' => ['nom' => 'Dépôt au pressing', 'detail' => 'Vous déposez et récupérez votre linge vous-même.'],
    ],

    // Heures proposées pour la collecte ou le dépôt.
    'heures' => ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],

    // Suivi de la commande, étape par étape, selon le mode de dépôt. Le pressing fait avancer.
    'etapes' => [
        'collecte' => ['agent_en_route', 'collectee', 'recue', 'en_traitement', 'prete', 'en_livraison', 'livree'],
        'pressing' => ['recue', 'en_traitement', 'prete', 'livree'],
    ],

    'libelles_etapes' => [
        'agent_en_route' => 'Agent en route',
        'collectee' => 'Collectée',
        'recue' => 'Reçue au pressing',
        'en_traitement' => 'En traitement',
        'prete' => 'Prête',
        'en_livraison' => 'En livraison',
        'livree' => 'Livrée',
    ],

    'motifs_signalement' => [
        'retard' => 'Retard',
        'manquant' => 'Vêtement manquant',
        'erreur' => 'Erreur dans la commande',
        'endommage' => 'Article endommagé',
        'autre' => 'Autre problème',
    ],

];
