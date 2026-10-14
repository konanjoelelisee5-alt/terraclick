# Servis Yakro — API

API Laravel 13 de Servis Yakro. Elle sert le frontend React de `../frontend`.

## Démarrer

Prérequis : PHP 8.3 ou plus récent, Composer, et MySQL ou MariaDB (celui de XAMPP convient).

```bash
composer install
cp .env.example .env && php artisan key:generate
# créer les bases servis_yakro_v2 (application) et servis_yakro_v2_test (tests), en utf8mb4
php artisan migrate --seed
composer serve        # http://127.0.0.1:8000
composer test
```

> **Chemin contenant un accent.** Sous Windows, `php artisan serve` et `php artisan test`
> échouent quand le chemin du projet contient un caractère accentué (« Elisée ») : ces commandes
> relancent PHP dans un sous-processus, qui reçoit le chemin mal encodé. `composer serve` et
> `composer test` lancent PHP directement et ne sont pas concernés.

En développement, les codes de connexion ne sont pas envoyés : ils sont écrits dans
`storage/logs/laravel.log`. Le `.env` local contient deux réglages en plus :

- `OTP_CODE_FIXE=417802` : le code est toujours le même, celui que l'écran de démonstration
  remplit tout seul. Ce réglage n'est pris en compte qu'en environnement `local`.
- `OTP_ENVOIS_PAR_MINUTE` et `OTP_ENVOIS_PAR_HEURE` : des limites plus larges, pour que les
  tests de parcours puissent se reconnecter plusieurs fois de suite.

Compte de démonstration : **07 58 42 19 03** (Aya Konan, Habitat).

## Routes

Toutes les routes sont préfixées par `/api` et répondent en JSON. Les routes marquées 🔒
attendent l'en-tête `Authorization: Bearer <token>`.

| Méthode | Route | Rôle |
| --- | --- | --- |
| POST | `/auth/code` | Envoie un code. Corps : `telephone`, `canal` (`sms` ou `whatsapp`) |
| POST | `/auth/verifier` | Vérifie le code et renvoie un `token`. Crée le compte si le numéro est inconnu |
| POST | `/auth/deconnexion` 🔒 | Révoque le jeton de cet appareil |
| GET | `/moi` 🔒 | Profil de l'utilisateur connecté |
| PATCH | `/moi` 🔒 | Modifie `nom` et `quartier_id`. Le nom est obligatoire si le profil n'a jamais été rempli |
| GET | `/villes` | Villes couvertes et leurs quartiers |
| GET | `/departements` | Méga-menu : départements, rubriques et catégories, avec le nombre de prestataires |
| GET | `/prestataires` | Recherche (voir les filtres ci-dessous), paginée |
| GET | `/prestataires/vedettes` | Prestataires à la une |
| GET | `/prestataires/{id}` | Fiche professionnelle. Le téléphone n'apparaît que pour un utilisateur connecté |
| GET | `/prestataires/{id}/avis` | Avis, paginés |
| POST | `/prestataires/{id}/avis` 🔒 | Publie un avis. Corps : `ponctualite`, `qualite`, `prix` (de 1 à 5), `commentaire` |

**Filtres de `/prestataires`** :

- `q` : texte libre, sans tenir compte des accents ;
- `categorie`, `departement`, `ville` : slugs ;
- `quartier` : identifiant ;
- `lat`, `lng` et `rayon_km` : « Autour de moi » ;
- `tri` : `pertinence`, `note`, `avis`, `distance` ou `reponse` ;
- `par_page` : 50 au plus.

**Comportement de l'authentification** :

- un code est valable 10 minutes ;
- on a droit à 5 essais par code ;
- un nouveau code annule le précédent ;
- au plus 1 envoi par minute et 5 par heure pour un même numéro.

Les numéros sont acceptés sous toutes les formes (`07 58 42 19 03`, `+225…`, `00225…`) et
stockés au format `+2250758421903`.

## Organisation

```
app/
  Contracts/EnvoiCode.php        interface d'envoi des codes (SMS, WhatsApp)
  Services/OtpService.php        émission et vérification des codes
  Services/EnvoiCode/            implémentations : LogEnvoiCode pour le développement
  Support/                       Telephone (numéros ivoiriens), Montant (F CFA, délais)
  Http/Controllers/              Auth, Annuaire, Prestataire, Avis
  Http/Requests/                 validation, messages en français
  Http/Resources/                format JSON renvoyé au frontend
database/seeders/                catalogue réel, plus prestataires et comptes de démonstration
```

**Brancher un vrai fournisseur SMS ou WhatsApp** : écrire une classe qui implémente
`App\Contracts\EnvoiCode`, l'ajouter au `match` de `AppServiceProvider::register()` et
renseigner `OTP_DRIVER` dans le `.env`.

## Reste à trancher

- **Avis** : le frontend veut qu'un avis ne soit publié qu'après réception confirmée de la
  prestation. Ce module n'existe pas encore. Pour l'instant, tout compte au profil complet
  peut noter un prestataire, une seule fois.
- **Durée de session** : les jetons n'expirent pas (`SANCTUM_EXPIRATION`). C'est l'un des
  points laissés ouverts par la conception.
