<?php

namespace Tests\Feature;

use App\Models\Avis;
use App\Models\Prestataire;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActualiteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Les prestataires de la fabrique n'ont pas de catégorie : hors du périmètre MVP.
        config(['mvp.actif' => false]);
    }

    public function test_le_fil_melange_nouveaux_techniciens_avis_et_realisations_du_plus_recent_au_plus_ancien(): void
    {
        $this->travel(-3)->days();
        $pro = Prestataire::factory()->create(['nom' => 'Koffi Tanoh', 'metier' => 'Plombier']);
        $this->travel(1)->days();
        $pro->realisations()->create(['legende' => 'Salle de bain refaite', 'ordre' => 0]);
        $this->travelBack();
        Avis::create([
            'prestataire_id' => $pro->id,
            'user_id' => User::factory()->create(['nom' => 'Aya Konan'])->id,
            'note_ponctualite' => 5, 'note_qualite' => 5, 'note_prix' => 4, 'note' => 4.7,
            'commentaire' => 'Rapide et propre.',
        ]);

        $this->getJson('/api/actualites')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.type', 'avis')
            ->assertJsonPath('data.0.titre', 'Aya K. a noté Koffi Tanoh 4,7/5')
            ->assertJsonPath('data.0.texte', '« Rapide et propre. »')
            ->assertJsonPath('data.1.type', 'realisation')
            ->assertJsonPath('data.2.type', 'nouveau')
            ->assertJsonPath('data.2.titre', 'Koffi Tanoh rejoint TerraClick')
            ->assertJsonPath('meta.suivante', null);
    }

    public function test_un_prestataire_inactif_n_apparait_pas(): void
    {
        Prestataire::factory()->create(['actif' => false]);

        $this->getJson('/api/actualites')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_le_fil_se_lit_page_par_page(): void
    {
        Prestataire::factory()->count(12)->create();

        $this->getJson('/api/actualites')->assertJsonCount(10, 'data')->assertJsonPath('meta.suivante', 2);
        $this->getJson('/api/actualites?page=2')->assertJsonCount(2, 'data')->assertJsonPath('meta.suivante', null);
    }
}
