<?php

namespace Tests\Feature;

use App\Models\OtpCode;
use App\Models\Quartier;
use App\Models\User;
use App\Models\Ville;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private const NUMERO = '07 11 22 33 44';

    private const NORMALISE = '+2250711223344';

    private object $boite;

    protected function setUp(): void
    {
        parent::setUp();
        $this->boite = $this->intercepterCodes();
    }

    public function test_un_code_est_envoye_sur_le_canal_choisi(): void
    {
        $this->postJson('/api/auth/code', ['telephone' => self::NUMERO, 'canal' => 'whatsapp'])
            ->assertStatus(202)
            ->assertJson([
                'message' => 'Code envoyé par WhatsApp au 07 11 22 33 44.',
                'expire_dans_secondes' => 600,
            ]);

        $this->assertCount(1, $this->boite->envois);
        $this->assertSame(self::NORMALISE, $this->boite->envois[0]['telephone']);
        $this->assertSame('whatsapp', $this->boite->envois[0]['canal']);
        $this->assertMatchesRegularExpression('/^\d{6}$/', $this->boite->dernierCode());

        // Le code n'est jamais stocké en clair.
        $this->assertDatabaseMissing('otp_codes', ['code_hash' => $this->boite->dernierCode()]);
    }

    public function test_un_numero_non_ivoirien_est_refuse(): void
    {
        $this->postJson('/api/auth/code', ['telephone' => '58 42 19 03'])
            ->assertStatus(422)
            ->assertJsonPath('errors.telephone.0', 'Ce numéro n\'est pas un numéro ivoirien valide (10 chiffres, ex. 07 00 00 00 00).');

        $this->assertEmpty($this->boite->envois);
    }

    public function test_un_nouveau_numero_cree_un_compte_a_completer(): void
    {
        $this->postJson('/api/auth/code', ['telephone' => self::NUMERO]);

        $reponse = $this->postJson('/api/auth/verifier', ['telephone' => self::NUMERO, 'code' => $this->boite->dernierCode()])
            ->assertStatus(201)
            ->assertJsonPath('nouveau_compte', true)
            ->assertJsonPath('utilisateur.telephone', self::NORMALISE)
            ->assertJsonPath('utilisateur.profil_complet', false);

        $quartier = $this->creerQuartier();

        $this->withToken($reponse->json('token'))
            ->patchJson('/api/moi', ['nom' => 'Awa Coulibaly', 'quartier_id' => $quartier->id])
            ->assertOk()
            ->assertJsonPath('data.nom', 'Awa Coulibaly')
            ->assertJsonPath('data.quartier.nom', 'Habitat')
            ->assertJsonPath('data.profil_complet', true);
    }

    public function test_le_profil_exige_un_nom_a_la_premiere_connexion(): void
    {
        $user = User::factory()->sansProfil()->create();

        $this->actingAs($user)->patchJson('/api/moi', [])
            ->assertStatus(422)
            ->assertJsonPath('errors.nom.0', 'Indiquez votre prénom et votre nom.');
    }

    public function test_un_numero_connu_se_connecte_directement(): void
    {
        User::factory()->create(['telephone' => self::NORMALISE, 'nom' => 'Aya Konan']);

        $this->postJson('/api/auth/code', ['telephone' => self::NUMERO]);

        $this->postJson('/api/auth/verifier', ['telephone' => '+225'.self::NUMERO, 'code' => $this->boite->dernierCode()])
            ->assertOk()
            ->assertJsonPath('nouveau_compte', false)
            ->assertJsonPath('utilisateur.nom', 'Aya Konan')
            ->assertJsonPath('utilisateur.profil_complet', true);

        $this->assertDatabaseCount('users', 1);
    }

    public function test_un_mauvais_code_decompte_les_essais_puis_grille_le_code(): void
    {
        $this->postJson('/api/auth/code', ['telephone' => self::NUMERO]);
        $bon = $this->boite->dernierCode();
        $faux = $bon === '000000' ? '111111' : '000000';

        $this->postJson('/api/auth/verifier', ['telephone' => self::NUMERO, 'code' => $faux])
            ->assertStatus(422)
            ->assertJsonPath('errors.code.0', 'Code incorrect. Il vous reste 4 essais.');

        foreach (range(1, 4) as $_) {
            $this->postJson('/api/auth/verifier', ['telephone' => self::NUMERO, 'code' => $faux]);
        }

        // Cinq échecs : même le bon code ne passe plus.
        $this->postJson('/api/auth/verifier', ['telephone' => self::NUMERO, 'code' => $bon])
            ->assertStatus(422)
            ->assertJsonPath('errors.code.0', 'Ce code a expiré. Demandez-en un nouveau.');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_le_bon_code_passe_apres_une_faute_de_frappe(): void
    {
        $this->postJson('/api/auth/code', ['telephone' => self::NUMERO]);
        $bon = $this->boite->dernierCode();
        $expiration = OtpCode::first()->expire_le;

        $this->travel(2)->minutes();
        $this->postJson('/api/auth/verifier', ['telephone' => self::NUMERO, 'code' => $bon === '000000' ? '111111' : '000000']);

        // Un essai ne doit pas toucher à l'heure d'expiration.
        $this->assertEquals($expiration, OtpCode::first()->expire_le);
        $this->postJson('/api/auth/verifier', ['telephone' => self::NUMERO, 'code' => $bon])->assertStatus(201);
    }

    public function test_un_code_expire_est_refuse(): void
    {
        $this->postJson('/api/auth/code', ['telephone' => self::NUMERO]);

        $this->travel(11)->minutes();

        $this->postJson('/api/auth/verifier', ['telephone' => self::NUMERO, 'code' => $this->boite->dernierCode()])
            ->assertStatus(422)
            ->assertJsonPath('errors.code.0', 'Ce code a expiré. Demandez-en un nouveau.');
    }

    public function test_un_code_ne_sert_qu_une_fois(): void
    {
        $this->postJson('/api/auth/code', ['telephone' => self::NUMERO]);
        $code = $this->boite->dernierCode();

        $this->postJson('/api/auth/verifier', ['telephone' => self::NUMERO, 'code' => $code])->assertStatus(201);
        $this->postJson('/api/auth/verifier', ['telephone' => self::NUMERO, 'code' => $code])->assertStatus(422);
    }

    public function test_un_nouveau_code_annule_le_precedent(): void
    {
        $this->postJson('/api/auth/code', ['telephone' => self::NUMERO]);
        $ancien = $this->boite->dernierCode();

        $this->travel(61)->seconds();
        $this->postJson('/api/auth/code', ['telephone' => self::NUMERO])->assertStatus(202);

        $this->assertSame(1, OtpCode::where('telephone', self::NORMALISE)->valides()->count());

        if ($ancien !== $this->boite->dernierCode()) {
            $this->postJson('/api/auth/verifier', ['telephone' => self::NUMERO, 'code' => $ancien])->assertStatus(422);
        }
        $this->postJson('/api/auth/verifier', ['telephone' => self::NUMERO, 'code' => $this->boite->dernierCode()])->assertStatus(201);
    }

    public function test_un_seul_code_par_minute_et_par_numero(): void
    {
        $this->postJson('/api/auth/code', ['telephone' => self::NUMERO])->assertStatus(202);

        $this->postJson('/api/auth/code', ['telephone' => '+225 '.self::NUMERO])
            ->assertStatus(429)
            ->assertJsonPath('message', 'Patientez une minute avant de redemander un code.');

        $this->assertCount(1, $this->boite->envois);
    }

    public function test_les_routes_protegees_demandent_une_connexion(): void
    {
        $this->getJson('/api/moi')
            ->assertStatus(401)
            ->assertJsonPath('message', 'Connectez-vous pour continuer.');
    }

    public function test_la_deconnexion_revoque_le_jeton_de_l_appareil(): void
    {
        $user = User::factory()->create();
        $jeton = $user->createToken('telephone')->plainTextToken;

        $this->withToken($jeton)->getJson('/api/moi')->assertOk();
        $this->withToken($jeton)->postJson('/api/auth/deconnexion')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    private function creerQuartier(): Quartier
    {
        $ville = Ville::create(['nom' => 'Yamoussoukro', 'slug' => 'yamoussoukro']);

        return $ville->quartiers()->create(['nom' => 'Habitat', 'slug' => 'habitat']);
    }
}
