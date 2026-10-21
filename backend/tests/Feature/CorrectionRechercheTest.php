<?php

namespace Tests\Feature;

use Database\Seeders\CatalogueSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * « Essayez avec cette orthographe » : une faute de frappe est corrigée, les résultats portent
 * sur le mot voulu et le client en est prévenu ; il peut forcer la recherche telle que tapée.
 */
class CorrectionRechercheTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
    }

    public static function fautes(): array
    {
        return [
            'lettre remplacée' => ['plonbier', 'plombier', 'Koffi Tanoh'],
            'lettre en moins' => ['presing', 'pressing', 'Pressing Éclat'],
            'lettre en moins, métier' => ['serurier', 'serrurier', 'Serrurerie N\'Guessan'],
            'dans une phrase' => ['besoin d un plonbier urgent', 'besoin d un plombier urgent', 'Koffi Tanoh'],
            'lettres inversées, nom' => ['Koffi Tanho', 'Koffi Tanoh', 'Koffi Tanoh'],
        ];
    }

    #[DataProvider('fautes')]
    public function test_la_faute_est_corrigee_et_signalee(string $tapee, string $corrigee, string $trouve): void
    {
        $reponse = $this->getJson('/api/prestataires?'.http_build_query(['q' => $tapee]))->assertOk()
            ->assertJsonPath('analyse.correction.originale', $tapee)
            ->assertJsonPath('analyse.correction.corrigee', $corrigee);

        $this->assertContains($trouve, $reponse->json('data.*.nom'));
    }

    public function test_un_mot_juste_n_est_pas_corrige(): void
    {
        foreach (['plombier', 'ma douche fuit', 'électricien', 'Koffi'] as $q) {
            $this->getJson('/api/prestataires?'.http_build_query(['q' => $q]))->assertOk()->assertJsonPath('analyse.correction', null);
        }
    }

    public function test_rechercher_plutot_la_saisie_telle_quelle(): void
    {
        $this->getJson('/api/prestataires?'.http_build_query(['q' => 'plonbier', 'exact' => 1]))->assertOk()
            ->assertJsonPath('analyse.correction', null)
            ->assertJsonCount(0, 'data');
    }

    public function test_un_charabia_ne_devient_pas_un_mot(): void
    {
        $this->getJson('/api/prestataires?q=xqzwv')->assertOk()->assertJsonPath('analyse.correction', null);
    }
}
