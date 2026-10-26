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
use Tests\TestCase;

/**
 * Commande au pressing : le client compose et valide sa commande, le gérant la fait avancer
 * étape par étape, le client la suit dans ses onglets, reçoit les notifications, signale un
 * problème. Adresses enregistrées.
 */
class CommandePressingTest extends TestCase
{
    use RefreshDatabase;

    private User $client;

    private User $gerant;

    private int $habitat;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
        $this->client = User::where('telephone', '+2250758421903')->firstOrFail();
        $this->gerant = User::where('telephone', '+2250708080808')->firstOrFail();
        $this->habitat = Quartier::where('slug', 'habitat')->value('id');
    }

    private function commande(array $champs = []): array
    {
        return [
            'secteur' => 'pressing',
            'probleme' => 'Pack pressing',
            'precision' => 'Pas d\'amidon sur les chemises.',
            'quartier_id' => $this->habitat,
            'repere' => 'Portail bleu',
            'adresse_libelle' => 'Domicile',
            'quand' => 'date',
            'date_souhaitee' => now()->addDay()->toDateString(),
            'heure' => '10:00',
            'mode' => 'choisi',
            'prestataire_id' => Prestataire::where('nom', 'Pressing Éclat')->value('id'),
            'paiement' => 'mobile_money',
            'service' => 'nettoyage_sec',
            'express' => true,
            'depot' => 'collecte',
            'articles' => [['cle' => 'chemise', 'quantite' => 2], ['cle' => 'costume', 'quantite' => 1]],
            ...$champs,
        ];
    }

    public function test_les_options_de_commande_sont_publiques(): void
    {
        $this->getJson('/api/pressing/options')->assertOk()
            ->assertJsonPath('data.services.0.cle', 'lavage')
            ->assertJsonPath('data.depots.0.cle', 'collecte')
            ->assertJsonPath('data.express.majoration', 50)
            ->assertJsonPath('data.motifs.1.nom', 'Vêtement manquant');
    }

    public function test_le_prix_suit_le_service_et_l_express(): void
    {
        // Chemise 500 F × 150 % (nettoyage à sec) × 150 % (express) = 1 125 F ; costume 3 000 → 6 750 F.
        $reponse = $this->actingAs($this->client)->postJson('/api/demandes', $this->commande())->assertCreated()
            ->assertJsonPath('data.pack.articles.0.prix_unitaire', 1125)
            ->assertJsonPath('data.pack.total', 2 * 1125 + 6750)
            ->assertJsonPath('data.commande.service.nom', 'Nettoyage à sec')
            ->assertJsonPath('data.commande.express', true)
            ->assertJsonPath('data.commande.depot.cle', 'collecte')
            ->assertJsonPath('data.commande.heure', '10:00')
            ->assertJsonPath('data.commande.adresse', 'Domicile')
            ->assertJsonPath('data.paiement_libelle', 'Mobile Money');

        // La commande validée rejoint aussitôt les onglets.
        $this->assertNotNull($reponse->json('data.accord_id'));
        $this->actingAs($this->client)->getJson('/api/accords/'.$reponse->json('data.accord_id'))->assertOk()
            ->assertJsonPath('data.montant', 9000)
            ->assertJsonPath('data.statut_libelle', 'En attente du pressing')
            ->assertJsonPath('data.demande.commande.suivi.0.fait', true)
            ->assertJsonPath('data.demande.commande.suivi.1.fait', false);
    }

    public function test_service_depot_et_heure_sont_demandes(): void
    {
        $this->actingAs($this->client)->postJson('/api/demandes', $this->commande(['service' => null, 'depot' => null, 'heure' => '03:00']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['service', 'depot', 'heure']);
    }

    public function test_au_depot_le_client_ne_donne_pas_d_adresse(): void
    {
        $pressing = Prestataire::where('nom', 'Pressing Éclat')->firstOrFail();
        $commande = $this->commande(['depot' => 'pressing']);
        unset($commande['quartier_id'], $commande['repere'], $commande['adresse_libelle']);

        $id = $this->actingAs($this->client)->postJson('/api/demandes', $commande)->assertCreated()
            ->assertJsonPath('data.commande.depot.cle', 'pressing')
            ->json('data.id');

        // La demande prend le quartier du pressing.
        $this->assertSame($pressing->quartier_id, Demande::findOrFail($id)->quartier_id);
    }

    public function test_la_collecte_demande_toujours_l_adresse(): void
    {
        $commande = $this->commande();
        unset($commande['quartier_id']);

        $this->actingAs($this->client)->postJson('/api/demandes', $commande)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['quartier_id']);
    }

    public function test_le_gerant_fait_avancer_la_commande_et_le_client_est_notifie(): void
    {
        $id = $this->actingAs($this->client)->postJson('/api/demandes', $this->commande())->json('data.id');

        // Pas d'étape avant d'avoir accepté.
        $this->actingAs($this->gerant)->postJson("/api/pro/demandes/{$id}/etape")->assertStatus(422);
        $this->actingAs($this->gerant)->postJson("/api/pro/demandes/{$id}/accepter")->assertOk()
            ->assertJsonPath('data.commande.etape_suivante.libelle', 'Agent en route');

        foreach (['agent_en_route', 'collectee', 'recue', 'en_traitement', 'prete', 'en_livraison'] as $etape) {
            $this->actingAs($this->gerant)->postJson("/api/pro/demandes/{$id}/etape")->assertOk()
                ->assertJsonPath('data.commande.etape', $etape)
                ->assertJsonPath('data.statut', 'en_cours');
        }
        $this->actingAs($this->gerant)->postJson("/api/pro/demandes/{$id}/etape")->assertOk()
            ->assertJsonPath('data.commande.etape', 'livree')
            ->assertJsonPath('data.statut', 'terminee')
            ->assertJsonPath('data.commande.etape_suivante', null);
        $this->actingAs($this->gerant)->postJson("/api/pro/demandes/{$id}/etape")->assertStatus(422);

        $notifications = collect($this->actingAs($this->client)->getJson('/api/notifications')->assertOk()->json('data'));
        $this->assertSame('Commande livrée', $notifications->first()['titre']);
        $this->assertEqualsCanonicalizing(
            ['Commande confirmée', 'Agent en route', 'Linge prêt', 'Livraison en cours'],
            $notifications->pluck('titre')->intersect(['Commande confirmée', 'Agent en route', 'Linge prêt', 'Livraison en cours'])->values()->all(),
        );

        // L'onglet est terminé ; le client confirme la livraison.
        $accord = Demande::findOrFail($id)->accord;
        $this->assertSame('termine', $accord->statut);
        $this->actingAs($this->client)->postJson("/api/demandes/{$id}/confirmer")->assertOk();
    }

    public function test_depot_au_pressing_sans_collecte(): void
    {
        $id = $this->actingAs($this->client)->postJson('/api/demandes', $this->commande(['depot' => 'pressing']))->json('data.id');
        $this->actingAs($this->gerant)->postJson("/api/pro/demandes/{$id}/accepter");

        $this->actingAs($this->gerant)->postJson("/api/pro/demandes/{$id}/etape")->assertOk()->assertJsonPath('data.commande.etape', 'recue');
        $this->actingAs($this->client)->getJson("/api/demandes/{$id}")
            ->assertJsonPath('data.commande.suivi.5.libelle', 'Récupérée')
            ->assertJsonPath('data.commande.suivi.2.fait', true);
    }

    public function test_le_client_signale_un_probleme(): void
    {
        $id = $this->actingAs($this->client)->postJson('/api/demandes', $this->commande())->json('data.id');

        $this->actingAs($this->client)->postJson("/api/demandes/{$id}/signalements", ['motif' => 'manquant', 'message' => 'Une chemise blanche manque.'])
            ->assertCreated()
            ->assertJsonPath('data.commande.signalements.0.motif_libelle', 'Vêtement manquant');
        $this->actingAs($this->client)->postJson("/api/demandes/{$id}/signalements", ['motif' => 'autre'])
            ->assertStatus(422)->assertJsonValidationErrors('message');

        // Le gérant voit le signalement ; un autre client ne peut rien signaler.
        $this->actingAs($this->gerant)->getJson("/api/pro/demandes/{$id}")->assertJsonCount(1, 'data.commande.signalements');
        $this->actingAs(User::factory()->create())->postJson("/api/demandes/{$id}/signalements", ['motif' => 'retard'])->assertNotFound();
    }

    public function test_un_refus_annule_l_onglet(): void
    {
        $id = $this->actingAs($this->client)->postJson('/api/demandes', $this->commande())->json('data.id');
        $this->actingAs($this->gerant)->postJson("/api/pro/demandes/{$id}/refuser", ['motif' => 'Machines en panne.'])->assertOk();

        $this->assertSame('annule', Demande::findOrFail($id)->accord->statut);
    }

    public function test_adresses_enregistrees(): void
    {
        $this->actingAs($this->client)->postJson('/api/moi/adresses', ['type' => 'domicile', 'quartier_id' => $this->habitat, 'repere' => 'Portail bleu'])
            ->assertCreated()->assertJsonPath('data.nom', 'Domicile')->assertJsonPath('data.quartier.nom', 'Habitat');
        $this->actingAs($this->client)->postJson('/api/moi/adresses', ['type' => 'autre', 'quartier_id' => $this->habitat])
            ->assertStatus(422)->assertJsonValidationErrors('nom');
        $id = $this->actingAs($this->client)->postJson('/api/moi/adresses', ['type' => 'autre', 'nom' => 'Chez maman', 'quartier_id' => $this->habitat])->json('data.id');

        $this->actingAs($this->client)->getJson('/api/moi/adresses')->assertOk()->assertJsonCount(2, 'data');
        $this->actingAs(User::factory()->create())->deleteJson("/api/moi/adresses/{$id}")->assertNotFound();
        $this->actingAs($this->client)->deleteJson("/api/moi/adresses/{$id}")->assertNoContent();
        $this->actingAs($this->client)->getJson('/api/moi/adresses')->assertJsonCount(1, 'data');
    }
}
