<?php

use App\Http\Controllers\AccordController;
use App\Http\Controllers\ActualiteController;
use App\Http\Controllers\AdminCandidatureController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminDemandeController;
use App\Http\Controllers\AdminPrestataireController;
use App\Http\Controllers\AdminRoleController;
use App\Http\Controllers\AdminSecteurController;
use App\Http\Controllers\AdminZoneController;
use App\Http\Controllers\AdresseController;
use App\Http\Controllers\AnnuaireController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AvisController;
use App\Http\Controllers\BesoinController;
use App\Http\Controllers\CandidatureController;
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
    Route::post('demandes', [DemandeController::class, 'store'])->middleware('permission:demandes.envoyer');
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

    // « Devenir prestataire » : le dossier envoyé pour vérification, et son suivi.
    Route::get('moi/candidature', [CandidatureController::class, 'moi']);
    Route::post('moi/candidature', [CandidatureController::class, 'store'])->middleware('throttle:10,1');

    // Espace administrateur : vue d'ensemble, signalements, demandes, prestataires, utilisateurs, catalogue.
    // Espace administrateur et manager : chaque module s'ouvre à sa permission (config/acces.php),
    // et les policies vérifient chaque action objet par objet.
    Route::prefix('admin')->middleware('permission:admin.acceder')->group(function () {
        Route::get('apercu', [AdminController::class, 'apercu'])->middleware('permission:admin.apercu');
        Route::get('activite', [AdminController::class, 'activite'])->middleware('permission:admin.activite');
        Route::get('signalements', [AdminController::class, 'signalements'])->middleware('permission:signalements.voir');
        Route::post('signalements/{signalement}/traiter', [AdminController::class, 'traiterSignalement'])->whereNumber('signalement');
        Route::get('demandes', [AdminController::class, 'demandes'])->middleware('permission:demandes.voir_toutes');
        Route::get('demandes/{demande}', [AdminController::class, 'demande'])->whereNumber('demande')->middleware('permission:demandes.voir_toutes');
        Route::prefix('demandes/{demande}')->whereNumber('demande')->group(function () {
            Route::middleware('permission:demandes.gerer')->group(function () {
                Route::get('candidats', [AdminDemandeController::class, 'candidats']);
                Route::post('attribuer', [AdminDemandeController::class, 'attribuer']);
                Route::post('relancer', [AdminDemandeController::class, 'relancer']);
                Route::post('annuler', [AdminDemandeController::class, 'annuler']);
            });
            Route::post('litige', [AdminDemandeController::class, 'litige'])->middleware('permission:litiges.resoudre');
        });
        Route::get('prestataires', [AdminController::class, 'prestataires'])->middleware('permission:prestataires.voir');
        Route::patch('prestataires/{prestataire}', [AdminController::class, 'modifierPrestataire'])->whereNumber('prestataire');
        Route::prefix('prestataires/{prestataire}')->whereNumber('prestataire')->middleware('permission:prestataires.voir')->group(function () {
            Route::get('/', [AdminPrestataireController::class, 'show']);
            Route::get('documents/{document}', [AdminPrestataireController::class, 'document'])->whereNumber('document');
            Route::patch('documents/{document}', [AdminPrestataireController::class, 'verifierDocument'])->whereNumber('document');
            Route::put('secteurs', [AdminPrestataireController::class, 'secteurs']);
            Route::post('statut', [AdminPrestataireController::class, 'statut']);
            Route::post('sanctions', [AdminPrestataireController::class, 'sanctionner']);
        });
        Route::get('utilisateurs', [AdminController::class, 'utilisateurs'])->middleware('permission:utilisateurs.voir');
        Route::patch('utilisateurs/{user}', [AdminController::class, 'modifierUtilisateur'])->whereNumber('user');
        Route::get('prestations', [AdminController::class, 'prestations']);
        Route::patch('prestations/{prestation}', [AdminController::class, 'modifierPrestation'])->whereNumber('prestation')->middleware('permission:catalogue.prix');
        Route::get('secteurs', [AdminSecteurController::class, 'index'])->middleware('permission:secteurs.voir');
        Route::middleware('permission:secteurs.gerer')->group(function () {
            Route::post('secteurs', [AdminSecteurController::class, 'store']);
            Route::put('secteurs/ordre', [AdminSecteurController::class, 'ordonner']);
            Route::patch('secteurs/{secteur}', [AdminSecteurController::class, 'update'])->whereNumber('secteur');
            Route::post('secteurs/{secteur}/prestations', [AdminSecteurController::class, 'ajouterPrestation'])->whereNumber('secteur');
            Route::patch('sous-services/{prestation}', [AdminSecteurController::class, 'modifierPrestation'])->whereNumber('prestation');
        });
        Route::get('zones', [AdminZoneController::class, 'index'])->middleware('permission:zones.voir');
        Route::middleware('permission:zones.gerer')->group(function () {
            Route::post('zones', [AdminZoneController::class, 'store']);
            Route::patch('zones/{quartier}', [AdminZoneController::class, 'update'])->whereNumber('quartier');
        });
        Route::put('prestataires/{prestataire}/zones', [AdminZoneController::class, 'zonesPrestataire'])->whereNumber('prestataire')->middleware('permission:prestataires.voir');
        Route::get('roles', [AdminRoleController::class, 'index'])->middleware('permission:roles.gerer');
        Route::put('roles/{role}', [AdminRoleController::class, 'update'])->whereNumber('role');

        Route::prefix('candidatures')->middleware('permission:candidatures.voir')->group(function () {
            Route::get('/', [AdminCandidatureController::class, 'index']);
            Route::get('{candidature}', [AdminCandidatureController::class, 'show'])->whereNumber('candidature');
            Route::get('{candidature}/documents/{type}', [AdminCandidatureController::class, 'document'])->whereNumber('candidature');
            Route::post('{candidature}/valider', [AdminCandidatureController::class, 'valider'])->whereNumber('candidature');
            Route::post('{candidature}/refuser', [AdminCandidatureController::class, 'refuser'])->whereNumber('candidature');
            Route::post('{candidature}/rejeter', [AdminCandidatureController::class, 'rejeter'])->whereNumber('candidature');
        });
    });

    // Espace technicien : demandes reçues par la fiche reliée au compte.
    Route::prefix('pro/demandes')->middleware('permission:pro.demandes')->group(function () {
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
Route::get('candidature/exigences', [CandidatureController::class, 'exigences']);

// Annuaire, en accès libre
Route::get('villes', [AnnuaireController::class, 'villes']);
Route::get('departements', [AnnuaireController::class, 'departements']);
Route::get('prestataires', [PrestataireController::class, 'index']);
Route::get('prestataires/vedettes', [PrestataireController::class, 'vedettes']);
Route::get('prestataires/{prestataire}', [PrestataireController::class, 'show'])->whereNumber('prestataire');
Route::get('prestataires/{prestataire}/avis', [AvisController::class, 'index'])->whereNumber('prestataire');
