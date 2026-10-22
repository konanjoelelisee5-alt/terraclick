<?php

namespace Tests\Feature;

use App\Models\Accord;
use App\Models\Commission;
use App\Models\Demande;
use App\Models\Prestataire;
use App\Models\Prestation;
use App\Models\Quartier;
use App\Models\Reglage;
use App\Models\Secteur;
use App\Models\User;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Database\Seeders\PrestationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Finances (commissions, paiements, moyens de paiement, négociation, exports) et litiges
 * (déclarations des deux parties, preuves, décision finale et ses mesures, récidive).
 */
class FinancesLitigesTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $manager;

    private User $client;

    private Prestataire $koffi;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        Storage::fake('public');
        $this->seed([CatalogueSeeder::class, PrestationSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
        $this->admin = User::where('telephone', '+2250701010101')->firstOrFail();
        $this->manager = User::where('telephone', '+2250702020202')->firstOrFail();
        $this->client = User::where('telephone', '+2250758421903')->firstOrFail();
        $this->koffi = Prestataire::where('nom', 'Koffi Tanoh')->firstOrFail();
    }

    private function demande(array $champs = []): Demande
    {
        $demande = Demande::create([
            'user_id' => $this->client->id,
            'secteur' => 'plomberie',
            'probleme' => 'Fuite d\'eau',
            'quartier_id' => Quartier::where('slug', 'habitat')->value('id'),
            'quand' => 'maintenant',
            'mode' => 'choisi',
            'paiement' => 'especes',
            'prestataire_id' => $this->koffi->id,
            'estimation' => 20000,
            ...$champs,
        ]);
        Accord::pourDemande($demande->refresh());

        return $demande;
    }

    public function test_une_commission_par_mission_accomplie_au_taux_du_secteur_sinon_global(): void
    {
        // Sans taux fixé, rien n'est dû.
        $d0 = $this->demande(['statut' => 'terminee']);
        $this->actingAs($this->client)->postJson("/api/demandes/{$d0->id}/confirmer")->assertOk();
        $this->assertSame(0, Commission::count());

        $this->actingAs($this->admin)->putJson('/api/admin/finances/reglages', ['commission_taux' => 10])->assertOk();
        $d1 = $this->demande(['statut' => 'terminee']);
        $this->actingAs($this->client)->postJson("/api/demandes/{$d1->id}/confirmer")->assertOk();
        $this->assertSame(2000, Commission::where('demande_id', $d1->id)->value('montant'));

        $this->actingAs($this->admin)->putJson('/api/admin/finances/secteurs', ['commissions' => ['plomberie' => 15]])->assertOk();
        $d2 = $this->demande(['statut' => 'terminee']);
        $this->actingAs($this->client)->postJson("/api/demandes/{$d2->id}/confirmer")->assertOk();
        $this->assertSame(3000, Commission::where('demande_id', $d2->id)->value('montant'));

        $this->actingAs($this->admin)->putJson('/api/admin/finances/reglages', ['commission_taux' => 80])->assertStatus(422);
    }

    public function test_suivre_les_soldes_enregistrer_un_paiement_et_exporter(): void
    {
        Reglage::ecrire('commission_taux', 10);
        foreach ([1, 2] as $i) {
            $d = $this->demande(['statut' => 'terminee']);
            $this->actingAs($this->client)->postJson("/api/demandes/{$d->id}/confirmer")->assertOk();
        }

        $finances = $this->actingAs($this->admin)->getJson('/api/admin/finances')->assertOk()->json('data');
        $koffi = collect($finances['prestataires'])->firstWhere('id', $this->koffi->id);
        $this->assertSame(4000, $koffi['solde']);
        $this->assertGreaterThanOrEqual(40000, $koffi['encaisse']);
        $this->assertSame(1, $finances['totaux']['impayes']);

        $this->actingAs($this->admin)->postJson('/api/admin/finances/paiements', ['prestataire_id' => $this->koffi->id, 'montant' => 4000, 'moyen' => 'mobile_money', 'reference' => 'WAVE-1234'])
            ->assertCreated()->assertJsonPath('data.solde', 0)->assertJsonPath('data.moyen_libelle', 'Mobile Money');
        $this->assertSame(0, $this->actingAs($this->admin)->getJson('/api/admin/finances')->json('data.totaux.impayes'));

        $csv = $this->actingAs($this->admin)->get('/api/admin/finances/export?rapport=paiements')->assertOk()->streamedContent();
        $this->assertStringContainsString('WAVE-1234', $csv);
        $this->assertStringContainsString('Date;Prestataire;"Montant (F)"', $csv);
        $this->actingAs($this->admin)->get('/api/admin/finances/export?rapport=missions')->assertOk();

        // Le manager ne voit pas les finances.
        $this->actingAs($this->manager)->getJson('/api/admin/finances')->assertForbidden();
    }

    public function test_les_moyens_de_paiement_proposes_aux_clients(): void
    {
        $this->assertSame(['especes', 'mobile_money', 'autre'], collect($this->getJson('/api/reglages')->json('data.paiements'))->pluck('valeur')->all());

        $this->actingAs($this->admin)->putJson('/api/admin/finances/reglages', ['paiements' => ['especes', 'virement']])->assertOk();
        $this->assertSame(['especes', 'virement'], collect($this->getJson('/api/reglages')->json('data.paiements'))->pluck('valeur')->all());

        $demande = ['secteur' => 'plomberie', 'probleme' => 'Fuite d\'eau', 'quartier_id' => Quartier::where('slug', 'habitat')->value('id'), 'quand' => 'maintenant', 'mode' => 'choisi', 'prestataire_id' => $this->koffi->id];
        $this->actingAs($this->client)->postJson('/api/demandes', [...$demande, 'paiement' => 'mobile_money'])->assertStatus(422);
        $this->actingAs($this->client)->postJson('/api/demandes', [...$demande, 'paiement' => 'virement'])->assertCreated()->assertJsonPath('data.paiement_libelle', 'Virement');
        $this->actingAs($this->admin)->putJson('/api/admin/finances/reglages', ['paiements' => []])->assertStatus(422);
    }

    public function test_negociation_directe_interdite_le_prix_reste_dans_la_grille(): void
    {
        $min = Prestation::where('secteur', 'plomberie')->where('actif', true)->min('prix_min');
        $max = Prestation::where('secteur', 'plomberie')->where('actif', true)->max('prix_max');
        $this->actingAs($this->admin)->putJson('/api/admin/finances/reglages', ['negociation_directe' => false])->assertOk();
        $this->assertFalse($this->getJson('/api/reglages')->json('data.negociation_directe'));

        $d = $this->demande(['estimation' => null]);
        $this->actingAs($this->koffi->utilisateur)->postJson("/api/pro/demandes/{$d->id}/accepter", ['estimation' => $max + 50000])->assertStatus(422)->assertJsonValidationErrors('estimation');
        $this->actingAs($this->koffi->utilisateur)->postJson("/api/pro/demandes/{$d->id}/accepter", ['estimation' => $min])->assertOk();
    }

    public function test_un_litige_les_deux_declarations_les_preuves_et_la_decision(): void
    {
        Reglage::ecrire('commission_taux', 10);
        Reglage::ecrire('seuil_recidive', 1);
        $d = $this->demande(['statut' => 'terminee']);
        $photo = UploadedFile::fake()->create('fuite.jpg', 200, 'image/jpeg');

        $this->actingAs($this->client)->post("/api/demandes/{$d->id}/signalements", ['motif' => 'non_termine', 'message' => 'Le robinet fuit encore.', 'photos' => [$photo]], ['Accept' => 'application/json'])->assertCreated();
        $this->actingAs($this->koffi->utilisateur)->post("/api/pro/demandes/{$d->id}/signaler", ['motif' => 'paiement', 'message' => 'Le client n\'a payé que la moitié.'], ['Accept' => 'application/json'])->assertOk();

        $litiges = collect($this->actingAs($this->manager)->getJson('/api/admin/litiges')->assertOk()->json('data'));
        $ligne = $litiges->firstWhere('id', $d->id);
        $this->assertEqualsCanonicalizing(['Prestation non terminée', 'Paiement non effectué'], collect($ligne['motifs'])->pluck('libelle')->all());
        $this->assertSame(1, $ligne['preuves']);

        $detail = $this->actingAs($this->manager)->getJson("/api/admin/demandes/{$d->id}")->json('data');
        $this->assertSame(['client', 'prestataire'], collect($detail['declarations'])->pluck('role')->all());
        $this->assertCount(1, $detail['declarations'][0]['photos']);
        $this->assertNotNull($detail['client']['telephone']);
        $this->assertNotNull($detail['prestataire_contact']['telephone']);

        // Le manager ne bloque pas ; il rembourse, fait revenir le prestataire et l'avertit.
        $this->actingAs($this->manager)->postJson("/api/admin/demandes/{$d->id}/litige", ['decision' => 'Faute grave.', 'issue' => 'aucune', 'mesures' => ['blocage']])->assertForbidden();
        $this->actingAs($this->manager)->postJson("/api/admin/demandes/{$d->id}/litige", ['decision' => 'Remboursement partiel.', 'issue' => 'aucune', 'mesures' => ['remboursement']])->assertStatus(422)->assertJsonValidationErrors('remboursement');
        $detail = $this->actingAs($this->manager)->postJson("/api/admin/demandes/{$d->id}/litige", [
            'decision' => 'Koffi revient réparer ; 5 000 F rendus au client.',
            'issue' => 'aucune',
            'mesures' => ['remboursement', 'reintervention', 'avertissement'],
            'remboursement' => 5000,
        ])->assertOk()->json('data');

        $this->assertSame('acceptee', $detail['statut']);
        $this->assertSame(5000, $detail['decisions'][0]['remboursement']);
        $this->assertContains('Nouvelle intervention', $detail['decisions'][0]['mesures']);
        $this->assertTrue($detail['dossier_prestataire']['recidive']);
        $this->assertSame('avertissement', $this->koffi->sanctions()->value('type'));
        $this->assertSame(['traite'], collect($detail['declarations'])->pluck('statut')->unique()->values()->all());

        // L'administrateur bloque le prestataire fautif à répétition.
        $this->actingAs($this->admin)->postJson("/api/admin/demandes/{$d->id}/litige", ['decision' => 'Récidive : blocage.', 'issue' => 'aucune', 'mesures' => ['blocage']])->assertOk();
        $this->assertSame('bloque', $this->koffi->fresh()->statut);
    }

    public function test_un_remboursement_annule_la_commission(): void
    {
        Reglage::ecrire('commission_taux', 10);
        $d = $this->demande(['statut' => 'terminee']);
        $this->actingAs($this->client)->postJson("/api/demandes/{$d->id}/confirmer")->assertOk();
        $this->assertTrue(Commission::where('demande_id', $d->id)->exists());

        $this->actingAs($this->admin)->postJson("/api/admin/demandes/{$d->id}/litige", ['decision' => 'Remboursé en entier.', 'issue' => 'aucune', 'mesures' => ['remboursement'], 'remboursement' => 20000])->assertOk();
        $this->assertFalse(Commission::where('demande_id', $d->id)->exists());
        $this->assertNull(Secteur::where('cle', 'plomberie')->value('commission'));
    }
}
