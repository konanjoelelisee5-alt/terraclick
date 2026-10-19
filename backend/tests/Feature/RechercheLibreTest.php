<?php

namespace Tests\Feature;

use Database\Seeders\CatalogueSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * La barre de recherche comprend un métier, un service ou une phrase décrivant le problème,
 * et renvoie les prestataires du secteur reconnu (périmètre MVP).
 */
class RechercheLibreTest extends TestCase
{
    use RefreshDatabase;

    private const PLOMBIERS = ['Koffi Tanoh', 'Ali Diomandé'];

    private const ELECTRICIENS = ['Élec Yakro'];

    private const CLIMATISATION = ['ClimaCool CI'];

    private const SERRURIERS = ['Serrurerie N\'Guessan'];

    private const MENUISIERS = ['Menuiserie Konaté'];

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
    }

    public static function demandes(): array
    {
        return [
            'métier' => ['plombier', 'Plomberie', self::PLOMBIERS],
            'service' => ['plomberie', 'Plomberie', self::PLOMBIERS],
            'phrase avec le métier' => ['Je cherche un plombier pour ma cuisine', 'Plomberie', self::PLOMBIERS],
            'problème sans le métier' => ['Ma douche fuit depuis hier', 'Plomberie', self::PLOMBIERS],
            'élision et accents' => ["l'eau coule sous mon évier", 'Plomberie', self::PLOMBIERS],
            'majuscules et accents' => ['ÉLECTRICIEN', 'Électricité', self::ELECTRICIENS],
            'panne électrique' => ['Le disjoncteur saute dès que j\'allume la lumière', 'Électricité', self::ELECTRICIENS],
            '« tableau » n\'est pas une table' => ['mon tableau électrique fait des étincelles', 'Électricité', self::ELECTRICIENS],
            'climatisation' => ['la clim ne refroidit plus', 'Climatisation', self::CLIMATISATION],
            'climaticien' => ['climaticien', 'Climatisation', self::CLIMATISATION],
            'clé perdue' => ['J\'ai perdu la clé de ma porte', 'Serrurerie', self::SERRURIERS],
            'porte qui ne ferme plus' => ['ma porte ne ferme plus', 'Serrurerie', self::SERRURIERS],
            'meuble' => ['Je veux faire fabriquer une armoire en bois', 'Menuiserie', self::MENUISIERS],
            'menuisier' => ['menuisier', 'Menuiserie', self::MENUISIERS],
        ];
    }

    /** @param list<string> $attendus */
    #[DataProvider('demandes')]
    public function test_la_demande_mene_au_bon_secteur(string $demande, string $secteur, array $attendus): void
    {
        $reponse = $this->getJson('/api/prestataires?'.http_build_query(['q' => $demande]))->assertOk();

        $this->assertSame([$secteur], $reponse->json('analyse.secteurs'));
        $this->assertEqualsCanonicalizing($attendus, $reponse->json('data.*.nom'));
    }

    public function test_un_mot_partage_propose_les_deux_secteurs(): void
    {
        $reponse = $this->getJson('/api/prestataires?q=porte')->assertOk();

        $this->assertEqualsCanonicalizing(['Serrurerie', 'Menuiserie'], $reponse->json('analyse.secteurs'));
        $this->assertEqualsCanonicalizing([...self::SERRURIERS, ...self::MENUISIERS], $reponse->json('data.*.nom'));
    }

    public function test_une_demande_incomprise_retombe_sur_le_texte(): void
    {
        $this->getJson('/api/prestataires?q=Koffi')
            ->assertJsonPath('analyse.secteurs', [])
            ->assertJsonPath('data.0.nom', 'Koffi Tanoh');

        $this->getJson('/api/prestataires?q=bonjour')
            ->assertJsonPath('analyse.secteurs', [])
            ->assertJsonPath('data', []);
    }

    public function test_un_secteur_masque_n_est_pas_reconnu(): void
    {
        $this->getJson('/api/prestataires?'.http_build_query(['q' => 'mon mécanicien pour la voiture']))
            ->assertJsonPath('analyse.secteurs', [])
            ->assertJsonPath('data', []);
    }

    public function test_une_longue_phrase_est_acceptee(): void
    {
        $phrase = 'Bonjour, depuis ce matin le robinet de la cuisine coule sans arrêt et l\'eau commence à '
            .'couler sous le meuble de l\'évier, je voudrais quelqu\'un rapidement à Habitat';

        $this->getJson('/api/prestataires?'.http_build_query(['q' => $phrase]))
            ->assertOk()
            ->assertJsonPath('analyse.secteurs', ['Plomberie']);
    }
}
