<?php

/*
| Suivi d'une demande d'intervention (plomberie, électricité, climatisation, serrurerie,
| menuiserie) dans les onglets du client. Le pressing a ses propres étapes et motifs
| (config/pressing.php).
*/

return [

    // Étapes affichées dans l'onglet, dans l'ordre du cycle de vie de la demande.
    'etapes' => [
        'envoyee' => 'Demande envoyée',
        'acceptee' => 'Acceptée par le technicien',
        'en_cours' => 'Intervention en cours',
        'terminee' => 'Terminée par le technicien',
        'confirmee' => 'Problème résolu, confirmé par vous',
    ],

    'motifs_signalement' => [
        'retard' => 'Retard',
        'absent' => 'Le technicien n\'est pas venu',
        'travail' => 'Travail mal fait',
        'prix' => 'Prix différent de l\'accord',
        'non_termine' => 'Prestation non terminée',
        'autre' => 'Autre problème',
    ],

    // Ce que le prestataire peut déclarer sur une demande.
    'motifs_prestataire' => [
        'paiement' => 'Paiement non effectué',
        'injoignable' => 'Client absent ou injoignable',
        'prix' => 'Désaccord sur le prix',
        'autre' => 'Autre problème',
    ],

];
