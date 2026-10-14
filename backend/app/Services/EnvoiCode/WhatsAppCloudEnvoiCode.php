<?php

namespace App\Services\EnvoiCode;

use App\Contracts\EnvoiCode;
use App\Exceptions\EnvoiCodeImpossible;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Envoi par WhatsApp Cloud API (Meta), avec un modèle « Authentification » à bouton
 * « Copier le code ». Meta exige le code deux fois : dans le texte et dans le bouton.
 *
 * Meta répond 200 dès que le message est accepté ; un échec de remise (numéro sans
 * WhatsApp, par exemple) n'arrive que plus tard, par webhook. Seules les erreurs
 * immédiates déclenchent donc le repli sur le SMS.
 */
class WhatsAppCloudEnvoiCode implements EnvoiCode
{
    public function __construct(
        private ?string $jeton,
        private ?string $numeroId,
        private string $modele,
        private string $langue,
        private string $version,
    ) {}

    public function envoyer(string $telephone, string $code, string $canal): void
    {
        if (! $this->jeton || ! $this->numeroId) {
            throw new EnvoiCodeImpossible('WhatsApp non configuré : WHATSAPP_TOKEN et WHATSAPP_PHONE_NUMBER_ID sont requis.');
        }

        $parametres = [['type' => 'text', 'text' => $code]];

        try {
            $reponse = Http::withToken($this->jeton)
                ->acceptJson()
                ->timeout(10)
                ->post("https://graph.facebook.com/{$this->version}/{$this->numeroId}/messages", [
                    'messaging_product' => 'whatsapp',
                    'recipient_type' => 'individual',
                    // Meta attend l'indicatif sans « + » : 2250758421903.
                    'to' => ltrim($telephone, '+'),
                    'type' => 'template',
                    'template' => [
                        'name' => $this->modele,
                        'language' => ['code' => $this->langue],
                        'components' => [
                            ['type' => 'body', 'parameters' => $parametres],
                            ['type' => 'button', 'sub_type' => 'url', 'index' => '0', 'parameters' => $parametres],
                        ],
                    ],
                ]);
        } catch (ConnectionException $e) {
            throw new EnvoiCodeImpossible('WhatsApp injoignable : '.$e->getMessage(), previous: $e);
        }

        if ($reponse->failed()) {
            throw new EnvoiCodeImpossible(sprintf(
                'WhatsApp a refusé l\'envoi (HTTP %d) : %s',
                $reponse->status(),
                $reponse->json('error.message') ?? 'réponse sans détail',
            ));
        }
    }
}
