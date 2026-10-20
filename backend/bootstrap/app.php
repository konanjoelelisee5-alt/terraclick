<?php

use App\Exceptions\EnvoiCodeImpossible;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // En ligne, l'API est derrière le proxy de Render, qui termine le HTTPS : sans cette
        // confiance, les adresses générées (photos, pagination) partiraient en http://.
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Le frontend ouvre la feuille de connexion sur un 401.
        $exceptions->render(fn (AuthenticationException $e, Request $request) => $request->is('api/*')
            ? response()->json(['message' => 'Connectez-vous pour continuer.'], 401)
            : null);

        // Le détail (fournisseur, configuration) part dans les logs ; l'utilisateur reçoit un message simple.
        $exceptions->render(fn (EnvoiCodeImpossible $e) => response()->json([
            'message' => 'Impossible d\'envoyer le code pour le moment. Réessayez dans quelques instants.',
        ], 503));

        // Ne pas exposer les noms de classes internes (« No query results for model… »).
        $exceptions->render(fn (NotFoundHttpException $e, Request $request) => $request->is('api/*')
            && ($e->getPrevious() instanceof ModelNotFoundException || $e->getMessage() === '')
            ? response()->json(['message' => 'Ressource introuvable.'], 404)
            : null);
    })->create();
