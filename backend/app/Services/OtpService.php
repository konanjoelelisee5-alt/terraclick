<?php

namespace App\Services;

use App\Contracts\EnvoiCode;
use App\Models\OtpCode;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/** Émission et vérification des codes à usage unique. */
class OtpService
{
    public function __construct(private EnvoiCode $envoi) {}

    /** Émet un nouveau code ; les codes précédents de ce numéro deviennent inutilisables. */
    public function emettre(string $telephone, string $canal): OtpCode
    {
        $code = $this->genererCode();

        $otp = DB::transaction(function () use ($telephone, $canal, $code) {
            OtpCode::where('telephone', $telephone)->valides()->update(['expire_le' => now()]);

            return OtpCode::create([
                'telephone' => $telephone,
                'canal' => $canal,
                'code_hash' => Hash::make($code),
                'expire_le' => now()->addMinutes(config('otp.duree_minutes')),
            ]);
        });

        $this->envoi->envoyer($telephone, $code, $canal);

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
