# Mettre TerraClick en ligne sur Render

Ce guide aboutit à deux adresses publiques :

- **l'application** (PWA installable) : `https://terraclick.onrender.com` ;
- **l'API** : `https://terraclick-api.onrender.com`.

Le fichier `render.yaml`, à la racine du dépôt, décrit les deux services. Render les crée
d'un coup à partir de ce fichier. La base de données MySQL est hébergée à part, chez Aiven.

Comptez environ 30 minutes la première fois.

## 1. Mettre le code sur GitHub

Render déploie depuis un dépôt Git.

1. Créez un dépôt **privé** sur github.com, par exemple `terraclick`.
2. Dans le dossier du projet, envoyez le code :

   ```bash
   git add -A
   git commit -m "Préparation du déploiement Render"
   git remote add origin https://github.com/<votre-compte>/terraclick.git
   git push -u origin main
   ```

Les fichiers `.env` du backend et `frontend/.env.local` ne partent pas : ils sont ignorés
par Git. Vérifiez-le avec `git status` avant d'envoyer.

## 2. Créer la base MySQL (Aiven, offre gratuite)

1. Créez un compte sur aiven.io, puis un service **MySQL**, en offre *Free*.
2. Dans la page du service, notez :
   - **Host** et **Port** ;
   - **User** (souvent `avnadmin`) et **Password** ;
   - **Database name** (`defaultdb`).
3. Téléchargez le **CA certificate** (fichier `ca.pem`). Vous collerez son contenu, du
   `-----BEGIN CERTIFICATE-----` au `-----END CERTIFICATE-----` compris, dans Render.

Toute autre base MySQL accessible en ligne convient aussi.

## 3. Préparer deux valeurs

- **La clé de l'application** : générez-la sur votre poste, puis copiez la ligne affichée
  (`base64:…`).

  ```bash
  cd backend
  php artisan key:generate --show
  ```

- **Le mode test de connexion**. Aucun SMS ni message WhatsApp n'est encore branché :
  - choisissez les numéros des testeurs, par exemple `0758421903,0701020304` ;
  - choisissez un code à 6 chiffres que vous leur donnerez, par exemple `246810`.

  Seuls ces numéros pourront se connecter, avec ce code. Ne le diffusez qu'aux testeurs.

## 4. Créer les services sur Render

1. Sur render.com : **New → Blueprint**, puis choisissez le dépôt GitHub.
2. Render lit `render.yaml` et demande les valeurs marquées « à saisir » :

| Variable | Valeur |
| --- | --- |
| `APP_KEY` | la clé `base64:…` de l'étape 3 |
| `APP_URL` | `https://terraclick-api.onrender.com` |
| `FRONTEND_URL` | `https://terraclick.onrender.com` |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | les valeurs d'Aiven |
| `MYSQL_SSL_CA_PEM` | le contenu de `ca.pem` |
| `OTP_NUMEROS_TEST` | les numéros des testeurs, séparés par des virgules |
| `OTP_CODE_TEST` | le code à 6 chiffres choisi |
| `VITE_API_URL` | `https://terraclick-api.onrender.com/api` |

3. Validez. Render construit l'API (environ 5 minutes la première fois) et l'interface.

   Au démarrage, l'API crée les tables et charge le catalogue ainsi que les prestataires
   de démonstration (`SEED_ON_DEPLOY=true`).

**Si Render donne d'autres adresses** que celles ci-dessus (nom déjà pris) : corrigez
`APP_URL`, `FRONTEND_URL` et `VITE_API_URL`, puis relancez le déploiement des deux services
(**Manual Deploy → Deploy latest commit**). `VITE_API_URL` est lue au moment de la
construction de l'interface : tout changement demande un nouveau déploiement de
l'interface.

## 5. Vérifier

- `https://terraclick-api.onrender.com/up` doit afficher une page verte.
- `https://terraclick-api.onrender.com/api/secteurs` doit lister les 5 services.
- Ouvrez `https://terraclick.onrender.com` sur un téléphone, puis connectez-vous avec un
  numéro de test et le code de test.
- **Installer l'application** :
  - Android, avec Chrome : menu ⋮ → « Installer l'application » ;
  - iPhone, avec Safari : Partager → « Sur l'écran d'accueil » ;
  - ordinateur, avec Chrome ou Edge : icône d'installation dans la barre d'adresse.

## Limites de l'offre gratuite

- **Mise en veille** : l'API s'endort après 15 minutes sans visite. La première ouverture
  qui suit prend environ une minute.
- **Photos jointes** : les photos des demandes sont effacées à chaque redéploiement. Il faudra
  un disque Render payant ou un stockage externe (S3, Cloudinary) avant un usage réel.
- **Connexion** : seuls les numéros de test peuvent se connecter. Pour ouvrir à tous, il
  faut brancher WhatsApp Cloud API (voir `backend/README.md`) ou un fournisseur SMS, puis
  vider `OTP_NUMEROS_TEST` et `OTP_CODE_TEST`.
