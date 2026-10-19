<?php

namespace Tests\Feature;

use App\Models\Prestataire;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvisTest extends TestCase
{
    use RefreshDatabase;

    private const NOTES = ['ponctualite' => 5, 'qualite' => 4, 'prix' => 3, 'commentaire' => 'Travail propre.'];

    protected function setUp(): void
    {
        parent::setUp();
        // Les prestataires de la fabrique n'ont pas de catégorie : hors du périmètre MVP.
        config(['mvp.actif' => false]);
    }

    public function test_publier_un_avis_met_a_jour_la_moyenne(): void
    {
        $pro = Prestataire::factory()->create(['note_moyenne' => 4.0, 'nombre_avis' => 3]);
        $client = User::factory()->create(['nom' => 'Aya Konan']);

        $this->actingAs($client)->postJson("/api/prestataires/{$pro->id}/avis", self::NOTES)
            ->assertCreated()
            // JSON écrit 4.0 sous la forme 4.
            ->assertJsonPath('data.note', 4)
            ->assertJsonPath('data.auteur.nom', 'Aya K.')
            ->assertJsonPath('data.notes.ponctualite', 5);

        // (4,0 × 3 + 4,0) / 4 = 4,0 ; puis un 5 : (4,0 × 4 + 5) / 5 = 4,2
        $autre = User::factory()->create();
        $this->actingAs($autre)->postJson("/api/prestataires/{$pro->id}/avis", ['ponctualite' => 5, 'qualite' => 5, 'prix' => 5]);

        $pro->refresh();
        $this->assertSame(5, $pro->nombre_avis);
        $this->assertSame(4.2, $pro->note_moyenne);

        $this->getJson("/api/prestataires/{$pro->id}/avis")->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_il_faut_etre_connecte(): void
    {
        $pro = Prestataire::factory()->create();

        $this->postJson("/api/prestataires/{$pro->id}/avis", self::NOTES)->assertUnauthorized();
    }

    public function test_il_faut_un_profil_complet(): void
    {
        $pro = Prestataire::factory()->create();

        $this->actingAs(User::factory()->sansProfil()->create())
            ->postJson("/api/prestataires/{$pro->id}/avis", self::NOTES)
            ->assertForbidden()
            ->assertJsonPath('message', 'Complétez votre profil avant de publier un avis.');
    }

    public function test_un_seul_avis_par_client(): void
    {
        $pro = Prestataire::factory()->create();
        $client = User::factory()->create();

        $this->actingAs($client)->postJson("/api/prestataires/{$pro->id}/avis", self::NOTES)->assertCreated();
        $this->actingAs($client)->postJson("/api/prestataires/{$pro->id}/avis", self::NOTES)->assertStatus(409);

        $this->assertSame(1, $pro->refresh()->nombre_avis);
    }

    public function test_on_ne_note_pas_sa_propre_fiche(): void
    {
        $gerant = User::factory()->create();
        $pro = Prestataire::factory()->create(['user_id' => $gerant->id]);

        $this->actingAs($gerant)->postJson("/api/prestataires/{$pro->id}/avis", self::NOTES)->assertForbidden();
    }

    public function test_les_notes_vont_de_1_a_5(): void
    {
        $pro = Prestataire::factory()->create();

        $this->actingAs(User::factory()->create())
            ->postJson("/api/prestataires/{$pro->id}/avis", ['ponctualite' => 6, 'qualite' => 0])
            ->assertStatus(422)
            ->assertJsonPath('errors.ponctualite.0', 'Chaque note va de 1 à 5.')
            ->assertJsonPath('errors.prix.0', 'Donnez une note de 1 à 5 pour chaque critère.');
    }
}
