<?php

namespace App\Services\EnvoiCode;

use App\Contracts\EnvoiCode;
use App\Exceptions\EnvoiCodeImpossible;
use Illuminate\Support\Facades\Log;

/** Choisit le fournisseur du canal demandé et se replie sur le SMS si WhatsApp échoue. */
class RouteurEnvoiCode
{
    /**
     * @param  array{sms: EnvoiCode, whatsapp: EnvoiCode}  $envois
     */
    public function __construct(private array $envois, private bool $repliSms) {}

    /**
     * @param  'sms'|'whatsapp'  $canal
     * @return 'sms'|'whatsapp' le canal par lequel le code est réellement parti
     *
     * @throws EnvoiCodeImpossible aucun canal n'a pu transmettre le code
     */
    public function envoyer(string $telephone, string $code, string $canal): string
    {
        try {
            $this->envois[$canal]->envoyer($telephone, $code, $canal);

            return $canal;
        } catch (EnvoiCodeImpossible $e) {
            if ($canal === 'sms' || ! $this->repliSms) {
                throw $e;
            }
            Log::warning("Code non envoyé par {$canal}, repli sur le SMS.", ['erreur' => $e->getMessage()]);
        }

        $this->envois['sms']->envoyer($telephone, $code, 'sms');

        return 'sms';
    }
}
