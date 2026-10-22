<?php

namespace App\Providers;

use App\Contracts\EnvoiCode;
use App\Models\User;
use App\Services\EnvoiCode\LogEnvoiCode;
use App\Services\EnvoiCode\RouteurEnvoiCode;
use App\Services\EnvoiCode\WhatsAppCloudEnvoiCode;
use App\Support\Telephone;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use InvalidArgumentException;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(RouteurEnvoiCode::class, fn () => new RouteurEnvoiCode(
            [
                'sms' => $this->envoiCode(config('otp.canaux.sms'), 'sms'),
                'whatsapp' => $this->envoiCode(config('otp.canaux.whatsapp'), 'whatsapp'),
            ],
            config('otp.repli_sms'),
        ));
    }

    /** Fournisseur d'envoi désigné par OTP_SMS_DRIVER ou OTP_WHATSAPP_DRIVER. */
    private function envoiCode(string $fournisseur, string $canal): EnvoiCode
    {
        return match ($fournisseur) {
            'log' => new LogEnvoiCode,
            'whatsapp_cloud' => new WhatsAppCloudEnvoiCode(
                config('services.whatsapp.token'),
                config('services.whatsapp.phone_number_id'),
                config('services.whatsapp.modele_code'),
                config('services.whatsapp.langue'),
                config('services.whatsapp.version'),
            ),
            default => throw new InvalidArgumentException("Fournisseur d'envoi inconnu pour le canal {$canal} : {$fournisseur}"),
        };
    }

    public function boot(): void
    {
        // Chaque permission de config/acces.php est aussi une capacité : @can, Gate::allows(…).
        foreach (config('acces.permissions') as $permissions) {
            foreach (array_keys($permissions) as $permission) {
                Gate::define($permission, fn (User $user) => $user->peut($permission));
            }
        }

        // Chaque code envoyé coûte un SMS : on freine par numéro et par adresse IP.
        RateLimiter::for('otp-envoi', function (Request $request) {
            $telephone = Telephone::normaliser($request->input('telephone')) ?? 'invalide';

            return [
                Limit::perMinute(config('otp.envois_par_minute'))->by('otp-min:'.$telephone)
                    ->response(fn () => $this->tropDeDemandes('Patientez une minute avant de redemander un code.')),
                Limit::perHour(config('otp.envois_par_heure'))->by('otp-heure:'.$telephone)
                    ->response(fn () => $this->tropDeDemandes('Trop de codes demandés pour ce numéro. Réessayez dans une heure.')),
                Limit::perMinute(config('otp.envois_par_ip_minute'))->by('otp-ip:'.$request->ip())
                    ->response(fn () => $this->tropDeDemandes('Trop de demandes depuis cette connexion. Patientez une minute.')),
            ];
        });

        RateLimiter::for('otp-verification', fn (Request $request) => Limit::perMinute(config('otp.verifications_par_ip_minute'))->by('otp-verif:'.$request->ip())
            ->response(fn () => $this->tropDeDemandes('Trop d\'essais. Patientez une minute.')));

        // Mot de passe : on freine les essais en série, par numéro et par adresse IP.
        RateLimiter::for('connexion', function (Request $request) {
            $telephone = Telephone::normaliser($request->input('telephone')) ?? 'invalide';

            return [
                Limit::perMinute(10)->by('connexion-tel:'.$telephone)
                    ->response(fn () => $this->tropDeDemandes('Trop d\'essais pour ce numéro. Patientez une minute.')),
                Limit::perMinute(30)->by('connexion-ip:'.$request->ip())
                    ->response(fn () => $this->tropDeDemandes('Trop d\'essais. Patientez une minute.')),
            ];
        });
    }

    private function tropDeDemandes(string $message): JsonResponse
    {
        return response()->json(['message' => $message], 429);
    }
}
