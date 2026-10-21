<?php

return [

    /*
    | Première version publique (MVP) : l'annuaire n'ouvre que six secteurs.
    | Les autres départements, catégories et prestataires restent en base, intacts ;
    | l'API les tait simplement. Pour rouvrir un secteur, ajoutez le slug de ses
    | catégories ci-dessous. MVP_ACTIF=false rouvre tout l'annuaire d'un coup.
    | La liste de ce qui est masqué est tenue dans le README à la racine du dépôt.
    */
    'actif' => (bool) env('MVP_ACTIF', true),

    'categories' => [
        // Plomberie
        'plombiers',
        'entretien-plomberie',
        // Électricité
        'electriciens',
        'entretien-electricite',
        // Climatisation
        'climatisation-vente-et-reparation',
        // Serrurerie
        'serruriers',
        // Menuiserie
        'menuisiers',
        // Pressing
        'pressing',
    ],

];
