<?php

namespace Tests\Feature;

use Database\Seeders\CatalogueSeeder;
use Database\Seeders\PrestataireSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/** Prestations : une demande précise mène au bon métier, aux bons techniciens et au bon prix. */
class PrestationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class]);
    }

    private function chercher(array $criteres): TestResponse
    {
        return $this->getJson('/api/prestataires?'.http_build_query([...$criteres, 'ville' => 'yamoussoukro']))->assertOk();
    }

    public function test_tuyau_casse_mene_aux_plombiers_avec_le_prix_de_la_reparation(): void
    {
        $reponse = $this->chercher(['q' => 'tuyau cassé'])
            ->assertJsonPath('analyse.secteurs', ['Plomberie'])
            ->assertJsonPath('analyse.secteur.cle', 'plomberie')
            ->assertJsonPath('analyse.prestation.nom', 'Réparation de tuyau cassé')
            ->assertJsonPath('analyse.prestation.prix.affichage', '7 000 – 20 000 F');

        $prix = collect($reponse->json('data'))->pluck('prestation.prix.affichage', 'nom');
        // Koffi Tanoh a fixé son propre prix ; Ali Diomandé suit le prix indicatif.
        $this->assertSame('6 000 – 15 000 F', $prix['Koffi Tanoh']);
        $this->assertSame('7 000 – 20 000 F', $prix['Ali Diomandé']);
    }

    public function test_une_recherche_de_metier_propose_les_prestations_du_secteur(): void
    {
        $reponse = $this->chercher(['q' => 'plombier'])
            ->assertJsonPath('analyse.prestation', null)
            ->assertJsonPath('analyse.secteur.nom', 'Plomberie');

        $this->assertContains('Débouchage WC et canalisation', $reponse->json('analyse.prestations.*.nom'));
        $this->assertCount(7, $reponse->json('analyse.prestations'));
        // Sans prestation précise, le prix affiché reste la fourchette du technicien.
        $this->assertNull($reponse->json('data.0.prestation'));
    }

    public function test_la_prestation_tranche_entre_deux_secteurs(): void
    {
        // « porte » relève de la serrurerie comme de la menuiserie ; « bloquée » désigne l'ouverture de porte.
        $this->chercher(['q' => 'porte bloquée'])
            ->assertJsonPath('analyse.secteurs', ['Serrurerie'])
            ->assertJsonPath('analyse.prestation.nom', 'Ouverture de porte bloquée');
    }

    public function test_un_onglet_de_prestation_filtre_et_donne_son_prix(): void
    {
        $this->chercher(['categorie' => 'plombiers', 'prestation' => 'debouchage-wc-et-canalisation'])
            ->assertJsonPath('analyse.prestation.nom', 'Débouchage WC et canalisation')
            ->assertJsonPath('data.0.prestation.prix.affichage', '8 000 – 25 000 F');
    }

    public function test_robinet_casse_n_est_pas_confondu_avec_un_tuyau(): void
    {
        $this->chercher(['q' => 'robinet cassé'])->assertJsonPath('analyse.prestation.nom', 'Remplacement de robinet');
        $this->chercher(['q' => 'ma prise fait des étincelles'])->assertJsonPath('analyse.prestation.prix.affichage', '3 000 – 8 000 F par point');
    }
}
