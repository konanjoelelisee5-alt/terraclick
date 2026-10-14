<?php

namespace App\Services\EnvoiCode;

use App\Contracts\EnvoiCode;
use App\Exceptions\EnvoiCodeImpossible;
use Illuminate\Support\Facades\Log;

/** Développement : le code apparaît dans storage/logs/laravel.log au lieu d'être envoyé. */
class LogEnvoiCode implements EnvoiCode
{
    public function envoyer(string $telephone, string $code, string $canal): void
    {
        // En production, personne ne lit ce fichier : l'utilisateur ne recevrait jamais son code.
        if (app()->isProduction()) {
            throw new EnvoiCodeImpossible("Aucun fournisseur réel configuré pour le canal {$canal} (OTP_".strtoupper($canal).'_DRIVER=log).');
        }

        Log::info("Code de connexion Servis Yakro pour {$telephone} ({$canal}) : {$code}");
    }
}
