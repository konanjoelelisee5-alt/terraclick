<?php

namespace Tests\Feature;

use App\Models\Avis;
use App\Models\Demande;
use App\Models\Prestataire;
use App\Models\Quartier;
use App\Models\Signalement;
use App\Models\User;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Gestion des prestataires par l'équipe : filtres, dossier complet, documents vérifiés un à un,
 * secteurs attribués, statut (actif, suspendu, bloqué), sanctions, avis et activité.
 */
class AdminPrestataireTest extends TestCase
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
        Storage::fake('local');
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
        $this->admin = User::where('telephone', '+2250701010101')->firstOrFail();
        $this->manager = User::where('telephone', '+2250702020202')->firstOrFail();
        $this->client = User::where('telephone', '+2250758421903')->firstOrFail();
        $this->koffi = Prestataire::where('nom', 'Koffi Tanoh')->firstOrFail();
    }

    public function test_la_liste_se_filtre_par_secteur_quartier_statut_et_note(): void
    {
        $plomberie = collect($this->actingAs($this->admin)->getJson('/api/admin/prestataires?secteur=plomberie')->assertOk()->json('data'));
        $this->assertTrue($plomberie->contains('nom', 'Koffi Tanoh'));
        $this->assertTrue($plomberie->every(fn (array $p) => in_array('Plomberie', $p['secteurs'], true)));

        $habitat = Quartier::where('slug', 'habitat')->value('id');
        $this->assertTrue(collect($this->getJson("/api/admin/prestataires?quartier={$habitat}")->json('data'))->every(fn (array $p) => $p['quartier'] === 'Habitat'));
        $this->assertTrue(collect($this->getJson('/api/admin/prestataires?note_min=4.5')->json('data'))->every(fn (array $p) => $p['note'] >= 4.5));
        $this->getJson('/api/admin/prestataires?etat=bloques')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/admin/prestataires?secteur=jardinage')->assertStatus(422);
    }

    public function test_le_dossier_complet_d_un_prestataire(): void
    {
        Storage::disk('local')->put('candidatures/1/piece_recto.jpg', 'image');
        $piece = $this->koffi->documents()->create(['type' => 'piece_recto', 'statut' => 'en_attente', 'fichier' => 'candidatures/1/piece_recto.jpg', 'mime' => 'image/jpeg']);
        $avis = Avis::where('prestataire_id', $this->koffi->id)->count();

        $dossier = $this->actingAs($this->admin)->getJson("/api/admin/prestataires/{$this->koffi->id}")->assertOk()->json('data');

        $this->assertSame('Koffi Tanoh', $dossier['nom']);
        $this->assertSame('actif', $dossier['statut']);
        $this->assertContains('plomberie', $dossier['secteurs']);
        $this->assertSame(Demande::where('prestataire_id', $this->koffi->id)->count(), $dossier['activite']['missions']);
        $this->assertSame(Demande::where('prestataire_id', $this->koffi->id)->whereIn('statut', ['terminee', 'confirmee'])->count(), $dossier['activite']['reussies']);
        $this->assertCount($avis, $dossier['avis']);
        $carte = collect($dossier['documents'])->firstWhere('id', $piece->id);
        $this->assertSame('Pièce d\'identité, recto', $carte['libelle']);

        // La pièce s'ouvre pour l'équipe, jamais pour un client.
        $this->get($carte['url'])->assertOk();
        $this->actingAs($this->client)->getJson("/api/admin/prestataires/{$this->koffi->id}")->assertForbidden();
        $this->actingAs($this->client)->get($carte['url'])->assertForbidden();
    }

    public function test_verifier_les_documents_un_a_un(): void
    {
        $piece = $this->koffi->documents()->create(['type' => 'photo_visage', 'statut' => 'en_attente']);
        $url = "/api/admin/prestataires/{$this->koffi->id}/documents/{$piece->id}";

        $this->actingAs($this->manager)->patchJson($url, ['statut' => 'refuse'])->assertStatus(422)->assertJsonValidationErrors('motif');
        $this->actingAs($this->manager)->patchJson($url, ['statut' => 'refuse', 'motif' => 'La photo est floue.'])->assertOk()
            ->assertJsonPath('data.statut', 'refuse')->assertJsonPath('data.motif', 'La photo est floue.');
        $this->actingAs($this->manager)->patchJson($url, ['statut' => 'verifie'])->assertOk()->assertJsonPath('data.motif', null);
        $this->assertSame($this->manager->id, $piece->fresh()->verifie_par);
    }

    public function test_attribuer_un_prestataire_a_plusieurs_secteurs(): void
    {
        $url = "/api/admin/prestataires/{$this->koffi->id}/secteurs";

        $this->actingAs($this->admin)->putJson($url, ['secteurs' => ['plomberie', 'electricite']])->assertOk()
            ->assertJsonPath('data.secteurs', ['plomberie', 'electricite']);
        $this->assertTrue($this->koffi->categories()->where('slug', 'electriciens')->exists());

        $this->actingAs($this->admin)->putJson($url, ['secteurs' => ['electricite']])->assertOk()->assertJsonPath('data.secteurs', ['electricite']);
        $this->assertFalse($this->koffi->categories()->where('slug', 'plombiers')->exists());

        $this->actingAs($this->admin)->putJson($url, ['secteurs' => []])->assertStatus(422);
        $this->actingAs($this->client)->putJson($url, ['secteurs' => ['plomberie']])->assertForbidden();
    }

    public function test_suspendre_bloquer_et_reactiver(): void
    {
        $url = "/api/admin/prestataires/{$this->koffi->id}/statut";
        $compte = $this->koffi->utilisateur;

        // Le manager suspend, mais ne bloque pas.
        $this->actingAs($this->manager)->postJson($url, ['statut' => 'suspendu', 'motif' => 'Trois retards cette semaine.'])->assertOk()
            ->assertJsonPath('data.statut', 'suspendu')->assertJsonPath('data.sanctions.0.type', 'suspension');
        $this->getJson("/api/prestataires/{$this->koffi->id}")->assertNotFound();
        $this->actingAs($this->manager)->postJson($url, ['statut' => 'bloque', 'motif' => 'Fraude.'])->assertForbidden();

        // L'administrateur bloque : la fiche reste masquée et l'espace prestataire se ferme.
        $this->actingAs($this->admin)->postJson($url, ['statut' => 'bloque'])->assertStatus(422)->assertJsonValidationErrors('motif');
        $this->actingAs($this->admin)->postJson($url, ['statut' => 'bloque', 'motif' => 'Faux documents.'])->assertOk()
            ->assertJsonPath('data.statut_libelle', 'Bloqué')->assertJsonPath('data.statut_motif', 'Faux documents.');
        $this->actingAs($compte->fresh())->getJson('/api/pro/demandes')->assertForbidden();
        $this->actingAs($this->admin)->getJson('/api/admin/prestataires?etat=bloques')->assertJsonPath('data.0.nom', 'Koffi Tanoh');

        // Seul l'administrateur le débloque.
        $this->actingAs($this->manager)->postJson($url, ['statut' => 'actif', 'motif' => 'Dossier régularisé.'])->assertForbidden();
        $this->actingAs($this->admin)->postJson($url, ['statut' => 'actif', 'motif' => 'Dossier régularisé.'])->assertOk()
            ->assertJsonPath('data.statut', 'actif')->assertJsonCount(3, 'data.sanctions');
        $this->getJson("/api/prestataires/{$this->koffi->id}")->assertOk();
        $this->actingAs($compte->fresh())->getJson('/api/pro/demandes')->assertOk();
    }

    public function test_avertir_un_prestataire_apres_un_signalement(): void
    {
        $demande = Demande::where('prestataire_id', $this->koffi->id)->firstOrFail();
        $signalement = Signalement::create(['demande_id' => $demande->id, 'user_id' => $demande->user_id, 'motif' => 'retard', 'message' => 'Deux heures de retard.']);
        $url = "/api/admin/prestataires/{$this->koffi->id}/sanctions";

        $dossier = $this->actingAs($this->manager)->postJson($url, ['motif' => 'Ponctualité à améliorer.', 'signalement_id' => $signalement->id])->assertCreated()->json('data');
        $this->assertSame('avertissement', $dossier['sanctions'][0]['type']);
        $this->assertSame(1, $dossier['activite']['retards']);
        $this->assertSame('Retard', $dossier['signalements'][0]['motif_libelle']);
        // Toujours actif : un avertissement ne masque rien.
        $this->assertSame('actif', $dossier['statut']);

        // Un signalement qui concerne un autre prestataire est refusé.
        $autre = Demande::where('prestataire_id', '!=', $this->koffi->id)->whereNotNull('prestataire_id')->firstOrFail();
        $ailleurs = Signalement::create(['demande_id' => $autre->id, 'user_id' => $autre->user_id, 'motif' => 'autre']);
        $this->actingAs($this->manager)->postJson($url, ['motif' => 'Hors sujet.', 'signalement_id' => $ailleurs->id])->assertStatus(422);
    }
}
