<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\DemanderCodeRequest;
use App\Http\Requests\Auth\ModifierProfilRequest;
use App\Http\Requests\Auth\VerifierCodeRequest;
use App\Http\Resources\UtilisateurResource;
use App\Models\User;
use App\Services\OtpService;
use App\Support\Telephone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Un seul parcours pour l'inscription et la connexion : le numéro est vérifié
 * par code, puis le système crée le compte s'il n'existe pas encore.
 */
class AuthController extends Controller
{
    public function __construct(private OtpService $otp) {}

    /** POST /api/auth/code */
    public function demanderCode(DemanderCodeRequest $request): JsonResponse
    {
        $telephone = $request->validated('telephone');
        $canal = $request->validated('canal');

        $this->otp->emettre($telephone, $canal);

        // La réponse ne dit pas si le numéro est connu : on ne le révèle qu'au porteur du code.
        return response()->json([
            'message' => 'Code envoyé par '.($canal === 'whatsapp' ? 'WhatsApp' : 'SMS').' au '.Telephone::affichage($telephone).'.',
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
            'utilisateur' => UtilisateurResource::make($user->load('quartier')),
        ], $user->wasRecentlyCreated ? 201 : 200);
    }

    /** GET /api/moi */
    public function moi(Request $request): UtilisateurResource
    {
        return UtilisateurResource::make($request->user()->load('quartier'));
    }

    /** PATCH /api/moi — sert aussi à compléter le profil juste après l'inscription. */
    public function modifierProfil(ModifierProfilRequest $request): UtilisateurResource
    {
        $user = $request->user();
        $user->update($request->validated());

        return UtilisateurResource::make($user->load('quartier'));
    }

    /** POST /api/auth/deconnexion — ferme seulement la session de cet appareil. */
    public function deconnexion(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Vous êtes déconnecté.']);
    }
}
