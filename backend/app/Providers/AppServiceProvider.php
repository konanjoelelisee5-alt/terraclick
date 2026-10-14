<?php

namespace App\Providers;

use App\Contracts\EnvoiCode;
use App\Services\EnvoiCode\LogEnvoiCode;
use App\Support\Telephone;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use InvalidArgumentException;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(EnvoiCode::class, fn () => match (config('otp.driver')) {
            'log' => new LogEnvoiCode,
            default => throw new InvalidArgumentException('OTP_DRIVER inconnu : '.config('otp.driver')),
        });
    }

    public function boot(): void
    {
        // Chaque code envoyé coûte un SMS : on freine par numéro et par adresse IP.
        RateLimiter::for('otp-envoi', function (Request $request) {
            $telephone = Telephone::normaliser($request->input('telephone')) ?? 'invalide';

            return [
                Limit::perMinute(config('otp.envois_par_minute'))->by('otp-min:'.$telephone)
                    ->response(fn () => $this->tropDeDemandes('Patientez une minute avant de redemander un code.')),
                Limit::perHour(config('otp.envois_par_heure'))->by('otp-heure:'.$telephone)
                    ->response(fn () => $this->tropDeDemandes('Trop de codes demandés pour ce numéro. Réessayez dans une heure.')),
                Limit::perMinute(10)->by('otp-ip:'.$request->ip())
                    ->response(fn () => $this->tropDeDemandes('Trop de demandes depuis cette connexion. Patientez une minute.')),
            ];
        });

        RateLimiter::for('otp-verification', fn (Request $request) => Limit::perMinute(10)->by('otp-verif:'.$request->ip())
            ->response(fn () => $this->tropDeDemandes('Trop d\'essais. Patientez une minute.')));
    }

    private function tropDeDemandes(string $message): JsonResponse
    {
        return response()->json(['message' => $message], 429);
    }
}
