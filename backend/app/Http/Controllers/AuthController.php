<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\ConnexionRequest;
use App\Http\Requests\Auth\DemanderCodeRequest;
use App\Http\Requests\Auth\InscriptionRequest;
use App\Http\Requests\Auth\ModifierProfilRequest;
use App\Http\Requests\Auth\ReinitialiserMotDePasseRequest;
use App\Http\Requests\Auth\VerifierCodeRequest;
use App\Http\Resources\UtilisateurResource;
use App\Models\User;
use App\Services\OtpService;
use App\Support\Telephone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Comptes clients. Inscription avec mot de passe (le numéro est prouvé par code), connexion
 * par numéro et mot de passe, « Mot de passe oublié » par code. La connexion par code seul
 * (`verifierCode`) reste disponible pour l'interface sans mot de passe, masquée par réglage.
 */
class AuthController extends Controller
{
    public function __construct(private OtpService $otp) {}

    /** POST /api/auth/code */
    public function demanderCode(DemanderCodeRequest $request): JsonResponse
    {
        $telephone = $request->validated('telephone');
        $canal = $request->validated('canal');

        $otp = $this->otp->emettre($telephone, $canal);

        // La réponse ne dit pas si le numéro est connu : on ne le révèle qu'au porteur du code.
        return response()->json([
            'message' => 'Code envoyé par '.($otp->canal === 'whatsapp' ? 'WhatsApp' : 'SMS').' au '.Telephone::affichage($telephone).'.',
            // Canal réellement utilisé : SMS si WhatsApp a échoué.
            'canal' => $otp->canal,
            'repli' => $otp->canal !== $canal,
            'expire_dans_secondes' => config('otp.duree_minutes') * 60,
        ], 202);
    }

    /** POST /api/auth/verifier */
    public function verifierCode(VerifierCodeRequest $request): JsonResponse
    {
        $telephone = $request->validated('telephone');

        $this->otp->verifier($telephone, $request->validated('code'));

        $user = User::firstOrCreate(['telephone' => $telephone]);
        $user->forceFill(['telephone_verifie_le' => now()])->save();

        $token = $user->createToken($request->validated('appareil') ?? 'web')->plainTextToken;

        return response()->json([
            'token' => $token,
            'nouveau_compte' => $user->wasRecentlyCreated,
            'utilisateur' => UtilisateurResource::make($user->load(['ville', 'quartier'])),
        ], $user->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * POST /api/auth/inscription — crée le compte avec son mot de passe. Le code reçu prouve
     * le numéro ; un compte créé par code seul (sans mot de passe) est complété.
     */
    public function inscrire(InscriptionRequest $request): JsonResponse
    {
        $telephone = $request->validated('telephone');
        $existant = User::where('telephone', $telephone)->first();

        if ($existant?->aUnMotDePasse()) {
            throw ValidationException::withMessages([
                'telephone' => 'Ce numéro a déjà un compte. Connectez-vous, ou touchez « Mot de passe oublié ».',
            ]);
        }

        $this->otp->verifier($telephone, $request->validated('code'));

        $user = $existant ?? new User(['telephone' => $telephone]);
        $user->fill($request->profil());
        $user->forceFill([
            'password' => $request->validated('mot_de_passe'),
            'telephone_verifie_le' => now(),
        ])->save();

        return $this->session($user, $request->validated('appareil'), 201);
    }

    /** POST /api/auth/connexion — numéro et mot de passe. */
    public function connecter(ConnexionRequest $request): JsonResponse
    {
        $user = User::where('telephone', $request->validated('telephone'))->first();

        if ($user && ! $user->aUnMotDePasse()) {
            throw ValidationException::withMessages([
                'mot_de_passe' => 'Ce compte n\'a pas encore de mot de passe. Touchez « Mot de passe oublié » pour en créer un.',
            ]);
        }

        if (! $user || ! Hash::check($request->validated('mot_de_passe'), $user->password)) {
            throw ValidationException::withMessages([
                'mot_de_passe' => 'Numéro ou mot de passe incorrect.',
            ]);
        }

        return $this->session($user, $request->validated('appareil'));
    }

    /**
     * POST /api/auth/mot-de-passe — « Mot de passe oublié » : le code reçu prouve le numéro,
     * le nouveau mot de passe remplace l'ancien et les autres sessions sont fermées.
     */
    public function reinitialiserMotDePasse(ReinitialiserMotDePasseRequest $request): JsonResponse
    {
        $telephone = $request->validated('telephone');
        $user = User::where('telephone', $telephone)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'telephone' => 'Aucun compte avec ce numéro. Créez votre compte.',
            ]);
        }

        $this->otp->verifier($telephone, $request->validated('code'));

        $user->forceFill([
            'password' => $request->validated('mot_de_passe'),
            'telephone_verifie_le' => now(),
        ])->save();
        $user->tokens()->delete();

        return $this->session($user, $request->validated('appareil'));
    }

    /** Ouvre une session sur cet appareil et renvoie le jeton avec le compte. */
    private function session(User $user, ?string $appareil, int $statut = 200): JsonResponse
    {
        return response()->json([
            'token' => $user->createToken($appareil ?? 'web')->plainTextToken,
            'utilisateur' => UtilisateurResource::make($user->load(['ville', 'quartier'])),
        ], $statut);
    }

    /** GET /api/moi */
    public function moi(Request $request): UtilisateurResource
    {
        return UtilisateurResource::make($request->user()->load(['ville', 'quartier']));
    }

    /** PATCH /api/moi — sert aussi à compléter le profil juste après l'inscription. */
    public function modifierProfil(ModifierProfilRequest $request): UtilisateurResource
    {
        $user = $request->user();
        $user->update($request->profil());

        return UtilisateurResource::make($user->load(['ville', 'quartier']));
    }

    /**
     * PUT /api/moi/photo — photo de profil, réduite sur l'appareil (JPEG, PNG ou WebP en data URL,
     * 300 Ko au plus). Gardée en base pour survivre aux redéploiements et suivre le compte partout.
     */
    public function modifierPhoto(Request $request): UtilisateurResource
    {
        $request->validate([
            'photo' => ['required', 'string', 'max:400000', 'regex:#^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$#'],
        ], [
            'photo.required' => 'Choisissez une photo.',
            'photo.max' => 'Cette photo est trop lourde.',
            'photo.regex' => 'Seules les photos JPEG, PNG ou WebP sont acceptées.',
        ]);

        $user = $request->user();
        $user->update(['photo' => $request->input('photo')]);

        return UtilisateurResource::make($user->load(['ville', 'quartier']));
    }

    /** DELETE /api/moi/photo — retire la photo ; les initiales reviennent. */
    public function supprimerPhoto(Request $request): UtilisateurResource
    {
        $user = $request->user();
        $user->update(['photo' => null]);

        return UtilisateurResource::make($user->load(['ville', 'quartier']));
    }

    /** POST /api/auth/deconnexion — ferme seulement la session de cet appareil. */
    public function deconnexion(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Vous êtes déconnecté.']);
    }
}
