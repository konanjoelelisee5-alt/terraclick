<?php

use App\Http\Controllers\AccordController;
use App\Http\Controllers\ActualiteController;
use App\Http\Controllers\AdresseController;
use App\Http\Controllers\AnnuaireController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AvisController;
use App\Http\Controllers\BesoinController;
use App\Http\Controllers\DemandeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PrestataireController;
use App\Http\Controllers\ProDemandeController;
use App\Http\Controllers\RechercheController;
use Illuminate\Support\Facades\Route;

/*
| Chercher et consulter restent libres ; seules les actions demandent un compte.
*/

// Comptes : inscription et connexion avec mot de passe, code pour prouver le numéro
Route::prefix('auth')->group(function () {
    Route::post('code', [AuthController::class, 'demanderCode'])->middleware('throttle:otp-envoi');
    Route::post('verifier', [AuthController::class, 'verifierCode'])->middleware('throttle:otp-verification');
    Route::post('inscription', [AuthController::class, 'inscrire'])->middleware('throttle:otp-verification');
    Route::post('connexion', [AuthController::class, 'connecter'])->middleware('throttle:connexion');
    Route::post('mot-de-passe', [AuthController::class, 'reinitialiserMotDePasse'])->middleware('throttle:otp-verification');
    Route::post('deconnexion', [AuthController::class, 'deconnexion'])->middleware('auth:sanctum');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('moi', [AuthController::class, 'moi']);
    Route::patch('moi', [AuthController::class, 'modifierProfil']);
    Route::put('moi/photo', [AuthController::class, 'modifierPhoto']);
    Route::delete('moi/photo', [AuthController::class, 'supprimerPhoto']);
    Route::get('moi/recherches', [RechercheController::class, 'index']);
    Route::delete('moi/recherches', [RechercheController::class, 'effacer']);
    Route::post('prestataires/{prestataire}/avis', [AvisController::class, 'store']);
    Route::post('demandes', [DemandeController::class, 'store']);
    // Onglets : relations abouties, confirmées par le client.
    Route::get('accords', [AccordController::class, 'index']);
    Route::post('accords', [AccordController::class, 'store']);
    Route::get('accords/{accord}', [AccordController::class, 'show'])->whereNumber('accord');
    Route::post('accords/{accord}/terminer', [AccordController::class, 'terminer'])->whereNumber('accord');

    Route::get('demandes', [DemandeController::class, 'index']);
    Route::get('demandes/{demande}', [DemandeController::class, 'show'])->whereNumber('demande');
    Route::post('demandes/{demande}/annuler', [DemandeController::class, 'annuler'])->whereNumber('demande');
    Route::post('demandes/{demande}/confirmer', [DemandeController::class, 'confirmer'])->whereNumber('demande');
    Route::post('demandes/{demande}/signalements', [DemandeController::class, 'signaler'])->whereNumber('demande');

    // Cloche : réponses des prestataires et étapes des commandes.
    Route::get('notifications', NotificationController::class);

    // Adresses enregistrées : domicile, bureau ou autre lieu.
    Route::get('moi/adresses', [AdresseController::class, 'index']);
    Route::post('moi/adresses', [AdresseController::class, 'store']);
    Route::delete('moi/adresses/{adresse}', [AdresseController::class, 'destroy'])->whereNumber('adresse');

    // Espace technicien : demandes reçues par la fiche reliée au compte.
    Route::prefix('pro/demandes')->group(function () {
        Route::get('/', [ProDemandeController::class, 'index']);
        Route::get('{demande}', [ProDemandeController::class, 'show'])->whereNumber('demande');
        foreach (['accepter', 'refuser', 'demarrer', 'terminer', 'etape'] as $action) {
            Route::post("{demande}/{$action}", [ProDemandeController::class, $action])->whereNumber('demande');
        }
    });
});

// Assistant de besoin, en accès libre jusqu'à la confirmation
Route::get('actualites', [ActualiteController::class, 'index']);
Route::post('recherches', [RechercheController::class, 'store'])->middleware('throttle:60,1');
Route::get('secteurs', [BesoinController::class, 'secteurs']);
Route::get('analyse', [BesoinController::class, 'analyse']);
Route::get('recommandations', [BesoinController::class, 'recommandations']);
Route::get('pressing/articles', [BesoinController::class, 'articlesPressing']);
Route::get('pressing/options', [BesoinController::class, 'optionsPressing']);

// Annuaire, en accès libre
Route::get('villes', [AnnuaireController::class, 'villes']);
Route::get('departements', [AnnuaireController::class, 'departements']);
Route::get('prestataires', [PrestataireController::class, 'index']);
Route::get('prestataires/vedettes', [PrestataireController::class, 'vedettes']);
Route::get('prestataires/{prestataire}', [PrestataireController::class, 'show'])->whereNumber('prestataire');
Route::get('prestataires/{prestataire}/avis', [AvisController::class, 'index'])->whereNumber('prestataire');
