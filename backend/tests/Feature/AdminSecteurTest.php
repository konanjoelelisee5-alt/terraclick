<?php

namespace Tests\Feature;

use App\Models\Categorie;
use App\Models\Demande;
use App\Models\Prestation;
use App\Models\Secteur;
use App\Models\User;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Database\Seeders\PrestationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Secteurs d'activité gérés par l'administrateur : création, modification, activation,
 * ordre d'affichage, sous-services et statistiques — et leur effet dans l'application client.
 */
class AdminSecteurTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $manager;

    private User $client;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        $this->seed([CatalogueSeeder::class, PrestationSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
        $this->admin = User::where('telephone', '+2250701010101')->firstOrFail();
        $this->manager = User::where('telephone', '+2250702020202')->firstOrFail();
        $this->client = User::where('telephone', '+2250758421903')->firstOrFail();
    }

    public function test_les_six_secteurs_d_aujourd_hui_sont_en_base_avec_leurs_chiffres(): void
    {
        $reponse = $this->actingAs($this->admin)->getJson('/api/admin/secteurs')->assertOk();

        $this->assertSame(['plomberie', 'electricite', 'climatisation', 'serrurerie', 'menuiserie', 'pressing'], collect($reponse->json('data.secteurs'))->pluck('cle')->all());
        $plomberie = $reponse->json('data.secteurs.0');
        $this->assertSame('droplets', $plomberie['icone']);
        $this->assertSame(Demande::where('secteur', 'plomberie')->count(), $plomberie['chiffres']['demandes']);
        $this->assertSame(Demande::where('secteur', 'plomberie')->whereIn('statut', ['terminee', 'confirmee'])->count(), $plomberie['chiffres']['reussies']);
        $this->assertGreaterThan(0, $plomberie['chiffres']['prestataires']);
        $this->assertNotEmpty($plomberie['prestations']);

        // Le client reçoit les mêmes secteurs, dans le même ordre, avec de quoi les dessiner.
        $this->getJson('/api/secteurs')->assertOk()
            ->assertJsonPath('data.0.cle', 'plomberie')
            ->assertJsonPath('data.0.icone', 'droplets')
            ->assertJsonPath('data.0.categorie', 'plombiers')
            ->assertJsonCount(6, 'data');
    }

    public function test_seul_l_administrateur_gere_les_secteurs(): void
    {
        $this->actingAs($this->client)->getJson('/api/admin/secteurs')->assertForbidden();
        // Le manager voit les secteurs et leurs chiffres, sans les modifier.
        $this->actingAs($this->manager)->getJson('/api/admin/secteurs')->assertOk();
        $this->actingAs($this->manager)->postJson('/api/admin/secteurs', ['nom' => 'Peinture', 'icone' => 'paint-roller'])->assertForbidden();
        $plomberie = Secteur::where('cle', 'plomberie')->firstOrFail();
        $this->actingAs($this->manager)->patchJson("/api/admin/secteurs/{$plomberie->id}", ['actif' => false])->assertForbidden();
    }

    public function test_creer_un_secteur_puis_l_ouvrir_aux_clients(): void
    {
        $cree = $this->actingAs($this->admin)->postJson('/api/admin/secteurs', [
            'nom' => 'Peinture',
            'metier' => 'Peintre',
            'description' => 'Murs, plafonds et façades.',
            'icone' => 'paint-roller',
            'couleur' => '#1F5FA8',
            'categories' => ['peintres'],
            'problemes' => ['Peindre une chambre', 'Façade abîmée'],
            'mots' => ['mur', 'plafond'],
        ])->assertCreated()
            ->assertJsonPath('data.cle', 'peinture')
            ->assertJsonPath('data.actif', false)
            ->assertJsonPath('data.ordre', 7);

        // Désactivé tant que l'administrateur ne l'ouvre pas : invisible pour le client.
        $this->assertNotContains('peinture', collect($this->getJson('/api/secteurs')->json('data'))->pluck('cle'));
        $this->assertSame([], $this->getJson('/api/analyse?q=je cherche un peintre')->json('secteurs'));

        $this->actingAs($this->admin)->patchJson("/api/admin/secteurs/{$cree->json('data.id')}", ['actif' => true])->assertOk();

        $peinture = collect($this->getJson('/api/secteurs')->json('data'))->firstWhere('cle', 'peinture');
        $this->assertSame(['nom' => 'Peinture', 'metier' => 'Peintre', 'icone' => 'paint-roller', 'couleur' => '#1F5FA8', 'categorie' => 'peintres'],
            array_intersect_key($peinture, array_flip(['nom', 'metier', 'icone', 'couleur', 'categorie'])));
        // La recherche le comprend : par le métier, ou par un mot ajouté.
        $this->getJson('/api/analyse?q=je cherche un peintre')->assertJsonPath('secteurs.0.cle', 'peinture');
        $this->getJson('/api/analyse?q=repeindre le plafond')->assertJsonPath('secteurs.0.cle', 'peinture');
        $this->assertTrue(Categorie::query()->ouvertes()->where('slug', 'peintres')->exists());
    }

    public function test_un_secteur_sans_categorie_choisie_a_la_sienne_dans_l_annuaire(): void
    {
        $cree = $this->actingAs($this->admin)->postJson('/api/admin/secteurs', ['nom' => 'Électroménager', 'metier' => 'Réparateur électroménager', 'icone' => 'washing-machine'])
            ->assertCreated()->assertJsonPath('data.cle', 'electromenager');

        $this->assertTrue(Categorie::where('slug', $cree->json('data.categories.0'))->exists());
    }

    public function test_desactiver_un_secteur_le_retire_de_l_application_sans_le_supprimer(): void
    {
        $plomberie = Secteur::where('cle', 'plomberie')->firstOrFail();
        $this->actingAs($this->admin)->patchJson("/api/admin/secteurs/{$plomberie->id}", ['actif' => false])->assertOk();

        $this->assertNotContains('plomberie', collect($this->getJson('/api/secteurs')->json('data'))->pluck('cle'));
        $this->assertSame([], $this->getJson('/api/analyse?q=fuite sous l evier')->json('secteurs'));
        $this->assertFalse(Categorie::query()->ouvertes()->where('slug', 'plombiers')->exists());
        // Les anciennes demandes gardent le nom du secteur.
        $this->assertSame('Plomberie', Secteur::nomDe('plomberie'));
        $this->assertDatabaseHas('secteurs', ['cle' => 'plomberie', 'actif' => false]);
    }

    public function test_modifier_et_classer_les_secteurs(): void
    {
        $pressing = Secteur::where('cle', 'pressing')->firstOrFail();
        $this->actingAs($this->admin)->patchJson("/api/admin/secteurs/{$pressing->id}", [
            'nom' => 'Pressing et repassage', 'description' => 'Lavage, repassage, nettoyage à sec.', 'icone' => 'sparkles', 'couleur' => '#8E3B8A',
        ])->assertOk()->assertJsonPath('data.nom', 'Pressing et repassage');

        $this->actingAs($this->admin)->patchJson("/api/admin/secteurs/{$pressing->id}", ['icone' => 'licorne'])->assertStatus(422);
        $this->actingAs($this->admin)->patchJson("/api/admin/secteurs/{$pressing->id}", ['nom' => 'Plomberie'])->assertStatus(422);

        // Le pressing passe en tête de l'accueil.
        $ordre = Secteur::query()->classes()->pluck('id')->all();
        $nouvel = [$pressing->id, ...array_values(array_diff($ordre, [$pressing->id]))];
        $this->actingAs($this->admin)->putJson('/api/admin/secteurs/ordre', ['ordre' => $nouvel])->assertOk();

        $this->getJson('/api/secteurs')->assertJsonPath('data.0.cle', 'pressing')->assertJsonPath('data.0.nom', 'Pressing et repassage')->assertJsonPath('data.0.icone', 'sparkles');
    }

    public function test_les_sous_services_d_un_secteur(): void
    {
        $serrurerie = Secteur::where('cle', 'serrurerie')->firstOrFail();
        $ajout = $this->actingAs($this->admin)->postJson("/api/admin/secteurs/{$serrurerie->id}/prestations", [
            'nom' => 'Ouverture de coffre-fort', 'prix_min' => 15000, 'prix_max' => 40000,
        ])->assertCreated()->assertJsonPath('data.prix_affichage', '15 000 – 40 000 F');
        $this->actingAs($this->admin)->postJson("/api/admin/secteurs/{$serrurerie->id}/prestations", ['nom' => 'Ouverture de coffre-fort'])->assertStatus(422);

        $this->assertDatabaseHas('prestations', ['secteur' => 'serrurerie', 'nom' => 'Ouverture de coffre-fort', 'actif' => true]);

        // Désactivé : il ne s'affiche plus dans le tableau des prix client.
        $this->actingAs($this->admin)->patchJson("/api/admin/sous-services/{$ajout->json('data.id')}", ['actif' => false, 'nom' => 'Coffre-fort'])
            ->assertOk()->assertJsonPath('data.actif', false)->assertJsonPath('data.nom', 'Coffre-fort');
        $this->assertFalse(Prestation::where('secteur', 'serrurerie')->where('actif', true)->where('nom', 'Coffre-fort')->exists());
    }
}
