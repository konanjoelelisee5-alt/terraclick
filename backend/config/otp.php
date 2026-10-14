<?php

return [

    /*
    | Canal d'envoi des codes. « log » écrit le code dans storage/logs/laravel.log ;
    | un fournisseur SMS/WhatsApp réel s'ajoute comme une nouvelle implémentation
    | de App\Contracts\EnvoiCode, déclarée dans AppServiceProvider.
    */
    'driver' => env('OTP_DRIVER', 'log'),

    'longueur' => 6,

    'duree_minutes' => (int) env('OTP_DUREE_MINUTES', 10),

    // Au-delà, le code est grillé et il faut en redemander un.
    'tentatives_max' => 5,

    // Codes envoyés au plus, pour un même numéro. Chaque envoi coûte un SMS.
    'envois_par_minute' => (int) env('OTP_ENVOIS_PAR_MINUTE', 1),
    'envois_par_heure' => (int) env('OTP_ENVOIS_PAR_HEURE', 5),

    /*
    | Code imposé pour la démonstration (le frontend propose 417802). N'est pris
    | en compte qu'en environnement local ou de test, jamais en production.
    */
    'code_fixe' => env('OTP_CODE_FIXE'),

];
