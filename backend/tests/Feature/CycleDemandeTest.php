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

/** Cycle de vie d'une demande : le technicien répond, intervient, le client confirme ou annule. */
class CycleDemandeTest extends TestCase
{
    use RefreshDatabase;

    private User $client;

    private User $technicien;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
        $this->client = User::where('telephone', '+2250758421903')->firstOrFail();
        $this->technicien = User::where('telephone', '+2250707070707')->firstOrFail();
    }

    private function nouvelleDemande(): Demande
    {
        $this->actingAs($this->client)->postJson('/api/demandes', [
            'secteur' => 'plomberie',
            'probleme' => 'Fuite d\'eau',
            'quartier_id' => Quartier::where('slug', 'habitat')->value('id'),
            'quand' => 'maintenant',
            'mode' => 'recommande',
            'prestataire_id' => Prestataire::where('nom', 'Koffi Tanoh')->value('id'),
            'paiement' => 'especes',
        ])->assertCreated();

        return Demande::latest('id')->firstOrFail();
    }

    public function test_parcours_complet_du_technicien_au_client(): void
    {
        $demande = $this->nouvelleDemande();

        // Le technicien la voit, sans le numéro du client tant qu'il n'a pas accepté.
        $this->actingAs($this->technicien)->getJson('/api/pro/demandes?statut=envoyee')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.client.nom', 'Aya K.')
            ->assertJsonPath('data.0.client.telephone', null);

        $this->actingAs($this->technicien)->postJson("/api/pro/demandes/{$demande->id}/accepter", [
            'message' => 'Je passe dans 30 minutes.',
            'estimation' => 15000,
            'creneau' => 'Aujourd\'hui, 15 h',
        ])->assertOk()
            ->assertJsonPath('data.statut', 'acceptee')
            ->assertJsonPath('data.client.telephone', '07 58 42 19 03');

        $this->actingAs($this->technicien)->postJson("/api/pro/demandes/{$demande->id}/demarrer")->assertOk()->assertJsonPath('data.statut', 'en_cours');
        $this->actingAs($this->technicien)->postJson("/api/pro/demandes/{$demande->id}/terminer")->assertOk()->assertJsonPath('data.statut', 'terminee');

        // Le client suit chaque étape, puis confirme la fin.
        $this->actingAs($this->client)->getJson('/api/demandes')
            ->assertOk()
            ->assertJsonPath('data.0.statut_libelle', 'Marquée terminée')
            ->assertJsonPath('data.0.estimation', 15000)
            ->assertJsonPath('data.0.creneau', 'Aujourd\'hui, 15 h');

        $this->actingAs($this->client)->postJson("/api/demandes/{$demande->id}/confirmer")
            ->assertOk()
            ->assertJsonPath('data.statut', 'confirmee')
            ->assertJsonCount(5, 'data.evenements')
            ->assertJsonPath('data.evenements.1.message', 'Je passe dans 30 minutes.');
    }

    public function test_refus_avec_motif_obligatoire(): void
    {
        $demande = $this->nouvelleDemande();

        $this->actingAs($this->technicien)->postJson("/api/pro/demandes/{$demande->id}/refuser")
            ->assertStatus(422)->assertJsonValidationErrors('motif');
        $this->actingAs($this->technicien)->postJson("/api/pro/demandes/{$demande->id}/refuser", ['motif' => 'Je suis à Abidjan cette semaine.'])
            ->assertOk()->assertJsonPath('data.statut', 'refusee');
    }

    public function test_une_transition_impossible_est_refusee_clairement(): void
    {
        $demande = $this->nouvelleDemande();

        $this->actingAs($this->client)->postJson("/api/demandes/{$demande->id}/confirmer")
            ->assertStatus(422)
            ->assertJsonPath('errors.statut.0', 'Cette demande attend encore la réponse du technicien.');

        $this->actingAs($this->client)->postJson("/api/demandes/{$demande->id}/annuler", ['motif' => 'Réparé par un voisin'])
            ->assertOk()->assertJsonPath('data.statut', 'annulee');

        $this->actingAs($this->technicien)->postJson("/api/pro/demandes/{$demande->id}/accepter")
            ->assertStatus(422)
            ->assertJsonPath('errors.statut.0', 'Cette demande a été annulée.');
    }

    public function test_le_compte_de_demonstration_a_une_demande_a_chaque_etape(): void
    {
        $statuts = $this->actingAs($this->client)->getJson('/api/demandes')->assertOk()->json('data.*.statut');

        $this->assertEqualsCanonicalizing(['terminee', 'acceptee', 'confirmee', 'envoyee', 'annulee'], $statuts);
        $this->actingAs($this->technicien)->getJson('/api/pro/demandes?statut=terminee')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_chacun_ne_voit_que_ses_demandes(): void
    {
        $demande = $this->nouvelleDemande();
        $autreClient = User::where('telephone', '+2250102030405')->firstOrFail();

        $this->actingAs($autreClient)->getJson("/api/demandes/{$demande->id}")->assertNotFound();
        $this->actingAs($autreClient)->getJson('/api/demandes')->assertOk()->assertJsonCount(0, 'data');

        // Un compte sans fiche de technicien n'a pas d'espace pro.
        $this->actingAs($autreClient)->getJson('/api/pro/demandes')->assertForbidden();

        // Un autre technicien ne voit pas la demande adressée à Koffi Tanoh.
        $autreTechnicien = User::factory()->create();
        Prestataire::where('nom', 'Ali Diomandé')->update(['user_id' => $autreTechnicien->id]);
        $this->assertNotContains($demande->id, $this->actingAs($autreTechnicien)->getJson('/api/pro/demandes')->assertOk()->json('data.*.id'));
        $this->actingAs($autreTechnicien)->postJson("/api/pro/demandes/{$demande->id}/accepter")->assertNotFound();
    }

    public function test_toute_demande_a_son_onglet_et_s_y_suit(): void
    {
        $demande = $this->nouvelleDemande();
        $accord = $demande->accord;

        // L'onglet existe dès l'envoi, en attente du technicien, avec le suivi de l'intervention.
        $this->assertNotNull($accord);
        $this->actingAs($this->client)->getJson("/api/accords/{$accord->id}")->assertOk()
            ->assertJsonPath('data.objet', 'Fuite d\'eau')
            ->assertJsonPath('data.statut_libelle', 'En attente du technicien')
            ->assertJsonPath('data.demande.commande', null)
            ->assertJsonPath('data.demande.suivi.0.fait', true)
            ->assertJsonPath('data.demande.suivi.1.libelle', 'Acceptée par le technicien')
            ->assertJsonPath('data.demande.suivi.1.fait', false)
            ->assertJsonPath('data.demande.motifs_signalement.1.nom', 'Le technicien n\'est pas venu');

        // L'estimation du technicien devient le montant de l'onglet ; le suivi avance.
        $this->actingAs($this->technicien)->postJson("/api/pro/demandes/{$demande->id}/accepter", ['estimation' => 15000])->assertOk();
        $this->actingAs($this->client)->getJson("/api/accords/{$accord->id}")
            ->assertJsonPath('data.montant', 15000)
            ->assertJsonPath('data.statut_libelle', 'Acceptée')
            ->assertJsonPath('data.demande.suivi.1.fait', true);

        // Signalement avec les motifs d'une intervention.
        $this->actingAs($this->client)->postJson("/api/demandes/{$demande->id}/signalements", ['motif' => 'absent'])
            ->assertCreated()->assertJsonPath('data.signalements.0.motif_libelle', 'Le technicien n\'est pas venu');
        $this->actingAs($this->client)->postJson("/api/demandes/{$demande->id}/signalements", ['motif' => 'manquant'])->assertStatus(422);

        $this->actingAs($this->technicien)->postJson("/api/pro/demandes/{$demande->id}/terminer")->assertOk();
        $this->actingAs($this->client)->postJson("/api/demandes/{$demande->id}/confirmer")->assertOk();
        $this->assertSame('termine', $accord->refresh()->statut);
        $this->assertSame(1, $demande->accord()->count());
    }

    public function test_les_demandes_de_demonstration_ont_leur_onglet(): void
    {
        $sans = Demande::whereNotNull('prestataire_id')->whereDoesntHave('accord')->count();
        $this->assertSame(0, $sans);
        $this->assertSame('annule', Demande::where('statut', 'annulee')->firstOrFail()->accord->statut);
    }

    public function test_un_depannage_confirme_quitte_les_onglets_pour_l_historique(): void
    {
        $demande = $this->nouvelleDemande();
        $id = $demande->accord->id;
        $onglets = fn () => $this->actingAs($this->client)->getJson('/api/accords?etat=onglets')->assertOk()->json('data.*.id');
        $historique = fn () => $this->actingAs($this->client)->getJson('/api/accords?etat=historique')->assertOk()->json('data.*.id');

        $this->assertContains($id, $onglets());
        $this->assertNotContains($id, $historique());

        // Terminé par le technicien : il reste dans les onglets tant que le client n'a pas confirmé.
        $this->actingAs($this->technicien)->postJson("/api/pro/demandes/{$demande->id}/accepter")->assertOk();
        $this->actingAs($this->technicien)->postJson("/api/pro/demandes/{$demande->id}/terminer")->assertOk();
        $this->assertContains($id, $onglets());

        $this->actingAs($this->client)->postJson("/api/demandes/{$demande->id}/confirmer")->assertOk();
        $this->assertNotContains($id, $onglets());
        $this->assertSame($id, $historique()[0]);
        $this->actingAs($this->client)->getJson("/api/accords/{$id}")->assertJsonPath('data.accompli', true);

        // Le dépannage de démonstration déjà confirmé (climatisation) est aussi dans l'historique.
        $clim = Demande::where('statut', 'confirmee')->where('user_id', $this->client->id)->firstOrFail()->accord->id;
        $this->assertContains($clim, $historique());
        $this->actingAs($this->client)->getJson('/api/accords?etat=autre')->assertStatus(422);
    }
}
