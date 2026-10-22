<?php

namespace Tests\Feature;

use App\Models\Candidature;
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

/**
 * « Devenir prestataire » : le candidat envoie son dossier selon son type, l'équipe TerraClick
 * le vérifie, ouvre les pièces, valide (la fiche est créée et reliée au compte) ou refuse.
 */
class CandidatureTest extends TestCase
{
    use RefreshDatabase;

    private User $candidat;

    private User $equipe;

    private int $habitat;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        Storage::fake('local');
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
        $this->candidat = User::factory()->create(['nom' => 'Yao Kouamé']);
        $this->equipe = User::where('telephone', '+2250701010101')->firstOrFail();
        $this->habitat = Quartier::where('slug', 'habitat')->value('id');
    }

    private function dossier(string $type = 'artisan', array $champs = []): array
    {
        $photo = fn (string $nom) => UploadedFile::fake()->create("{$nom}.jpg", 120, 'image/jpeg');

        return [
            'type' => $type,
            'nom_activite' => 'Yao Plomberie',
            'responsable' => 'Yao Kouamé',
            'secteurs' => ['plomberie'],
            'quartier_id' => $this->habitat,
            'quartiers' => [$this->habitat],
            'description' => 'Plombier depuis dix ans : fuites, sanitaires, chauffe-eau.',
            'experience_annees' => 10,
            'horaires' => 'Lundi au samedi, 7 h – 19 h',
            'prix' => 'Déplacement 2 000 F, devis gratuit',
            'paiements' => ['especes', 'mobile_money'],
            'engagement' => '1',
            'details' => ['reference_nom' => 'Ali Diomandé', 'reference_telephone' => '07 11 22 33 44'],
            'documents' => [
                'photo_visage' => $photo('visage'),
                'piece_recto' => $photo('recto'),
                'piece_verso' => UploadedFile::fake()->create('verso.pdf', 200, 'application/pdf'),
            ],
            ...$champs,
        ];
    }

    public function test_les_exigences_sont_publiques_et_suivent_le_type(): void
    {
        $reponse = $this->getJson('/api/candidature/exigences')->assertOk()
            ->assertJsonPath('data.types.0.cle', 'artisan')
            ->assertJsonCount(5, 'data.secteurs');

        $entreprise = collect($reponse->json('data.documents.entreprise'))->keyBy('cle');
        $this->assertTrue($entreprise['rccm']['obligatoire']);
        $this->assertTrue($entreprise['piece_recto']['obligatoire']);
        $this->assertFalse($entreprise['assurance_decennale']['obligatoire']);
    }

    public function test_un_artisan_envoie_son_dossier(): void
    {
        $this->actingAs($this->candidat)->post('/api/moi/candidature', $this->dossier(), ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.statut', 'en_attente')
            ->assertJsonPath('data.statut_libelle', 'En cours de vérification')
            ->assertJsonPath('data.type.nom', 'Artisan indépendant')
            ->assertJsonPath('data.secteurs.0.nom', 'Plomberie')
            ->assertJsonCount(3, 'data.documents')
            // Le candidat ne reçoit pas l'adresse des pièces.
            ->assertJsonPath('data.documents.0.url', null);

        $candidature = Candidature::firstOrFail();
        $this->assertMatchesRegularExpression('/^CAN-\d{4}-\d{5}$/', $candidature->reference);
        Storage::disk('local')->assertExists($candidature->documents()->where('type', 'piece_recto')->value('fichier'));

        // Une seule candidature en cours.
        $this->actingAs($this->candidat)->post('/api/moi/candidature', $this->dossier(), ['Accept' => 'application/json'])->assertStatus(409);
        $this->actingAs($this->candidat)->getJson('/api/moi/candidature')->assertJsonPath('data.reference', $candidature->reference);
    }

    public function test_les_pieces_et_informations_obligatoires_dependent_du_type(): void
    {
        $this->actingAs($this->candidat)->post('/api/moi/candidature', $this->dossier('artisan', ['details' => [], 'documents' => []]), ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['details.reference_nom', 'documents']);

        // Entreprise : RCCM, NCC, siège et nombre de techniciens.
        $this->actingAs($this->candidat)->post('/api/moi/candidature', $this->dossier('entreprise'), ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['details.rccm', 'details.ncc', 'details.adresse_siege', 'details.nombre_techniciens', 'documents.rccm']);

        // Pressing : local, services, délai, collecte et photo de la devanture.
        $this->actingAs($this->candidat)->post('/api/moi/candidature', $this->dossier('pressing', ['secteurs' => null]), ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['details.adresse_local', 'details.services', 'details.delai', 'details.collecte', 'documents.devanture'])
            ->assertJsonMissingValidationErrors('secteurs');

        // Engagement et format des fichiers.
        $this->actingAs($this->candidat)->post('/api/moi/candidature', $this->dossier('artisan', [
            'engagement' => '0',
            'documents' => ['photo_visage' => UploadedFile::fake()->create('virus.exe', 10), 'piece_recto' => UploadedFile::fake()->create('r.jpg', 120, 'image/jpeg'), 'piece_verso' => UploadedFile::fake()->create('v.jpg', 120, 'image/jpeg')],
        ]), ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['engagement', 'documents.photo_visage']);
    }

    public function test_un_pressing_envoie_son_dossier(): void
    {
        $this->actingAs($this->candidat)->post('/api/moi/candidature', $this->dossier('pressing', [
            'nom_activite' => 'Pressing Lumière',
            'secteurs' => null,
            'details' => [
                'adresse_local' => 'Face à la pharmacie de l\'Habitat',
                'services' => ['lavage', 'nettoyage_sec'],
                'express' => '1',
                'delai' => '48 h',
                'collecte' => '1',
                'quartiers_collecte' => [$this->habitat],
                'frais_collecte' => '500 F',
            ],
            'documents' => [...$this->dossier()['documents'], 'devanture' => UploadedFile::fake()->create('devanture.jpg', 120, 'image/jpeg')],
        ]), ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.secteurs.0.cle', 'pressing')
            ->assertJsonPath('data.details.quartiers_collecte.0', 'Habitat');
    }

    public function test_l_equipe_verifie_et_valide_la_fiche_est_creee(): void
    {
        $this->actingAs($this->candidat)->post('/api/moi/candidature', $this->dossier(), ['Accept' => 'application/json'])->assertCreated();
        $id = Candidature::firstOrFail()->id;

        // Réservé à l'équipe.
        $this->actingAs($this->candidat)->getJson('/api/admin/candidatures')->assertForbidden();

        $this->actingAs($this->equipe)->getJson('/api/admin/candidatures')->assertOk()
            ->assertJsonPath('data.0.id', $id)
            ->assertJsonPath('data.0.details.reference_nom', 'Ali Diomandé');
        $url = $this->actingAs($this->equipe)->getJson("/api/admin/candidatures/{$id}")->json('data.documents.1.url');
        $this->assertStringEndsWith("/api/admin/candidatures/{$id}/documents/piece_recto", $url);
        $this->actingAs($this->equipe)->get("/api/admin/candidatures/{$id}/documents/piece_recto")->assertOk();
        $this->actingAs($this->candidat)->get("/api/admin/candidatures/{$id}/documents/piece_recto")->assertForbidden();

        $this->actingAs($this->equipe)->postJson("/api/admin/candidatures/{$id}/valider")->assertOk()
            ->assertJsonPath('data.statut', 'validee');

        $fiche = Prestataire::where('user_id', $this->candidat->id)->firstOrFail();
        $this->assertSame('Yao Plomberie', $fiche->nom);
        $this->assertSame('Plombier', $fiche->metier);
        $this->assertTrue($fiche->categories()->where('slug', 'plombiers')->exists());
        $this->assertSame('verifie', $fiche->documents()->where('type', 'cni_gerant')->value('statut'));

        // La fiche est publique, et le compte ouvre ses demandes reçues.
        $this->getJson("/api/prestataires/{$fiche->id}")->assertOk();
        // Validé : le compte a reçu le rôle prestataire (permissions relues, comme à chaque requête).
        $this->actingAs($this->candidat->fresh())->getJson('/api/pro/demandes')->assertOk();
        $this->actingAs($this->equipe)->postJson("/api/admin/candidatures/{$id}/valider")->assertStatus(422);
    }

    public function test_un_refus_explique_quoi_corriger_et_permet_de_renvoyer(): void
    {
        $this->actingAs($this->candidat)->post('/api/moi/candidature', $this->dossier(), ['Accept' => 'application/json'])->assertCreated();
        $id = Candidature::firstOrFail()->id;

        $this->actingAs($this->equipe)->postJson("/api/admin/candidatures/{$id}/refuser")->assertStatus(422)->assertJsonValidationErrors('motif');
        $this->actingAs($this->equipe)->postJson("/api/admin/candidatures/{$id}/refuser", ['motif' => 'La photo de la pièce est floue.'])->assertOk()
            ->assertJsonPath('data.statut', 'refusee');

        $this->actingAs($this->candidat)->getJson('/api/moi/candidature')
            ->assertJsonPath('data.statut_libelle', 'À compléter')
            ->assertJsonPath('data.motif_refus', 'La photo de la pièce est floue.');
        $this->actingAs($this->candidat)->post('/api/moi/candidature', $this->dossier(), ['Accept' => 'application/json'])->assertCreated();
    }

    public function test_un_rejet_est_definitif(): void
    {
        $this->actingAs($this->candidat)->post('/api/moi/candidature', $this->dossier(), ['Accept' => 'application/json'])->assertCreated();
        $id = Candidature::firstOrFail()->id;

        $this->actingAs($this->equipe)->postJson("/api/admin/candidatures/{$id}/rejeter", ['motif' => 'Faux documents d\'identité.'])->assertOk()
            ->assertJsonPath('data.statut', 'rejetee')->assertJsonPath('data.statut_libelle', 'Rejetée');
        $this->assertFalse(Prestataire::where('user_id', $this->candidat->id)->exists());

        // Le candidat lit le motif, mais ne peut plus renvoyer de dossier.
        $this->actingAs($this->candidat)->getJson('/api/moi/candidature')->assertJsonPath('data.motif_refus', 'Faux documents d\'identité.');
        $this->actingAs($this->candidat)->post('/api/moi/candidature', $this->dossier(), ['Accept' => 'application/json'])->assertStatus(409);
    }

    public function test_la_validation_reprend_toutes_les_pieces_dans_le_dossier_de_la_fiche(): void
    {
        $this->actingAs($this->candidat)->post('/api/moi/candidature', $this->dossier(), ['Accept' => 'application/json'])->assertCreated();
        $candidature = Candidature::with('documents')->firstOrFail();
        $this->actingAs($this->equipe)->postJson("/api/admin/candidatures/{$candidature->id}/valider")->assertOk();

        $fiche = Prestataire::where('user_id', $this->candidat->id)->firstOrFail();
        $this->assertSame($candidature->documents->count(), $fiche->documents()->count());
        $this->assertSame(['verifie'], $fiche->documents()->pluck('statut')->unique()->values()->all());
        $this->assertTrue($fiche->documents()->where('type', 'photo_visage')->whereNotNull('mime')->exists());
    }
}
