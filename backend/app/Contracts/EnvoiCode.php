<?php

namespace App\Contracts;

use App\Exceptions\EnvoiCodeImpossible;

/** Transmet un code de connexion à l'utilisateur sur un canal donné (SMS ou WhatsApp). */
interface EnvoiCode
{
    /**
     * @param  string  $telephone  numéro normalisé (+225…)
     * @param  'sms'|'whatsapp'  $canal
     *
     * @throws EnvoiCodeImpossible
     */
    public function envoyer(string $telephone, string $code, string $canal): void;
}
