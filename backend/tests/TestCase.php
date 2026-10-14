<?php

namespace Tests;

use App\Contracts\EnvoiCode;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** Remplace l'envoi réel par une boîte aux lettres lisible depuis le test. */
    protected function intercepterCodes(): object
    {
        $boite = new class implements EnvoiCode
        {
            /** @var array<int, array{telephone: string, code: string, canal: string}> */
            public array $envois = [];

            public function envoyer(string $telephone, string $code, string $canal): void
            {
                $this->envois[] = compact('telephone', 'code', 'canal');
            }

            public function dernierCode(): ?string
            {
                return end($this->envois)['code'] ?? null;
            }
        };

        $this->app->instance(EnvoiCode::class, $boite);

        return $boite;
    }
}
