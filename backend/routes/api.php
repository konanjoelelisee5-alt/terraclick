<?php

use App\Http\Controllers\AnnuaireController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AvisController;
use App\Http\Controllers\BesoinController;
use App\Http\Controllers\DemandeController;
use App\Http\Controllers\PrestataireController;
use Illuminate\Support\Facades\Route;

/*
| Chercher et consulter restent libres ; seules les actions demandent un compte.
*/

// Compte sans mot de passe
Route::prefix('auth')->group(function () {
    Route::post('code', [AuthController::class, 'demanderCode'])->middleware('throttle:otp-envoi');
    Route::post('verifier', [AuthController::class, 'verifierCode'])->middleware('throttle:otp-verification');
    Route::post('deconnexion', [AuthController::class, 'deconnexion'])->middleware('auth:sanctum');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('moi', [AuthController::class, 'moi']);
    Route::patch('moi', [AuthController::class, 'modifierProfil']);
    Route::put('moi/photo', [AuthController::class, 'modifierPhoto']);
    Route::delete('moi/photo', [AuthController::class, 'supprimerPhoto']);
    Route::post('prestataires/{prestataire}/avis', [AvisController::class, 'store']);
    Route::post('demandes', [DemandeController::class, 'store']);
    Route::get('demandes/{demande}', [DemandeController::class, 'show'])->whereNumber('demande');
});

// Assistant de besoin, en accès libre jusqu'à la confirmation
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
