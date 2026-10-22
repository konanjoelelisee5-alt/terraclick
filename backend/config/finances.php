<?php

/*
| Finances de la plateforme : valeurs par défaut des réglages que l'administrateur change ensuite
| depuis l'écran « Finances » (table `reglages`). Aucune commission tant qu'il n'en fixe pas.
*/

return [

    'defauts' => [
        // Commission globale, en % du montant de chaque mission accomplie ; null : aucune.
        'commission_taux' => null,
        // Le client et le prestataire peuvent-ils convenir d'un prix hors de la grille TerraClick ?
        'negociation_directe' => true,
        // Moyens de paiement proposés aux clients.
        'paiements' => ['especes', 'mobile_money', 'autre'],
        // Litiges tranchés contre un prestataire en 90 jours à partir desquels il est signalé « récidive ».
        'seuil_recidive' => 3,
    ],

    // Fenêtre de calcul de la récidive, en jours.
    'fenetre_recidive' => 90,

    // Moyens de paiement connus : libellé et précision montrés au client.
    'moyens' => [
        'especes' => ['Espèces', 'Réglées au prestataire, à la fin de l\'intervention.'],
        'mobile_money' => ['Mobile Money', 'Wave, Orange Money ou MTN, directement au prestataire.'],
        'virement' => ['Virement', 'Virement bancaire au prestataire, à convenir avec lui.'],
        'autre' => ['Autre moyen', 'Carte, virement… à convenir avec le pressing.'],
    ],

];
