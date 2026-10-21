<?php

namespace Tests\Feature;

use App\Models\Demande;
use App\Models\Prestataire;
use App\Models\Quartier;
use App\Models\User;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** Lot 1 du parcours client : assistant de besoin, recommandations, envoi de la demande. */
class DemandeTest extends TestCase
{
    use RefreshDatabase;

    private int $habitat;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
        $this->habitat = Quartier::where('slug', 'habitat')->value('id');
    }

    private function demande(array $champs = []): array
    {
        return [
            'secteur' => 'plomberie',
            'probleme' => 'Fuite d\'eau',
            'quartier_id' => $this->habitat,
            'repere' => 'Derrière la pharmacie du marché',
            'quand' => 'maintenant',
            'mode' => 'recommande',
            'prestataire_id' => Prestataire::where('nom', 'Koffi Tanoh')->value('id'),
            'paiement' => 'especes',
            ...$champs,
        ];
    }

    public function test_un_pack_pressing_est_recalcule_par_le_serveur(): void
    {
        $this->getJson('/api/pressing/articles')->assertOk()->assertJsonPath('data.0.nom', 'Chemise');
        $pressing = Prestataire::where('nom', 'Pressing Éclat')->value('id');
        $client = User::factory()->create();

        $this->actingAs($client)->postJson('/api/demandes', $this->demande([
            'secteur' => 'pressing',
            'probleme' => 'Pack pressing',
            'prestataire_id' => $pressing,
            'mode' => 'choisi',
            // Les prix envoyés par le client sont ignorés ; un article cité deux fois est regroupé.
            'articles' => [
                ['cle' => 'chemise', 'quantite' => 4, 'prix_unitaire' => 1],
                ['cle' => 'costume', 'quantite' => 1],
                ['cle' => 'chemise', 'quantite' => 1],
            ],
        ]))->assertCreated()
            ->assertJsonPath('data.pack.pieces', 6)
            ->assertJsonPath('data.pack.total', 5 * 500 + 3000)
            ->assertJsonPath('data.pack.total_affichage', '5 500 F')
            ->assertJsonPath('data.pack.articles.0.prix_unitaire', 500);

        $this->actingAs($client)->postJson('/api/demandes', $this->demande([
            'secteur' => 'pressing', 'probleme' => 'Pack pressing', 'prestataire_id' => $pressing, 'mode' => 'choisi',
        ]))->assertStatus(422)->assertJsonValidationErrors('articles');
    }

    public function test_les_services_et_leurs_problemes_types(): void
    {
        $reponse = $this->getJson('/api/secteurs')->assertOk()->assertJsonCount(6, 'data');

        $plomberie = collect($reponse->json('data'))->firstWhere('cle', 'plomberie');
        $this->assertSame('Plomberie', $plomberie['nom']);
        $this->assertContains('Fuite d\'eau', $plomberie['problemes']);
    }

    public function test_la_recherche_mene_au_service_et_au_probleme(): void
    {
        $this->getJson('/api/analyse?'.http_build_query(['q' => 'grosse fuite d\'eau dans la cuisine']))
            ->assertJsonPath('secteurs.0.cle', 'plomberie')
            ->assertJsonPath('probleme', 'Fuite d\'eau');

        $this->getJson('/api/analyse?'.http_build_query(['q' => 'ma clim ne refroidit pas']))
            ->assertJsonPath('secteurs.0.cle', 'climatisation')
            ->assertJsonPath('probleme', 'Clim ne refroidit pas');

        // Deux services possibles : l'assistant demandera lequel, sans présumer du problème.
        $this->getJson('/api/analyse?q=porte')->assertJsonCount(2, 'secteurs')->assertJsonPath('probleme', null);
    }

    public function test_les_recommandations_privilegient_le_quartier(): void
    {
        $noms = $this->getJson("/api/recommandations?secteur=plomberie&quartier={$this->habitat}")
            ->assertOk()->json('data.*.nom');

        $this->assertSame(['Koffi Tanoh', 'Ali Diomandé'], $noms);
    }

    public function test_demander_d_autres_techniciens_ecarte_ceux_deja_proposes(): void
    {
        $koffi = Prestataire::where('nom', 'Koffi Tanoh')->value('id');

        $this->assertSame(
            ['Ali Diomandé'],
            $this->getJson("/api/recommandations?secteur=plomberie&exclure[]={$koffi}")->json('data.*.nom'),
        );
    }

    public function test_l_envoi_demande_un_compte(): void
    {
        $this->postJson('/api/demandes', $this->demande())->assertUnauthorized();
    }

    public function test_une_demande_complete_est_enregistree_avec_ses_photos(): void
    {
        Storage::fake('public');
        $client = User::factory()->create();

        $reponse = $this->actingAs($client)->post('/api/demandes', $this->demande([
            'photos' => [UploadedFile::fake()->create('fuite.jpg', 300, 'image/jpeg')],
        ]), ['Accept' => 'application/json']);

        $reponse->assertCreated()
            ->assertJsonPath('data.resume', 'Plomberie · Fuite d\'eau · Habitat · Maintenant')
            ->assertJsonPath('data.prestataire.nom', 'Koffi Tanoh')
            ->assertJsonPath('data.statut', 'envoyee')
            ->assertJsonPath('message', 'Votre demande est envoyée. Vous recevrez une réponse dans environ 10 minutes.');

        $demande = Demande::whereBelongsTo($client, 'client')->firstOrFail();
        $this->assertMatchesRegularExpression('/^DEM-\d{4}-\d{5}$/', $demande->reference);
        $this->assertCount(1, $demande->photos);
        Storage::disk('public')->assertExists($demande->photos[0]);
    }

    public function test_les_regles_de_l_assistant_sont_verifiees(): void
    {
        $client = User::factory()->create();
        $envoyer = fn (array $champs) => $this->actingAs($client)->postJson('/api/demandes', $this->demande($champs));

        $envoyer(['probleme' => 'Autre'])->assertJsonValidationErrors(['precision' => 'Décrivez votre problème en quelques mots.']);
        $envoyer(['quand' => 'date'])->assertJsonValidationErrors(['date_souhaitee' => 'Choisissez une date.']);
        $envoyer(['quand' => 'date', 'date_souhaitee' => '2020-01-01'])->assertJsonValidationErrors('date_souhaitee');
        $envoyer(['probleme' => 'WC bouché', 'secteur' => 'electricite'])->assertJsonValidationErrors('probleme');
        $envoyer(['secteur' => 'mecanique'])->assertJsonValidationErrors('secteur');

        // Un serrurier ne peut pas recevoir une demande de plomberie.
        $serrurier = Prestataire::where('nom', 'Serrurerie N\'Guessan')->value('id');
        $envoyer(['prestataire_id' => $serrurier])->assertJsonValidationErrors(['prestataire_id' => 'Ce technicien ne propose pas ce service.']);
    }

    public function test_seul_l_auteur_voit_sa_demande(): void
    {
        $client = User::factory()->create();
        $id = $this->actingAs($client)->postJson('/api/demandes', $this->demande())->json('data.id');

        $this->actingAs($client)->getJson("/api/demandes/{$id}")->assertOk()->assertJsonPath('data.probleme', 'Fuite d\'eau');
        $this->actingAs(User::factory()->create())->getJson("/api/demandes/{$id}")->assertNotFound();
    }
}
