<?php

namespace Tests\Feature;

use App\Models\Recherche;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RechercheTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_visiteur_enregistre_sa_recherche_sans_compte(): void
    {
        $this->postJson('/api/recherches', ['texte' => 'ma douche fuit', 'ville' => 'Yamoussoukro', 'appareil_id' => 'abc'])
            ->assertCreated()
            ->assertJsonPath('data.secteur', 'plomberie');

        $this->assertDatabaseHas('recherches', ['texte' => 'ma douche fuit', 'user_id' => null, 'appareil_id' => 'abc']);
    }

    public function test_la_recherche_d_un_client_connecte_est_rattachee_a_son_compte_sur_tous_ses_appareils(): void
    {
        $user = User::factory()->create();
        $jeton = $user->createToken('telephone')->plainTextToken;

        $this->withToken($jeton)->postJson('/api/recherches', ['texte' => 'Serrurerie', 'categorie' => 'serruriers', 'appareil_id' => 'telephone'])
            ->assertCreated()
            ->assertJsonPath('data.secteur', 'serrurerie');
        $this->withToken($jeton)->postJson('/api/recherches', ['texte' => 'clim en panne', 'appareil_id' => 'ordinateur'])->assertCreated();

        $this->withToken($jeton)->getJson('/api/moi/recherches')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.texte', 'clim en panne')
            ->assertJsonPath('data.0.appareil_id', 'ordinateur');
    }

    public function test_effacer_son_historique_le_masque_pour_soi_mais_l_administration_le_garde(): void
    {
        $user = User::factory()->create();
        Recherche::create(['user_id' => $user->id, 'texte' => 'plombier']);

        $this->actingAs($user)->deleteJson('/api/moi/recherches')->assertOk();

        $this->actingAs($user)->getJson('/api/moi/recherches')->assertOk()->assertJsonCount(0, 'data');
        $this->assertDatabaseHas('recherches', ['texte' => 'plombier', 'user_id' => $user->id]);
        $this->assertNotNull(Recherche::first()->efface_le);
    }

    public function test_l_historique_demande_un_compte(): void
    {
        $this->getJson('/api/moi/recherches')->assertUnauthorized();
        $this->deleteJson('/api/moi/recherches')->assertUnauthorized();
    }
}
