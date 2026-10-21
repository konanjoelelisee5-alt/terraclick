<?php

namespace Tests\Feature;

use App\Models\Accord;
use App\Models\Demande;
use App\Models\Prestataire;
use App\Models\User;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Onglets : seules les relations abouties, confirmées par le client, y figurent. */
class AccordTest extends TestCase
{
    use RefreshDatabase;

    private User $client;

    private int $koffi;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
        $this->client = User::factory()->create(['nom' => 'Awa Koné']);
        $this->koffi = Prestataire::where('nom', 'Koffi Tanoh')->value('id');
    }

    public function test_le_client_confirme_un_accord_conclu_par_whatsapp(): void
    {
        $id = $this->actingAs($this->client)->postJson('/api/accords', [
            'prestataire_id' => $this->koffi,
            'prestation' => 'reparation-de-tuyau-casse',
            'recherche' => 'tuyau cassé',
            'canal' => 'whatsapp',
            'montant' => 12000,
            'date_intervention' => '2026-10-22',
        ])->assertCreated()
            ->assertJsonPath('data.objet', 'Réparation de tuyau cassé')
            ->assertJsonPath('data.montant_affichage', '12 000 F')
            ->assertJsonPath('data.statut_libelle', 'Accord conclu')
            ->assertJsonPath('data.etapes.0.libelle', 'Recherche « tuyau cassé »')
            ->assertJsonPath('data.etapes.1.libelle', 'Contact : WhatsApp')
            ->assertJsonPath('data.prestataire.nom', 'Koffi Tanoh')
            ->json('data.id');

        // Les demandes de démonstration ont aussi leurs onglets : on reprend celui-ci.
        $accord = Accord::findOrFail($id);
        $this->assertMatchesRegularExpression('/^ACC-\d{4}-\d{5}$/', $accord->reference);

        $this->actingAs($this->client)->postJson("/api/accords/{$accord->id}/terminer")
            ->assertOk()
            ->assertJsonPath('data.statut', 'termine')
            ->assertJsonPath('data.etapes.3.libelle', 'Intervention terminée');

        $this->actingAs($this->client)->getJson('/api/accords')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_sans_prestation_l_objet_par_defaut_reprend_le_metier(): void
    {
        $this->actingAs($this->client)->postJson('/api/accords', ['prestataire_id' => $this->koffi, 'canal' => 'appel'])
            ->assertCreated()
            ->assertJsonPath('data.objet', 'Intervention Plombier')
            ->assertJsonCount(2, 'data.etapes');
    }

    public function test_un_onglet_reste_prive_et_demande_un_compte(): void
    {
        $this->postJson('/api/accords', ['prestataire_id' => $this->koffi, 'canal' => 'appel'])->assertUnauthorized();

        $this->actingAs($this->client)->postJson('/api/accords', ['prestataire_id' => $this->koffi, 'canal' => 'appel']);
        $autre = User::factory()->create();
        $this->actingAs($autre)->getJson('/api/accords/'.Accord::first()->id)->assertNotFound();
        $this->actingAs($autre)->getJson('/api/accords')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_une_demande_confirmee_dans_l_application_devient_un_onglet(): void
    {
        $aya = User::where('telephone', '+2250758421903')->firstOrFail();
        $terminee = $aya->hasMany(Demande::class)->where('statut', 'terminee')->firstOrFail();

        $this->actingAs($aya)->postJson("/api/demandes/{$terminee->id}/confirmer")->assertOk();

        $this->actingAs($aya)->getJson('/api/accords')
            ->assertOk()
            ->assertJsonPath('data.0.canal', 'demande')
            ->assertJsonPath('data.0.statut', 'termine')
            ->assertJsonPath('data.0.demande_reference', $terminee->reference)
            ->assertJsonPath('data.0.montant', 25000);
    }
}
