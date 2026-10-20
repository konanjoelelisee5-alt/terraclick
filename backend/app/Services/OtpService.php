<?php

namespace App\Services;

use App\Exceptions\EnvoiCodeImpossible;
use App\Models\OtpCode;
use App\Services\EnvoiCode\RouteurEnvoiCode;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/** Émission et vérification des codes à usage unique. */
class OtpService
{
    public function __construct(private RouteurEnvoiCode $envoi) {}

    /**
     * Émet un nouveau code ; les codes précédents de ce numéro deviennent inutilisables.
     * Le canal enregistré est celui par lequel le code est réellement parti.
     *
     * @throws EnvoiCodeImpossible aucun canal n'a pu le transmettre ; le code est alors annulé
     */
    public function emettre(string $telephone, string $canal): OtpCode
    {
        $test = $this->estNumeroTest($telephone);

        // En ligne sans fournisseur réel (phase de test) : un numéro non autorisé l'apprend
        // clairement, au lieu d'un « service indisponible » trompeur.
        if (! $test && app()->isProduction() && config("otp.canaux.{$canal}") === 'log') {
            throw ValidationException::withMessages([
                'telephone' => 'TerraClick est en phase de test : seuls les numéros autorisés peuvent se connecter pour le moment.',
            ]);
        }

        $code = $test ? (string) config('otp.code_test') : $this->genererCode();

        $otp = DB::transaction(function () use ($telephone, $canal, $code) {
            OtpCode::where('telephone', $telephone)->valides()->update(['expire_le' => now()]);

            return OtpCode::create([
                'telephone' => $telephone,
                'canal' => $canal,
                'code_hash' => Hash::make($code),
                'expire_le' => now()->addMinutes(config('otp.duree_minutes')),
            ]);
        });

        // Numéro de test : le testeur connaît le code, rien n'est envoyé.
        if ($test) {
            return $otp;
        }

        try {
            $canalUtilise = $this->envoi->envoyer($telephone, $code, $canal);
        } catch (EnvoiCodeImpossible $e) {
            $otp->update(['expire_le' => now()]);
            throw $e;
        }

        if ($canalUtilise !== $canal) {
            $otp->update(['canal' => $canalUtilise]);
        }

        return $otp;
    }

    /**
     * Consomme le code s'il est bon.
     *
     * @throws ValidationException code absent, expiré, faux ou trop d'essais
     */
    public function verifier(string $telephone, string $code): void
    {
        $max = config('otp.tentatives_max');

        // Le message d'erreur est calculé dans la transaction, mais l'exception est levée
        // après : lever dedans annulerait l'incrément du compteur d'essais.
        $erreur = DB::transaction(function () use ($telephone, $code, $max) {
            $otp = OtpCode::where('telephone', $telephone)->valides()->latest('id')->lockForUpdate()->first();

            if (! $otp || $otp->tentatives >= $max) {
                return 'Ce code a expiré. Demandez-en un nouveau.';
            }

            if (! Hash::check($code, $otp->code_hash)) {
                $otp->increment('tentatives');
                $restants = $max - $otp->tentatives;

                return $restants > 0
                    ? "Code incorrect. Il vous reste {$restants} essai".($restants > 1 ? 's' : '').'.'
                    : 'Code incorrect. Demandez-en un nouveau.';
            }

            $otp->update(['utilise_le' => now()]);

            return null;
        });

        if ($erreur) {
            throw ValidationException::withMessages(['code' => $erreur]);
        }
    }

    /** Numéro listé dans OTP_NUMEROS_TEST (comparé sur ses 10 derniers chiffres), avec un code de test défini. */
    private function estNumeroTest(string $telephone): bool
    {
        if (! config('otp.code_test')) {
            return false;
        }
        $chiffres = fn (string $n) => substr(preg_replace('/\D/', '', $n), -10);

        return collect(config('otp.numeros_test'))->contains(fn (string $n) => $chiffres($n) === $chiffres($telephone));
    }

    private function genererCode(): string
    {
        $fixe = config('otp.code_fixe');
        if ($fixe && app()->environment('local', 'testing')) {
            return (string) $fixe;
        }

        $longueur = config('otp.longueur');

        return str_pad((string) random_int(0, 10 ** $longueur - 1), $longueur, '0', STR_PAD_LEFT);
    }
}
