<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MotDePasseTest extends TestCase
{
    use RefreshDatabase;

    private const NUMERO = '07 11 22 33 44';

    private const NORMALISE = '+2250711223344';

    private object $boite;

    protected function setUp(): void
    {
        parent::setUp();
        $this->boite = $this->intercepterCodes();
        // Ces tests couvrent l'inscription avec vérification du numéro (réglage rebranchable).
        config(['otp.verification_inscription' => true]);
    }

    public function test_sans_verification_le_compte_est_cree_directement_sans_code(): void
    {
        config(['otp.verification_inscription' => false]);

        $this->postJson('/api/auth/inscription', $this->inscription())
            ->assertCreated()
            ->assertJsonStructure(['token'])
            ->assertJsonPath('utilisateur.nom', 'Awa Koné');

        // Aucun SMS ni WhatsApp envoyé ; le numéro n'est pas daté comme vérifié.
        $this->assertCount(0, $this->boite->envois);
        $this->assertNull(User::where('telephone', self::NORMALISE)->value('telephone_verifie_le'));

        // Le compte se reconnecte avec les mêmes informations, sur n'importe quel appareil.
        $this->postJson('/api/auth/connexion', ['telephone' => self::NUMERO, 'mot_de_passe' => 'soleil2026'])->assertOk();
    }

    public function test_sans_verification_un_compte_existant_n_est_jamais_repris(): void
    {
        config(['otp.verification_inscription' => false]);
        // Compte créé par code seul, sans mot de passe : sans preuve du numéro, on ne le reprend pas.
        User::factory()->create(['telephone' => self::NORMALISE, 'password' => null]);

        $this->postJson('/api/auth/inscription', $this->inscription())
            ->assertStatus(422)
            ->assertJsonValidationErrors('telephone');
    }

    private function recevoirCode(): string
    {
        $this->postJson('/api/auth/code', ['telephone' => self::NUMERO, 'canal' => 'sms'])->assertStatus(202);

        return $this->boite->dernierCode();
    }

    /** @return array<string, mixed> */
    private function inscription(array $champs = []): array
    {
        return $champs + [
            'telephone' => self::NUMERO,
            'nom' => 'Awa Koné',
            'email' => 'Awa@Exemple.ci',
            'mot_de_passe' => 'soleil2026',
            'mot_de_passe_confirmation' => 'soleil2026',
        ];
    }

    public function test_inscription_avec_mot_de_passe_cree_le_compte_et_ouvre_la_session(): void
    {
        $code = $this->recevoirCode();

        $this->postJson('/api/auth/inscription', $this->inscription(['code' => $code]))
            ->assertCreated()
            ->assertJsonStructure(['token'])
            ->assertJsonPath('utilisateur.nom', 'Awa Koné')
            ->assertJsonPath('utilisateur.email', 'awa@exemple.ci')
            ->assertJsonPath('utilisateur.a_mot_de_passe', true)
            ->assertJsonMissingPath('utilisateur.password');

        $user = User::where('telephone', self::NORMALISE)->firstOrFail();
        $this->assertNotNull($user->telephone_verifie_le);
        $this->assertTrue(Hash::check('soleil2026', $user->password));
    }

    public function test_inscription_refusee_sans_code_valide(): void
    {
        $this->recevoirCode();

        $this->postJson('/api/auth/inscription', $this->inscription(['code' => $this->boite->dernierCode() === '000000' ? '111111' : '000000']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('code');
        $this->assertDatabaseMissing('users', ['telephone' => self::NORMALISE]);
    }

    public function test_mot_de_passe_trop_faible_ou_mal_confirme(): void
    {
        $code = $this->recevoirCode();

        $this->postJson('/api/auth/inscription', $this->inscription(['code' => $code, 'mot_de_passe' => 'abc', 'mot_de_passe_confirmation' => 'abc']))
            ->assertStatus(422)
            ->assertJsonPath('errors.mot_de_passe.0', 'Le mot de passe doit faire au moins 8 caractères.');

        $this->postJson('/api/auth/inscription', $this->inscription(['code' => $code, 'mot_de_passe_confirmation' => 'autre2026']))
            ->assertStatus(422)
            ->assertJsonPath('errors.mot_de_passe.0', 'Les deux mots de passe ne sont pas identiques.');
    }

    public function test_un_numero_deja_inscrit_ne_peut_pas_se_reinscrire(): void
    {
        User::factory()->create(['telephone' => self::NORMALISE, 'password' => 'ancien2026']);
        $code = $this->recevoirCode();

        $this->postJson('/api/auth/inscription', $this->inscription(['code' => $code]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('telephone');
    }

    public function test_connexion_par_numero_et_mot_de_passe(): void
    {
        User::factory()->create(['telephone' => self::NORMALISE, 'nom' => 'Aya Konan', 'password' => 'soleil2026']);

        $this->postJson('/api/auth/connexion', ['telephone' => '+225 '.self::NUMERO, 'mot_de_passe' => 'soleil2026'])
            ->assertOk()
            ->assertJsonStructure(['token'])
            ->assertJsonPath('utilisateur.nom', 'Aya Konan');
    }

    public function test_mauvais_mot_de_passe_ou_numero_inconnu_meme_message(): void
    {
        User::factory()->create(['telephone' => self::NORMALISE, 'password' => 'soleil2026']);

        $this->postJson('/api/auth/connexion', ['telephone' => self::NUMERO, 'mot_de_passe' => 'faux2026'])
            ->assertStatus(422)
            ->assertJsonPath('errors.mot_de_passe.0', 'Numéro ou mot de passe incorrect.');
        $this->postJson('/api/auth/connexion', ['telephone' => '07 99 99 99 99', 'mot_de_passe' => 'soleil2026'])
            ->assertStatus(422)
            ->assertJsonPath('errors.mot_de_passe.0', 'Numéro ou mot de passe incorrect.');
    }

    public function test_un_compte_sans_mot_de_passe_est_dirige_vers_mot_de_passe_oublie(): void
    {
        User::factory()->create(['telephone' => self::NORMALISE, 'password' => null]);

        $this->postJson('/api/auth/connexion', ['telephone' => self::NUMERO, 'mot_de_passe' => 'nimporte2026'])
            ->assertStatus(422)
            ->assertJsonPath('errors.mot_de_passe.0', 'Ce compte n\'a pas encore de mot de passe. Touchez « Mot de passe oublié » pour en créer un.');
    }

    public function test_mot_de_passe_oublie_remplace_le_mot_de_passe_et_ferme_les_autres_sessions(): void
    {
        $user = User::factory()->create(['telephone' => self::NORMALISE, 'password' => 'ancien2026']);
        $user->createToken('ancien-appareil');
        $code = $this->recevoirCode();

        $this->postJson('/api/auth/mot-de-passe', [
            'telephone' => self::NUMERO,
            'code' => $code,
            'mot_de_passe' => 'nouveau2026',
            'mot_de_passe_confirmation' => 'nouveau2026',
        ])->assertOk()->assertJsonStructure(['token']);

        $this->assertSame(1, $user->tokens()->count());
        $this->postJson('/api/auth/connexion', ['telephone' => self::NUMERO, 'mot_de_passe' => 'ancien2026'])->assertStatus(422);
        $this->postJson('/api/auth/connexion', ['telephone' => self::NUMERO, 'mot_de_passe' => 'nouveau2026'])->assertOk();
    }

    public function test_mot_de_passe_oublie_pour_un_numero_inconnu(): void
    {
        $code = $this->recevoirCode();

        $this->postJson('/api/auth/mot-de-passe', [
            'telephone' => self::NUMERO,
            'code' => $code,
            'mot_de_passe' => 'nouveau2026',
            'mot_de_passe_confirmation' => 'nouveau2026',
        ])->assertStatus(422)->assertJsonPath('errors.telephone.0', 'Aucun compte avec ce numéro. Créez votre compte.');
    }
}
