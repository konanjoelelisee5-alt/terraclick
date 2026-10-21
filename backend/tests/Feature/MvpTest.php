<?php

namespace Tests\Feature;

use App\Models\Prestataire;
use App\Models\User;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Première version : seuls plomberie, électricité, climatisation, serrurerie et menuiserie sont ouverts. */
class MvpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
    }

    public function test_le_mega_menu_ne_garde_que_les_secteurs_ouverts(): void
    {
        $reponse = $this->getJson('/api/departements')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nom', 'Maison & Bâtiment');

        $categories = collect($reponse->json('data.0.rubriques'))->flatMap(fn ($r) => array_column($r['categories'], 'nom'));
        $this->assertEqualsCanonicalizing(
            ['Menuisiers', 'Serruriers', 'Plombiers', 'Électriciens', 'Climatisation : vente et réparation', 'Entretien plomberie', 'Entretien électricité', 'Pressing'],
            $categories->all(),
        );
        $this->assertNotContains('Immobilier', array_column($reponse->json('data.0.rubriques'), 'nom'));

        // Koffi, Ali, Élec Yakro, ClimaCool, Serrurerie N'Guessan, Menuiserie Konaté, les deux pressings.
        $this->assertSame(8, $reponse->json('data.0.nombre_prestataires'));
    }

    public function test_la_recherche_tait_les_metiers_masques(): void
    {
        $noms = $this->getJson('/api/prestataires?par_page=50')->assertOk()->json('data.*.nom');

        $this->assertEqualsCanonicalizing(
            ['Koffi Tanoh', 'Ali Diomandé', 'Élec Yakro', 'ClimaCool CI', 'Serrurerie N\'Guessan', 'Menuiserie Konaté', 'Pressing Éclat', 'Yakro Pressing'],
            $noms,
        );
        $this->assertSame([], $this->getJson('/api/prestataires?q=garage')->json('data'));
        $this->assertSame([], $this->getJson('/api/prestataires?categorie=mecanicien-auto')->json('data'));
        $this->assertSame([], $this->getJson('/api/prestataires?departement=auto-transport')->json('data'));
    }

    public function test_un_metier_masque_ne_ressort_pas_par_un_prestataire_mixte(): void
    {
        // Ali Diomandé est plombier (ouvert) et carreleur (masqué).
        $this->assertSame([], $this->getJson('/api/prestataires?categorie=carreleurs')->json('data'));

        $ali = collect($this->getJson('/api/prestataires?q=Ali')->json('data'))->first();
        $this->assertSame(['Plombiers'], $ali['categories']);
    }

    public function test_les_vedettes_restent_dans_le_perimetre(): void
    {
        $this->assertEqualsCanonicalizing(
            ['ClimaCool CI', 'Serrurerie N\'Guessan', 'Menuiserie Konaté'],
            $this->getJson('/api/prestataires/vedettes')->assertOk()->json('data.*.nom'),
        );
    }

    public function test_la_fiche_et_les_avis_d_un_prestataire_masque_sont_introuvables(): void
    {
        $garage = Prestataire::where('nom', 'Garage Bamba')->first();

        $this->getJson("/api/prestataires/{$garage->id}")->assertNotFound();
        $this->getJson("/api/prestataires/{$garage->id}/avis")->assertNotFound();
        $this->actingAs(User::factory()->create())
            ->postJson("/api/prestataires/{$garage->id}/avis", ['ponctualite' => 5, 'qualite' => 5, 'prix' => 5])
            ->assertNotFound();
    }

    public function test_couper_le_mvp_rouvre_tout_l_annuaire(): void
    {
        config(['mvp.actif' => false]);

        $this->getJson('/api/departements')->assertJsonCount(12, 'data');
        $this->assertContains('Garage Bamba', $this->getJson('/api/prestataires?q=garage')->json('data.*.nom'));
    }
}
