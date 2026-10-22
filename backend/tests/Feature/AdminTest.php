<?php

namespace Tests\Feature;

use App\Models\Demande;
use App\Models\Prestataire;
use App\Models\Prestation;
use App\Models\User;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Espace administrateur : réservé à l'équipe ; vue d'ensemble, signalements, demandes,
 * prestataires (suspendre, mettre en avant), utilisateurs (accès équipe), prix, journal.
 */
class AdminTest extends TestCase
{
    use RefreshDatabase;

    private User $equipe;

    private User $aya;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
        $this->equipe = User::where('telephone', '+2250701010101')->firstOrFail();
        $this->aya = User::where('telephone', '+2250758421903')->firstOrFail();
    }

    public function test_tout_l_espace_est_reserve_a_l_equipe(): void
    {
        foreach (['apercu', 'signalements', 'demandes', 'prestataires', 'utilisateurs', 'prestations', 'activite'] as $page) {
            $this->actingAs($this->aya)->getJson("/api/admin/{$page}")->assertForbidden();
            $this->actingAs($this->equipe)->getJson("/api/admin/{$page}")->assertOk();
        }
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/admin/apercu')->assertUnauthorized();
    }

    public function test_la_vue_d_ensemble_compte_ce_qui_attend_l_equipe(): void
    {
        $reponse = $this->actingAs($this->equipe)->getJson('/api/admin/apercu')->assertOk()
            ->assertJsonPath('data.a_traiter.candidatures', 0)
            ->assertJsonPath('data.a_traiter.signalements', 0);

        $this->assertSame(User::count(), $reponse->json('data.chiffres.utilisateurs'));
        $this->assertCount(6, $reponse->json('data.demandes_par_secteur'));
    }

    public function test_l_equipe_traite_un_signalement(): void
    {
        $demande = Demande::where('user_id', $this->aya->id)->firstOrFail();
        $this->actingAs($this->aya)->postJson("/api/demandes/{$demande->id}/signalements", ['motif' => 'retard'])->assertCreated();

        $id = $this->actingAs($this->equipe)->getJson('/api/admin/signalements')->assertOk()
            ->assertJsonPath('data.0.motif_libelle', 'Retard')
            ->assertJsonPath('data.0.client.nom', 'Aya Konan')
            ->json('data.0.id');

        $this->actingAs($this->equipe)->postJson("/api/admin/signalements/{$id}/traiter")->assertStatus(422);
        $this->actingAs($this->equipe)->postJson("/api/admin/signalements/{$id}/traiter", ['reponse' => 'Technicien rappelé, il passe demain.'])
            ->assertOk()->assertJsonPath('data.statut', 'traite');
        $this->actingAs($this->equipe)->getJson('/api/admin/signalements')->assertJsonCount(0, 'data');
        $this->actingAs($this->equipe)->getJson('/api/admin/signalements?statut=traite')->assertJsonPath('data.0.reponse', 'Technicien rappelé, il passe demain.');
    }

    public function test_toutes_les_demandes_avec_filtres_et_detail(): void
    {
        $this->actingAs($this->equipe)->getJson('/api/admin/demandes')->assertOk()
            ->assertJsonPath('meta.total', Demande::count());
        $this->actingAs($this->equipe)->getJson('/api/admin/demandes?statut=annulee')->assertJsonPath('data.0.statut', 'annulee');
        $id = $this->actingAs($this->equipe)->getJson('/api/admin/demandes?q=Koffi')->json('data.0.id');

        $this->actingAs($this->equipe)->getJson("/api/admin/demandes/{$id}")->assertOk()
            ->assertJsonPath('data.prestataire.nom', 'Koffi Tanoh')
            ->assertJsonPath('data.client.nom', 'Aya Konan');
    }

    public function test_suspendre_puis_reactiver_un_prestataire(): void
    {
        $koffi = Prestataire::where('nom', 'Koffi Tanoh')->firstOrFail();

        $this->actingAs($this->equipe)->patchJson("/api/admin/prestataires/{$koffi->id}", ['actif' => false])->assertOk()->assertJsonPath('data.actif', false);
        $this->getJson("/api/prestataires/{$koffi->id}")->assertNotFound();
        $this->actingAs($this->equipe)->getJson('/api/admin/prestataires?etat=suspendus')->assertJsonPath('data.0.nom', 'Koffi Tanoh');

        $this->actingAs($this->equipe)->patchJson("/api/admin/prestataires/{$koffi->id}", ['actif' => true, 'en_vedette' => true])->assertOk()
            ->assertJsonPath('data.en_vedette', true)
            ->assertJsonPath('data.compte.nom', 'Koffi Tanoh');
        $this->getJson("/api/prestataires/{$koffi->id}")->assertOk();
    }

    public function test_donner_l_acces_equipe_sans_pouvoir_se_le_retirer(): void
    {
        $this->actingAs($this->equipe)->getJson('/api/admin/utilisateurs?q=58 42')->assertOk()->assertJsonPath('data.0.nom', 'Aya Konan');

        $this->actingAs($this->equipe)->patchJson("/api/admin/utilisateurs/{$this->aya->id}", ['roles' => ['client', 'admin']])->assertOk()
            ->assertJsonPath('data.roles.1.cle', 'admin');
        $this->actingAs($this->aya->refresh())->getJson('/api/admin/apercu')->assertOk();

        $this->actingAs($this->equipe)->patchJson("/api/admin/utilisateurs/{$this->equipe->id}", ['roles' => ['client']])->assertForbidden();
    }

    public function test_modifier_le_prix_indicatif_d_une_prestation(): void
    {
        $prestation = Prestation::firstOrFail();

        $this->actingAs($this->equipe)->patchJson("/api/admin/prestations/{$prestation->id}", ['prix_min' => 9000, 'prix_max' => 5000])
            ->assertStatus(422)->assertJsonValidationErrors('prix_max');
        $this->actingAs($this->equipe)->patchJson("/api/admin/prestations/{$prestation->id}", ['prix_min' => 5000, 'prix_max' => 9000])
            ->assertOk()->assertJsonPath('data.prix_affichage', '5 000 – 9 000 F');
    }

    public function test_le_journal_reprend_les_etapes_des_demandes(): void
    {
        $this->actingAs($this->equipe)->getJson('/api/admin/activite')->assertOk()
            ->assertJsonPath('data.0.type', 'demande');
    }
}
