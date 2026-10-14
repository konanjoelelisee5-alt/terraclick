<?php

namespace Tests\Feature;

use App\Exceptions\EnvoiCodeImpossible;
use App\Services\EnvoiCode\LogEnvoiCode;
use App\Services\EnvoiCode\RouteurEnvoiCode;
use App\Services\EnvoiCode\WhatsAppCloudEnvoiCode;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class EnvoiCodeTest extends TestCase
{
    private function whatsapp(?string $jeton = 'jeton-test', ?string $numeroId = '1234567890'): WhatsAppCloudEnvoiCode
    {
        return new WhatsAppCloudEnvoiCode($jeton, $numeroId, 'code_connexion', 'fr', 'v25.0');
    }

    public function test_whatsapp_envoie_le_modele_d_authentification(): void
    {
        Http::fake(['graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.X']]])]);

        $this->whatsapp()->envoyer('+2250758421903', '417802', 'whatsapp');

        Http::assertSent(function (Request $requete) {
            $code = [['type' => 'text', 'text' => '417802']];

            return $requete->url() === 'https://graph.facebook.com/v25.0/1234567890/messages'
                && $requete->hasHeader('Authorization', 'Bearer jeton-test')
                && $requete['messaging_product'] === 'whatsapp'
                && $requete['to'] === '2250758421903'
                && $requete['type'] === 'template'
                && $requete['template']['name'] === 'code_connexion'
                && $requete['template']['language'] === ['code' => 'fr']
                // Meta exige le code dans le texte et dans le bouton « Copier le code ».
                && $requete['template']['components'] === [
                    ['type' => 'body', 'parameters' => $code],
                    ['type' => 'button', 'sub_type' => 'url', 'index' => '0', 'parameters' => $code],
                ];
        });
    }

    public function test_whatsapp_refus_de_meta(): void
    {
        Http::fake(['graph.facebook.com/*' => Http::response(['error' => ['message' => 'Template name does not exist']], 404)]);

        $this->expectException(EnvoiCodeImpossible::class);
        $this->expectExceptionMessage('Template name does not exist');

        $this->whatsapp()->envoyer('+2250758421903', '417802', 'whatsapp');
    }

    public function test_whatsapp_injoignable(): void
    {
        Http::fake(fn () => throw new ConnectionException('délai dépassé'));

        $this->expectException(EnvoiCodeImpossible::class);

        $this->whatsapp()->envoyer('+2250758421903', '417802', 'whatsapp');
    }

    public function test_whatsapp_non_configure_n_appelle_pas_meta(): void
    {
        Http::fake();

        try {
            $this->whatsapp(jeton: null)->envoyer('+2250758421903', '417802', 'whatsapp');
            $this->fail('Une configuration incomplète doit être signalée.');
        } catch (EnvoiCodeImpossible $e) {
            $this->assertStringContainsString('WHATSAPP_TOKEN', $e->getMessage());
        }

        Http::assertNothingSent();
    }

    public function test_le_mode_log_est_refuse_en_production(): void
    {
        $this->app['env'] = 'production';
        Log::spy();

        $this->expectException(EnvoiCodeImpossible::class);

        try {
            (new LogEnvoiCode)->envoyer('+2250758421903', '417802', 'sms');
        } finally {
            Log::shouldNotHaveReceived('info');
        }
    }

    public function test_le_routeur_suit_la_configuration(): void
    {
        config([
            'otp.canaux.whatsapp' => 'whatsapp_cloud',
            'services.whatsapp.token' => 'jeton-test',
            'services.whatsapp.phone_number_id' => '1234567890',
        ]);
        $this->app->forgetInstance(RouteurEnvoiCode::class);
        Http::fake(['graph.facebook.com/*' => Http::response([], 200)]);

        $canal = $this->app->make(RouteurEnvoiCode::class)->envoyer('+2250758421903', '417802', 'whatsapp');

        $this->assertSame('whatsapp', $canal);
        Http::assertSentCount(1);
    }
}
