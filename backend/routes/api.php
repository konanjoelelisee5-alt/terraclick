<?php

use App\Http\Controllers\ActualiteController;
use App\Http\Controllers\AnnuaireController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AvisController;
use App\Http\Controllers\BesoinController;
use App\Http\Controllers\DemandeController;
use App\Http\Controllers\PrestataireController;
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
    Route::get('demandes/{demande}', [DemandeController::class, 'show'])->whereNumber('demande');
});

// Assistant de besoin, en accès libre jusqu'à la confirmation
Route::get('actualites', [ActualiteController::class, 'index']);
Route::post('recherches', [RechercheController::class, 'store'])->middleware('throttle:60,1');
Route::get('secteurs', [BesoinController::class, 'secteurs']);
Route::get('analyse', [BesoinController::class, 'analyse']);
Route::get('recommandations', [BesoinController::class, 'recommandations']);

// Annuaire, en accès libre
Route::get('villes', [AnnuaireController::class, 'villes']);
Route::get('departements', [AnnuaireController::class, 'departements']);
Route::get('prestataires', [PrestataireController::class, 'index']);
Route::get('prestataires/vedettes', [PrestataireController::class, 'vedettes']);
Route::get('prestataires/{prestataire}', [PrestataireController::class, 'show'])->whereNumber('prestataire');
Route::get('prestataires/{prestataire}/avis', [AvisController::class, 'index'])->whereNumber('prestataire');
