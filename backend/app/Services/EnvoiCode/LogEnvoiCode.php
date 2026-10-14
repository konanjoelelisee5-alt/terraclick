<?php

namespace App\Services\EnvoiCode;

use App\Contracts\EnvoiCode;
use Illuminate\Support\Facades\Log;

/** Développement : le code apparaît dans storage/logs/laravel.log au lieu d'être envoyé. */
class LogEnvoiCode implements EnvoiCode
{
    public function envoyer(string $telephone, string $code, string $canal): void
    {
        Log::info("Code de connexion Servis Yakro pour {$telephone} ({$canal}) : {$code}");
    }
}
