<?php

namespace Tests\Feature;

use App\Models\Demande;
use App\Models\User;
use App\Models\Ville;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Tableau de bord de l'équipe : indicateurs comparés, courbe, parcours d'une demande, secteurs, quartiers. */
class AdminTableauTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
    }

    public function test_le_tableau_de_la_periode(): void
    {
        $admin = User::where('telephone', '+2250701010101')->firstOrFail();
        $t = $this->actingAs($admin)->getJson('/api/admin/tableau?jours=30')->assertOk()->json('data');

        $demandes = Demande::where('created_at', '>=', now()->subDays(29)->startOfDay())->count();
        $this->assertSame(['demandes', 'missions', 'encaisse', 'clients', 'annulation'], array_column($t['kpis'], 'cle'));
        $this->assertSame($demandes, $t['kpis'][0]['valeur']);
        $this->assertCount(30, $t['courbe']);
        $this->assertSame($demandes, array_sum(array_column($t['courbe'], 'demandes')));
        $this->assertSame(['Envoyées', 'Acceptées', 'Terminées', 'Confirmées'], array_column($t['entonnoir'], 'libelle'));
        $this->assertSame($demandes, array_sum(array_column($t['secteurs'], 'nombre')));

        // Une ville sans demandes : tout est à zéro.
        $daloa = Ville::where('slug', 'daloa')->value('id');
        $this->actingAs($admin)->getJson("/api/admin/tableau?jours=7&ville={$daloa}")->assertOk()->assertJsonPath('data.kpis.0.valeur', 0)->assertJsonCount(7, 'data.courbe');
        $this->actingAs($admin)->getJson('/api/admin/tableau?jours=12')->assertStatus(422);
        $this->actingAs(User::where('telephone', '+2250758421903')->firstOrFail())->getJson('/api/admin/tableau')->assertForbidden();
    }
}
