<?php

namespace Tests;

use App\Contracts\EnvoiCode;
use App\Exceptions\EnvoiCodeImpossible;
use App\Services\EnvoiCode\RouteurEnvoiCode;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Remplace les fournisseurs réels par une boîte aux lettres lisible depuis le test.
     * Les canaux listés dans `$boite->enPanne` échouent, pour tester le repli.
     */
    protected function intercepterCodes(): object
    {
        $boite = new class implements EnvoiCode
        {
            /** @var array<int, array{telephone: string, code: string, canal: string}> */
            public array $envois = [];

            /** @var list<string> */
            public array $enPanne = [];

            public function envoyer(string $telephone, string $code, string $canal): void
            {
                if (in_array($canal, $this->enPanne, true)) {
                    throw new EnvoiCodeImpossible("Panne simulée du canal {$canal}");
                }
                $this->envois[] = compact('telephone', 'code', 'canal');
            }

            public function dernierCode(): ?string
            {
                return end($this->envois)['code'] ?? null;
            }
        };

        $this->app->instance(
            RouteurEnvoiCode::class,
            new RouteurEnvoiCode(['sms' => $boite, 'whatsapp' => $boite], repliSms: true),
        );

        return $boite;
    }
}
