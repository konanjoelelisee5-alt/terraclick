<?php

namespace App\Contracts;

/** Transmet un code de connexion à l'utilisateur, par SMS ou WhatsApp. */
interface EnvoiCode
{
    /**
     * @param  string  $telephone  numéro normalisé (+225…)
     * @param  'sms'|'whatsapp'  $canal
     */
    public function envoyer(string $telephone, string $code, string $canal): void;
}
