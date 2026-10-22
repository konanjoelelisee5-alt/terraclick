<?php

namespace Tests\Feature;

use App\Models\Prestataire;
use App\Models\Quartier;
use App\Models\User;
use App\Models\Ville;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Zones et quartiers : ajouter un quartier, l'activer ou le désactiver, choisir ses services et
 * ses frais de déplacement, relier les prestataires à leurs zones, voir les zones mal couvertes.
 */
class AdminZoneTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $manager;

    private User $client;

    private Quartier $habitat;

    private Prestataire $koffi;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
        $this->admin = User::where('telephone', '+2250701010101')->firstOrFail();
        $this->manager = User::where('telephone', '+2250702020202')->firstOrFail();
        $this->client = User::where('telephone', '+2250758421903')->firstOrFail();
        $this->habitat = Quartier::where('slug', 'habitat')->firstOrFail();
        $this->koffi = Prestataire::where('nom', 'Koffi Tanoh')->firstOrFail();
    }

    private function demande(array $champs = []): array
    {
        return [
            'secteur' => 'plomberie',
            'probleme' => 'Fuite d\'eau',
            'quartier_id' => $this->habitat->id,
            'quand' => 'maintenant',
            'mode' => 'choisi',
            'prestataire_id' => $this->koffi->id,
            'paiement' => 'especes',
            ...$champs,
        ];
    }

    /** @return array<string, mixed> */
    private function quartier(string $nom): array
    {
        $zones = $this->actingAs($this->admin)->getJson('/api/admin/zones')->assertOk()->json('data');

        return collect($zones['villes'])->flatMap(fn (array $v) => $v['quartiers'])->firstWhere('nom', $nom);
    }

    public function test_la_couverture_de_chaque_quartier_et_les_trous(): void
    {
        $habitat = $this->quartier('Habitat');
        $plomberie = collect($habitat['couverture'])->firstWhere('cle', 'plomberie');
        $this->assertGreaterThanOrEqual(1, $plomberie['prestataires']);
        $this->assertNotContains('Plombier', $habitat['manques']);

        // Un quartier neuf n'a encore personne : tous les métiers y manquent.
        $yakro = Ville::where('slug', 'yamoussoukro')->value('id');
        $this->actingAs($this->admin)->postJson('/api/admin/zones', ['ville_id' => $yakro, 'nom' => 'Kossou'])->assertCreated();
        $this->assertContains('Plombier', $this->quartier('Kossou')['manques']);

        $this->actingAs($this->manager)->getJson('/api/admin/zones')->assertOk();
        $this->actingAs($this->manager)->postJson('/api/admin/zones', ['ville_id' => $yakro, 'nom' => 'Subiakro'])->assertForbidden();
        $this->actingAs($this->client)->getJson('/api/admin/zones')->assertForbidden();
    }

    public function test_ajouter_un_quartier_de_yamoussoukro(): void
    {
        $yakro = Ville::where('slug', 'yamoussoukro')->value('id');
        $this->actingAs($this->admin)->postJson('/api/admin/zones', ['ville_id' => $yakro, 'nom' => 'Kossou', 'frais_deplacement' => 1000])->assertCreated();
        $this->actingAs($this->admin)->postJson('/api/admin/zones', ['ville_id' => $yakro, 'nom' => 'kossou'])->assertStatus(422);

        $quartiers = collect($this->getJson('/api/villes')->json('data'))->firstWhere('slug', 'yamoussoukro')['quartiers'];
        $this->assertSame(1000, collect($quartiers)->firstWhere('nom', 'Kossou')['frais_deplacement']);
    }

    public function test_desactiver_un_quartier(): void
    {
        $this->actingAs($this->admin)->patchJson("/api/admin/zones/{$this->habitat->id}", ['actif' => false])->assertOk();

        $quartiers = collect($this->getJson('/api/villes')->json('data'))->firstWhere('slug', 'yamoussoukro')['quartiers'];
        $this->assertNotContains('Habitat', collect($quartiers)->pluck('nom'));
        $this->actingAs($this->client)->postJson('/api/demandes', $this->demande())->assertStatus(422)
            ->assertJsonPath('errors.quartier_id.0', 'TerraClick n\'intervient pas encore dans ce quartier.');
        // Désactivé, il ne compte plus parmi les trous.
        $this->assertSame([], $this->quartier('Habitat')['manques']);
    }

    public function test_les_services_disponibles_dans_un_quartier(): void
    {
        $this->actingAs($this->admin)->patchJson("/api/admin/zones/{$this->habitat->id}", ['secteurs' => ['pressing', 'electricite']])->assertOk();

        $this->actingAs($this->client)->postJson('/api/demandes', $this->demande())->assertStatus(422)
            ->assertJsonPath('errors.quartier_id.0', 'Ce service n\'est pas encore proposé dans ce quartier.');
        $this->assertFalse(collect($this->quartier('Habitat')['couverture'])->firstWhere('cle', 'plomberie')['propose']);

        // De nouveau tous les services.
        $this->actingAs($this->admin)->patchJson("/api/admin/zones/{$this->habitat->id}", ['secteurs' => null])->assertOk();
        $this->actingAs($this->client)->postJson('/api/demandes', $this->demande())->assertCreated();
        $this->actingAs($this->admin)->patchJson("/api/admin/zones/{$this->habitat->id}", ['secteurs' => ['jardinage']])->assertStatus(422);
    }

    public function test_les_frais_de_deplacement_suivent_la_demande(): void
    {
        $this->actingAs($this->admin)->patchJson("/api/admin/zones/{$this->habitat->id}", ['frais_deplacement' => 1500])->assertOk();

        $this->actingAs($this->client)->postJson('/api/demandes', $this->demande())->assertCreated()->assertJsonPath('data.frais_deplacement', 1500);

        // Changés ensuite, ils ne touchent pas une demande déjà envoyée.
        $this->actingAs($this->admin)->patchJson("/api/admin/zones/{$this->habitat->id}", ['frais_deplacement' => null])->assertOk();
        $this->assertSame(1500, $this->koffi->demandes()->latest('id')->value('frais_deplacement'));
    }

    public function test_les_zones_d_intervention_d_un_prestataire(): void
    {
        $kokrenou = Quartier::where('slug', 'kokrenou')->firstOrFail();
        $this->assertFalse(collect($this->getJson("/api/prestataires?quartier={$kokrenou->id}")->json('data'))->contains('nom', 'Koffi Tanoh'));

        $this->actingAs($this->manager)->putJson("/api/admin/prestataires/{$this->koffi->id}/zones", ['quartiers' => [$kokrenou->id, $this->habitat->id]])
            ->assertOk()->assertJsonCount(2, 'data');

        // Il apparaît désormais dans les résultats de Kokrenou, et dans son dossier.
        $this->assertTrue(collect($this->getJson("/api/prestataires?quartier={$kokrenou->id}")->json('data'))->contains('nom', 'Koffi Tanoh'));
        $this->actingAs($this->admin)->getJson("/api/admin/prestataires/{$this->koffi->id}")->assertJsonPath('data.zones.1.nom', 'Kokrenou');
        $this->actingAs($this->client)->putJson("/api/admin/prestataires/{$this->koffi->id}/zones", ['quartiers' => []])->assertForbidden();
    }
}
