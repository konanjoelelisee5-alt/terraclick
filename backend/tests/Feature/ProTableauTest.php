<?php

namespace Tests\Feature;

use App\Models\Demande;
use App\Models\Prestataire;
use App\Models\User;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Tableau de bord du prestataire, selon son secteur. */
class ProTableauTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
    }

    public function test_un_technicien_suit_ses_demandes_a_repondre_et_ses_missions(): void
    {
        $koffi = Prestataire::where('nom', 'Koffi Tanoh')->firstOrFail();
        $t = $this->actingAs($koffi->utilisateur)->getJson('/api/pro/tableau')->assertOk()->json('data');

        $this->assertFalse($t['fiche']['pressing']);
        $this->assertSame(['a_repondre', 'missions', 'note'], array_column($t['kpis'], 'cle'));
        $this->assertSame(Demande::where('prestataire_id', $koffi->id)->where('statut', 'envoyee')->count(), $t['kpis'][0]['valeur']);
        $this->assertCount(7, $t['semaine']['jours']);
        $this->assertSame(min(12, $koffi->demandes()->count()), count($t['suivi']));
        $this->actingAs($koffi->utilisateur)->getJson('/api/pro/tableau?semaine=1')->assertOk()->assertJsonPath('data.semaine.decalage', 1);
    }

    public function test_un_pressing_suit_ses_commandes_et_ses_pieces(): void
    {
        $gerant = User::where('telephone', '+2250708080808')->firstOrFail();
        $this->actingAs($gerant)->getJson('/api/pro/tableau')->assertOk()
            ->assertJsonPath('data.fiche.pressing', true)
            ->assertJsonPath('data.kpis.0.cle', 'en_cours')
            ->assertJsonPath('data.kpis.1.cle', 'pieces');

        // Un client n'a pas d'espace prestataire.
        $this->actingAs(User::where('telephone', '+2250758421903')->firstOrFail())->getJson('/api/pro/tableau')->assertForbidden();
    }
}
