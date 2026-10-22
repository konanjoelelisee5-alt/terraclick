<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ouvre une route aux seuls comptes qui ont la permission demandée (config/acces.php) :
 * `->middleware('permission:admin.acceder')`, ou plusieurs, toutes exigées :
 * `permission:candidatures.voir,candidatures.traiter`.
 */
class VerifierPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();
        abort_unless($user !== null, 401, 'Connectez-vous pour continuer.');

        foreach ($permissions as $permission) {
            abort_unless($user->peut($permission), 403, 'Votre compte n\'a pas accès à cette partie de TerraClick.');
        }

        return $next($request);
    }
}
