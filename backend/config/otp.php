<?php

return [

    /*
    | Fournisseur utilisé pour chaque canal :
    |  - « log » écrit le code dans storage/logs/laravel.log (développement ; refusé en production) ;
    |  - « whatsapp_cloud » passe par WhatsApp Cloud API de Meta (voir config/services.php).
    | Un nouveau fournisseur s'ajoute comme une implémentation de App\Contracts\EnvoiCode,
    | déclarée dans AppServiceProvider::envoiCode().
    */
    'canaux' => [
        'sms' => env('OTP_SMS_DRIVER', 'log'),
        'whatsapp' => env('OTP_WHATSAPP_DRIVER', 'log'),
    ],

    // Si WhatsApp échoue (service injoignable, mauvaise configuration), le code part par SMS.
    'repli_sms' => (bool) env('OTP_REPLI_SMS', true),

    'longueur' => 6,

    'duree_minutes' => (int) env('OTP_DUREE_MINUTES', 10),

    // Au-delà, le code est grillé et il faut en redemander un.
    'tentatives_max' => 5,

    // Codes envoyés au plus, pour un même numéro. Chaque envoi coûte un SMS.
    'envois_par_minute' => (int) env('OTP_ENVOIS_PAR_MINUTE', 1),
    'envois_par_heure' => (int) env('OTP_ENVOIS_PAR_HEURE', 5),

    // Tous numéros confondus, depuis une même adresse IP. Les opérateurs mobiles partagent
    // souvent une IP entre beaucoup d'abonnés : ne pas descendre trop bas.
    'envois_par_ip_minute' => (int) env('OTP_ENVOIS_PAR_IP_MINUTE', 10),

    /*
    | Code imposé pour la démonstration (le frontend propose 417802). N'est pris
    | en compte qu'en environnement local ou de test, jamais en production.
    */
    'code_fixe' => env('OTP_CODE_FIXE'),

];
