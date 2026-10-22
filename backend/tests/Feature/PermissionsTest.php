<?php

namespace Tests\Feature;

use App\Models\Demande;
use App\Models\Prestataire;
use App\Models\Prestation;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Rôles et permissions : chaque interface s'ouvre à sa permission (middleware), chaque action
 * est vérifiée objet par objet (policies), et la base est peuplée d'un compte par rôle.
 */
class PermissionsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $manager;

    private User $prestataire;

    private User $client;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
        $this->admin = User::where('telephone', '+2250701010101')->firstOrFail();
        $this->manager = User::where('telephone', '+2250702020202')->firstOrFail();
        $this->prestataire = User::where('telephone', '+2250707070707')->firstOrFail();
        $this->client = User::where('telephone', '+2250758421903')->firstOrFail();
    }

    public function test_la_base_a_un_compte_par_role_et_ses_permissions(): void
    {
        $this->assertTrue($this->admin->aRole('admin'));
        $this->assertTrue($this->manager->aRole('manager'));
        $this->assertTrue($this->prestataire->aRole('prestataire'));
        $this->assertTrue($this->client->aRole('client'));

        $this->assertSame(count(array_merge(...array_values(config('acces.permissions')))), count($this->admin->permissions()));
        $this->assertTrue($this->manager->peut('candidatures.traiter'));
        $this->assertFalse($this->manager->peut('roles.gerer'));
        $this->assertTrue($this->prestataire->peut('pro.demandes'));
        $this->assertFalse($this->client->peut('pro.acceder'));

        // L'application reçoit rôles et permissions avec le compte.
        $this->actingAs($this->manager)->getJson('/api/moi')->assertOk()
            ->assertJsonPath('data.roles.0', 'manager')
            ->assertJsonPath('data.est_admin', true);
    }

    public function test_un_nouveau_compte_est_client(): void
    {
        $nouveau = User::factory()->create();

        $this->assertSame(['client'], $nouveau->roles()->pluck('cle')->all());
        $this->assertTrue($nouveau->peut('demandes.envoyer'));
    }

    public function test_chaque_interface_s_ouvre_a_sa_permission(): void
    {
        // Espace administrateur : ni client ni prestataire.
        foreach ([$this->client, $this->prestataire] as $compte) {
            $this->actingAs($compte)->getJson('/api/admin/apercu')->assertForbidden()
                ->assertJsonPath('message', 'Votre compte n\'a pas accès à cette partie de TerraClick.');
        }
        // Espace prestataire : ni client ni manager.
        $this->actingAs($this->client)->getJson('/api/pro/demandes')->assertForbidden();
        $this->actingAs($this->manager)->getJson('/api/pro/demandes')->assertForbidden();
        $this->actingAs($this->prestataire)->getJson('/api/pro/demandes')->assertOk();
    }

    public function test_le_manager_gere_l_operationnel_mais_pas_l_administration(): void
    {
        foreach (['apercu', 'activite', 'candidatures', 'signalements', 'demandes', 'prestataires', 'utilisateurs'] as $module) {
            $this->actingAs($this->manager)->getJson("/api/admin/{$module}")->assertOk();
        }
        $this->actingAs($this->manager)->getJson('/api/admin/roles')->assertForbidden();

        $koffi = Prestataire::where('nom', 'Koffi Tanoh')->firstOrFail();
        $this->actingAs($this->manager)->patchJson("/api/admin/prestataires/{$koffi->id}", ['actif' => false])->assertOk();
        $this->actingAs($this->manager)->patchJson("/api/admin/prestataires/{$koffi->id}", ['en_vedette' => true])->assertForbidden();
        $this->actingAs($this->manager)->patchJson('/api/admin/prestations/'.Prestation::firstOrFail()->id, ['prix_min' => 1000])->assertForbidden();
        $this->actingAs($this->manager)->patchJson("/api/admin/utilisateurs/{$this->client->id}", ['roles' => ['manager']])->assertForbidden();
    }

    public function test_seul_un_administrateur_donne_le_role_administrateur(): void
    {
        $this->actingAs($this->admin)->patchJson("/api/admin/utilisateurs/{$this->manager->id}", ['roles' => ['manager', 'admin']])->assertOk();

        // Un rôle qui n'existe pas est refusé.
        $this->actingAs($this->admin)->patchJson("/api/admin/utilisateurs/{$this->client->id}", ['roles' => ['roi']])->assertStatus(422);
    }

    public function test_la_matrice_des_roles_se_modifie_sauf_pour_l_administrateur(): void
    {
        $reponse = $this->actingAs($this->admin)->getJson('/api/admin/roles')->assertOk();
        $this->assertSame(['client', 'prestataire', 'manager', 'admin'], collect($reponse->json('data.roles'))->pluck('cle')->all());
        $this->assertSame(['Espace client', 'Espace prestataire', 'Espace administrateur'], collect($reponse->json('data.groupes'))->pluck('nom')->all());

        // Donner au manager la mise en avant : il peut aussitôt mettre en avant.
        $manager = Role::where('cle', 'manager')->firstOrFail();
        $permissions = [...$manager->permissions()->pluck('cle'), 'prestataires.mettre_en_avant'];
        $this->actingAs($this->admin)->putJson("/api/admin/roles/{$manager->id}", ['permissions' => $permissions])->assertOk();
        $koffi = Prestataire::where('nom', 'Koffi Tanoh')->firstOrFail();
        $this->actingAs($this->manager->fresh())->patchJson("/api/admin/prestataires/{$koffi->id}", ['en_vedette' => true])->assertOk();

        $admin = Role::where('cle', 'admin')->firstOrFail();
        $this->actingAs($this->admin)->putJson("/api/admin/roles/{$admin->id}", ['permissions' => []])->assertForbidden();
        $this->actingAs($this->manager->fresh())->putJson("/api/admin/roles/{$manager->id}", ['permissions' => []])->assertForbidden();
    }

    public function test_une_demande_n_existe_que_pour_son_client_son_prestataire_et_l_equipe(): void
    {
        $demande = Demande::where('user_id', $this->client->id)->whereHas('prestataire', fn ($p) => $p->where('nom', 'Koffi Tanoh'))->firstOrFail();

        $this->actingAs($this->client)->getJson("/api/demandes/{$demande->id}")->assertOk();
        $this->actingAs($this->prestataire)->getJson("/api/pro/demandes/{$demande->id}")->assertOk();
        $this->actingAs($this->manager)->getJson("/api/admin/demandes/{$demande->id}")->assertOk();
        $this->actingAs(User::factory()->create())->getJson("/api/demandes/{$demande->id}")->assertNotFound();
        $this->actingAs(User::where('telephone', '+2250708080808')->firstOrFail())->getJson("/api/pro/demandes/{$demande->id}")->assertNotFound();
    }
}
