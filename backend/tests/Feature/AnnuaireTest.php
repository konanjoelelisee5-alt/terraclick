<?php

namespace Tests\Feature;

use App\Models\Prestataire;
use App\Models\Quartier;
use App\Models\User;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnnuaireTest extends TestCase
{
    use RefreshDatabase;

    /** Centre de Yamoussoukro. */
    private const CENTRE = ['lat' => 6.8200, 'lng' => -5.2770];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
    }

    public function test_les_villes_avec_leurs_quartiers(): void
    {
        $this->getJson('/api/villes')
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('data.0.nom', 'Yamoussoukro')
            ->assertJsonCount(9, 'data.0.quartiers')
            ->assertJsonPath('data.1.quartiers', []);
    }

    public function test_le_mega_menu_complet(): void
    {
        $reponse = $this->getJson('/api/departements')
            ->assertOk()
            ->assertJsonCount(12, 'data')
            ->assertJsonPath('data.0.nom', 'Maison & Bâtiment')
            ->assertJsonPath('data.0.icone', 'home')
            ->assertJsonPath('data.0.rubriques.1.nom', 'Construction')
            ->assertJsonPath('data.0.rubriques.1.categories.9.nom', 'Plombiers');

        // Maison & Bâtiment : Koffi, Ali, Élec Yakro, Solar Mamadou, ClimaCool, Soleil Énergie, Bakayoko.
        $this->assertSame(7, $reponse->json('data.0.nombre_prestataires'));
        $this->assertSame(0, $reponse->json('data.11.nombre_prestataires'));
    }

    public function test_recherche_plein_texte(): void
    {
        $noms = $this->getJson('/api/prestataires?q=plomb')->assertOk()->json('data.*.nom');

        $this->assertEqualsCanonicalizing(['Koffi Tanoh', 'Ali Diomandé'], $noms);
    }

    public function test_la_recherche_ignore_les_accents(): void
    {
        $this->assertContains('Élec Yakro', $this->getJson('/api/prestataires?q=electricien')->json('data.*.nom'));
    }

    public function test_filtre_par_categorie_et_par_quartier(): void
    {
        $this->assertEqualsCanonicalizing(
            ['Garage Bamba', 'Auto Service Yakro'],
            $this->getJson('/api/prestataires?categorie=mecanicien-auto')->json('data.*.nom'),
        );

        $habitat = Quartier::where('slug', 'habitat')->value('id');
        $this->assertEqualsCanonicalizing(
            ['Koffi Tanoh', 'ClimaCool CI'],
            $this->getJson("/api/prestataires?quartier={$habitat}")->json('data.*.nom'),
        );
    }

    public function test_filtre_par_departement(): void
    {
        $this->assertEqualsCanonicalizing(
            ['Garage Bamba', 'Auto Service Yakro'],
            $this->getJson('/api/prestataires?departement=auto-transport')->json('data.*.nom'),
        );
    }

    public function test_autour_de_moi_trie_par_distance_dans_un_rayon(): void
    {
        $reponse = $this->getJson('/api/prestataires?'.http_build_query([...self::CENTRE, 'rayon_km' => 2]))->assertOk();

        $distances = $reponse->json('data.*.distance_km');
        $this->assertNotEmpty($distances);
        $this->assertSame('Ent. Bakayoko', $reponse->json('data.0.nom'));
        $this->assertSame(0.0, (float) $distances[0]);
        $this->assertSame($distances, collect($distances)->sort()->values()->all());
        $this->assertLessThanOrEqual(2, max($distances));
        $this->assertNotContains('Solar Mamadou', $reponse->json('data.*.nom'));
    }

    public function test_un_tri_par_distance_sans_position_retombe_sur_la_pertinence(): void
    {
        $this->getJson('/api/prestataires?tri=distance')
            ->assertOk()
            ->assertJsonMissingPath('data.0.distance_km')
            ->assertJsonPath('data.0.en_vedette', true);
    }

    public function test_la_carte_de_resultat(): void
    {
        $koffi = collect($this->getJson('/api/prestataires?q=Koffi')->json('data'))->first();

        $this->assertSame('KT', $koffi['initiales']);
        $this->assertSame(4.8, $koffi['note']);
        $this->assertSame(63, $koffi['nombre_avis']);
        $this->assertSame('5 000 – 15 000 F', $koffi['prix']['affichage']);
        $this->assertSame('10 min', $koffi['delai_reponse']['affichage']);
        $this->assertSame('Habitat', $koffi['quartier']['nom']);
        $this->assertFalse($koffi['verifie']);
    }

    public function test_un_prestataire_desactive_disparait(): void
    {
        $koffi = Prestataire::where('nom', 'Koffi Tanoh')->first();
        $koffi->update(['actif' => false]);

        $this->assertNotContains('Koffi Tanoh', $this->getJson('/api/prestataires?q=plomb')->json('data.*.nom'));
        $this->getJson("/api/prestataires/{$koffi->id}")->assertNotFound();
    }

    public function test_les_vedettes_de_l_accueil(): void
    {
        $this->assertEqualsCanonicalizing(
            ['Auto Service Yakro', 'ClimaCool CI', 'Soleil Énergie'],
            $this->getJson('/api/prestataires/vedettes')->assertOk()->json('data.*.nom'),
        );
    }

    public function test_la_fiche_professionnelle(): void
    {
        $bakayoko = Prestataire::where('nom', 'Ent. Bakayoko')->first();

        $this->getJson("/api/prestataires/{$bakayoko->id}")
            ->assertOk()
            ->assertJsonPath('data.initiales', 'EB')
            ->assertJsonPath('data.verifie', true)
            ->assertJsonPath('data.experience.depuis', 2011)
            ->assertJsonPath('data.zone_intervention', 'Yamoussoukro, Toumodi et Attiégouakro')
            ->assertJsonCount(6, 'data.prestations')
            ->assertJsonPath('data.tarifs.0.affichage', 'Gratuit')
            ->assertJsonPath('data.tarifs.1.affichage', 'à partir de 95 000 F')
            ->assertJsonPath('data.documents.0.libelle', 'Registre de commerce')
            ->assertJsonCount(4, 'data.realisations')
            ->assertJsonPath('data.avis_recents.0.auteur.nom', 'Aya K.')
            ->assertJsonPath('data.avis_recents.0.date_affichage', 'juillet 2026')
            ->assertJsonMissingPath('data.telephone');
    }

    public function test_le_numero_du_pro_n_est_donne_qu_aux_connectes(): void
    {
        $koffi = Prestataire::where('nom', 'Koffi Tanoh')->first();
        $koffi->update(['telephone' => '+2250700000001']);

        $this->getJson("/api/prestataires/{$koffi->id}")
            ->assertJsonPath('data.joignable_par_telephone', true)
            ->assertJsonMissingPath('data.telephone');

        $jeton = User::factory()->create()->createToken('test')->plainTextToken;
        $this->withToken($jeton)->getJson("/api/prestataires/{$koffi->id}")
            ->assertJsonPath('data.telephone', '07 00 00 00 01');
    }

    public function test_une_fiche_inconnue(): void
    {
        $this->getJson('/api/prestataires/99999')
            ->assertNotFound()
            ->assertJsonPath('message', 'Ressource introuvable.');
    }

    public function test_un_filtre_invalide_est_explique(): void
    {
        $this->getJson('/api/prestataires?categorie=licornes&lat=6.8')
            ->assertStatus(422)
            ->assertJsonPath('errors.categorie.0', 'Cette catégorie n\'existe pas.')
            ->assertJsonPath('errors.lng.0', 'La position doit comporter une latitude et une longitude.');
    }
}
