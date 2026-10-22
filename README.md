# TerraClick

Place de marché de services locaux pour toute la Côte d'Ivoire, lancée à **Yamoussoukro**
puis ouverte aux autres villes du pays.

> **Ancien nom : Servis Yakro.** Le produit s'appelle désormais **TerraClick**. Le
> mot-symbole s'écrit « Terra » en noir et « Click » en orange (`--color-accent`), avec la
> même disposition de couleurs qu'avant. Seuls les textes visibles ont été renommés. Ces
> noms internes gardent « Servis Yakro » :
>
> - le design system vendorisé (`src/styles/ds/`, préfixe `sy-`) ;
> - la variante de thème `"Servis Yakro (officiel)"` ;
> - le dossier du dépôt ;
> - les bases `servis_yakro_v2` ;
> - les clés `sy.*` du stockage local.
>
> Les renommer est possible mais ferait perdre les sessions déjà ouvertes (`sy.jeton`).
Un citoyen décrit son besoin — une fuite, un maçon, un ordinateur, une maison à construire —
et l'application le relie à des prestataires vérifiés, jusqu'à la réception de la prestation.

Application web responsive, utilisée sur ordinateur comme sur Android (360–412 px).

## Mise en ligne

L'application est une **PWA installable** sur ordinateur et téléphone :
- `frontend/public/manifest.webmanifest` : manifeste ;
- `frontend/public/sw.js` : service worker, qui ne met jamais l'API en cache ;
- icônes générées depuis le logo, dans `frontend/public/icons/`.

Le déploiement sur Render (API en Docker, interface en site statique, MySQL chez Aiven) est
décrit dans [`docs/DEPLOIEMENT-RENDER.md`](docs/DEPLOIEMENT-RENDER.md) et dans `render.yaml`.
Tant qu'aucun fournisseur SMS ou WhatsApp n'est branché, seuls les numéros listés dans
`OTP_NUMEROS_TEST` reçoivent un code (le code `OTP_CODE_TEST`) : eux seuls peuvent s'inscrire
ou réinitialiser leur mot de passe. Un compte existant se connecte avec son mot de passe.

## Périmètre du MVP

La première version publique ne couvre que **six secteurs** :

- Plomberie
- Électricité
- Climatisation
- Serrurerie
- Menuiserie
- Pressing (catégorie `pressing`, rubrique Entretien)

**Pressing et pack** : le pressing se cherche comme les autres services (vocabulaire dans
`config/secteurs.php`, prestations et prix par pièce dans `PrestationSeeder`). En demandant un
pressing (bouton **« Composer mon pack »** de sa fiche, à la place de « Demander »), le client
ouvre une page dédiée (`screens/besoin/ComposerPack.tsx`) : catégories Vêtements, Tenues et
Linge de maison, articles en cartes avec − / +, barre fixe avec le total estimé et « Continuer ».
L'assistant mène à la même page quand on choisit le pressing. Les articles et leurs prix
indicatifs par pièce sont dans `config/pressing.php` (**à valider avec les pressings**) ;
l'API (`GET /api/pressing/articles`) les sert et recalcule toujours le total
(`Demande::composerPack`), quel que soit ce que l'application envoie.

**Rôles et permissions** (`config/acces.php`) : chaque interface s'ouvre à une permission.

- **Rôles de départ** :

  | Rôle | Interfaces |
  |---|---|
  | Client | espace client |
  | Prestataire | espace client et espace prestataire |
  | Manager | vérifications, signalements, demandes, prestataires (suspendre) et utilisateurs (voir) |
  | Administrateur | tout, y compris les rôles, les prix et la mise en avant |

  Chaque nouveau compte est client. Une candidature validée donne le rôle prestataire.
- **Comptes de l'équipe à part** (`roles_equipe` : manager, admin) :
  - un compte public (client, prestataire, inscrit lui-même) ne reçoit jamais un rôle de l'équipe, et l'inverse non plus (`UserPolicy`) ;
  - un rôle public ne reçoit pas les permissions de l'« Espace administrateur » (refus 422) ;
  - même écrites directement en base, ces permissions restent sans effet pour un compte public (`User::permissions()`) ;
  - l'inscription ne choisit pas de rôle et ne reprend jamais un compte de l'équipe.
- **Tableau de bord de l'équipe** (`CONFIG.espaceEquipe = "tableauDeBord"`, frontend/src/lib/config.ts) :
  - on y entre seulement en se connectant avec les identifiants de l'équipe, jamais par Paramètres ;
  - l'arrivée se fait sur le premier module permis, jamais sur la page de recherche du client ;
  - sur téléphone, un menu latéral remplace la navigation basse ; on sort par « Se déconnecter ».
  - `"application"` remet l'ancien comportement : entrée par Paramètres, navigation basse, « Quitter l'administration ».
- **Tables** : `roles`, `permissions`, `permission_role`, `role_user`. L'ancienne colonne `users.est_admin` est devenue le rôle administrateur.
- **Middleware** `permission:…` (`App\Http\Middleware\VerifierPermission`) sur les routes : espace administrateur et chacun de ses modules, espace prestataire (`pro.demandes`), envoi d'une demande (`demandes.envoyer`).
- **Policies** (`app/Policies`), action par action :
  - `DemandePolicy` : le client, le prestataire de la demande, l'équipe ; les autres reçoivent un 404 ;
  - `CandidaturePolicy` : pièces jointes et traitement ;
  - `SignalementPolicy` ;
  - `PrestatairePolicy` : suspendre, mettre en avant ;
  - `UserPolicy` : seul un administrateur donne le rôle administrateur, et personne ne se retire le sien ;
  - `RolePolicy` : le rôle administrateur ne se modifie pas.
- Chaque permission est aussi une capacité Laravel (`Gate::allows('signalements.traiter')`).
- **Base peuplée** par `RolesPermissionsSeeder`, lancé avec les référentiels, même en production. Il ajoute ce qui manque sans écraser les permissions changées depuis l'écran « Rôles et permissions ».
- **Comptes de démonstration**, mot de passe **terraclick2026** :

  | Rôle | Compte | Numéro |
  |---|---|---|
  | Administrateur | Équipe TerraClick | **07 01 01 01 01** |
  | Manager | Diane Koffi | **07 02 02 02 02** |
  | Prestataire | Koffi Tanoh | **07 07 07 07 07** |
  | Prestataire | gérant de Pressing Éclat | **07 08 08 08 08** |
  | Client | Aya | **07 58 42 19 03** |
- **Dans l'application**, `/api/moi` renvoie les rôles et les permissions du compte, et l'application n'affiche que le permis :
  - le nom « Administration » ou « Espace manager » en haut du rail ;
  - les modules du rail ;
  - les boutons d'action ;
  - « Commandes reçues » seulement pour les prestataires.
- Écran **Rôles et permissions** (administrateur) : la matrice par interface, une colonne par rôle.
- Écran **Utilisateurs** : les rôles de chaque compte se changent par cases à cocher.
**Espace administrateur**, d'après la maquette « Servis Yakro » (`Téléchargements/servis-yakro-app`, rôle Administrateur) :
  
- Une application à part, comme l'espace pro : rail sombre sur ordinateur, navigation basse et « Plus » sur téléphone (`screens/admin/EspaceAdmin.tsx`).
- Réservée aux comptes `users.est_admin` : entrée Paramètres → « Espace administrateur », API `/api/admin/*` protégée par `can:admin` (`AdminController`, `AdminCandidatureController`).
- Modules branchés sur la base :
  - **Vue d'ensemble** : ce qui attend l'équipe (candidatures, signalements ouverts, demandes sans réponse depuis 2 h), les chiffres des 30 derniers jours, les demandes par service et la dernière activité ;
  - **Candidatures** : les dossiers « Devenir prestataire », à valider, à faire compléter (le candidat corrige et renvoie) ou à rejeter (refus définitif, il ne peut plus renvoyer de dossier) ;
  - **Signalements** : les problèmes signalés par les clients, avec les numéros du client et du prestataire, à marquer traités avec ce qui a été fait ;
  - **Demandes et commandes** : toutes les demandes, filtrées par statut et par service, cherchées par référence, client ou prestataire, avec leur détail et leur suivi ;
  - **Prestataires**, tous secteurs confondus (`AdminPrestataireController`) :
    - liste filtrée par secteur, quartier, statut (actifs, suspendus, bloqués) et note minimale ;
    - **dossier** : identité, téléphone, compte relié, zone, expérience, candidature d'origine, secteurs, pièces, photos des réalisations, avis des clients, signalements et journal des sanctions ;
    - **activité** : missions, réussies, annulées, taux d'acceptation (acceptées sur acceptées + refusées), demandes sans réponse depuis 2 h, retards signalés, litiges ;
    - **statut**, toujours avec un motif gardé au dossier : actif, suspendu (fiche masquée, réactivable ; permission `prestataires.suspendre`) ou bloqué (fiche masquée et espace prestataire fermé ; `prestataires.bloquer`, administrateur seulement) ;
    - **secteurs** attribués : un ou plusieurs ; un secteur ajouté apporte sa première catégorie de l'annuaire (`prestataires.modifier`) ;
    - **pièces** vérifiées une à une (vérifiée, ou refusée avec un motif) ; à la validation d'une candidature, toutes ses pièces rejoignent le dossier de la fiche (`prestataires.modifier`) ;
    - **avertissement** inscrit au dossier, relié s'il y a lieu au signalement d'un client (`prestataires.sanctionner`) ;
    - mettre en avant, voir la fiche publique.
  - **Utilisateurs** : chercher par nom ou par numéro, donner ou retirer l'accès administrateur (jamais à soi-même) ;
  - **Catalogue et prix** : les prix indicatifs des prestations, modifiables ;
  - **Journal d'activité** : étapes des demandes, candidatures traitées et signalements.
- Modules de la maquette **pas encore créés**, faute de métier correspondant dans l'application : abonnements, paiements plateforme, webhooks, plans et tarifs, factures, rôles et permissions détaillés (un seul rôle « équipe » aujourd'hui), modération des avis, manager distinct de l'administrateur.
**Devenir prestataire** (`CONFIG.devenirPrestataire`) :

- `"formulaire"` (valeur actuelle) : un dossier en 5 étapes, envoyé à l'équipe TerraClick (`screens/prestataire/DevenirPrestataire.tsx`).
  1. Le type : artisan indépendant, entreprise ou pressing.
  2. L'identité : responsable, nom affiché, photo du visage, pièce d'identité recto et verso.
  3. L'activité : services, quartier et quartiers d'intervention, description, expérience, horaires, prix, paiements acceptés.
  4. Ce qui est propre au type :
     - artisan : une personne de référence ; carte d'artisan, diplôme, casier judiciaire et réalisations, facultatifs ;
     - entreprise : RCCM, NCC, siège, nombre de techniciens et registre de commerce, obligatoires ; logo, attestation fiscale, CNPS et assurances, facultatifs ;
     - pressing : adresse du local, services, express, délai, collecte à domicile avec ses quartiers et ses frais, photo de la devanture ; RCCM facultatif.
  5. Le récapitulatif et l'engagement d'exactitude.
- Ce qui est demandé, type par type, se règle dans `config/candidature.php` (**à valider côté produit et juridique**). L'API sert cette liste (`GET /api/candidature/exigences`) et l'applique (`POST /api/moi/candidature`).
- Les pièces sont rangées sur le disque **privé** : seule l'équipe les ouvre, à travers l'API.
- Le candidat suit son dossier sur le même écran : en vérification, validé, ou à corriger avec le motif de l'équipe ; il corrige alors et renvoie.
- **Équipe** : les comptes `users.est_admin` voient Paramètres → « Candidatures à vérifier » (`screens/admin/AdminCandidatures.tsx`, `/api/admin/candidatures`).
  - « Valider » crée la fiche du prestataire, avec ses catégories et ses documents vérifiés, la publie et la relie au compte du candidat.
  - « Demander des compléments » envoie un motif au candidat, qui corrige et renvoie.
  - « Rejeter » est définitif : le candidat lit le motif mais ne peut plus renvoyer de dossier.
  - Compte équipe de démonstration : **07 01 01 01 01**, mot de passe **terraclick2026** (à changer avant le lancement).
- `"espace"` : l'ancien espace prestataire de démonstration, masqué mais conservé.
- **En ligne (Render)** : le disque du serveur est effacé à chaque redéploiement. Les pièces jointes, comme les photos des demandes, ont besoin d'un stockage durable (S3, Cloudflare R2…) avant le lancement.
**Correction des fautes de frappe**, comme Chrome ou Google (`App\Services\CorrecteurRecherche`) :

- Quand la recherche n'est comprise ni comme un service ni comme une prestation, chaque mot inconnu d'au moins 4 lettres est rapproché du mot le plus proche du vocabulaire de TerraClick. Ce vocabulaire comprend les métiers, les services, les problèmes types, les prestations, les articles du pressing, les catégories, les quartiers et les noms des prestataires.
- Fautes admises : 1 jusqu'à 6 lettres, 2 jusqu'à 10, 3 au-delà. Deux lettres inversées comptent pour une seule faute.
- Les mots de tous les jours ne sont jamais corrigés.
- Les résultats portent sur le mot voulu (`analyse.correction` dans `GET /api/prestataires`). L'application affiche « Résultats pour **plombier** » avec « Rechercher plutôt *plonbier* » (paramètre `exact=1`).

**Fin du parcours à l'envoi** (`CONFIG.envoiDemande`) :

- `"envol"` (valeur actuelle) : après « Confirmer ma demande » ou « Valider la commande », le parcours s'arrête. La fenêtre « Demande envoyée » (ou « Commande envoyée ») s'affiche avec sa référence. Elle se plie ensuite en avion en papier, qui vole jusqu'au bouton central « Mes onglets ». Le bouton rebondit, avec une onde et un « +1 » (`components/EnvolDemande.tsx`).
  - L'accueil reste dessous.
  - Sur ordinateur, sans barre d'onglets, l'avion file vers le haut et les onglets s'ouvrent.
  - Si l'appareil demande moins d'animations, la fenêtre s'efface simplement.
- `"ecran"` : l'ancien écran « Demande envoyée », avec la facture, « Suivre ma demande » et « Accueil » (`DemandeEnvoyee.tsx`, masqué mais conservé).

**Onglets → Historique** : un dépannage terminé **et confirmé par le client** quitte « Mes onglets » pour l'**Historique**.

- C'est le cas d'une demande confirmée (« Problème résolu », « J'ai reçu mon linge »), ou d'un accord pris hors application que le client a marqué terminé.
- `GET /api/accords?etat=onglets|historique`, avec `Accord::scopeAccomplis`.
- L'Historique ressemble à celui de Chrome :
  - une recherche en haut ;
  - deux onglets, « Dépannages » et « Recherches » ;
  - les dépannages accomplis jour par jour, avec l'heure, l'icône du service, l'objet, le prestataire et le montant ;
  - un toucher rouvre le détail et son reçu.
- Sans compte, l'Historique s'ouvre sur les recherches de l'appareil.

**Onglets de suivi pour tous les services** : toute demande envoyée à un prestataire (plomberie, électricité, climatisation, serrurerie, menuiserie comme pressing) crée son onglet dès l'envoi (`Accord::pourDemande`). Les demandes plus anciennes sont rattrapées par une migration. Une intervention s'y suit en cinq étapes : envoyée, acceptée, en cours, terminée, confirmée (`config/suivi.php`). Son onglet propose aussi d'annuler, de signaler un problème (retard, technicien pas venu, travail mal fait, prix différent), de recommander, de confirmer « Problème résolu », de noter le technicien et de télécharger le reçu, avec le montant convenu.

**Commande pressing, de bout en bout** :

- *Dans l'interface pressing, avant de valider* (ce que reçoit le gérant) :
  - pack avec articles, quantités et **instructions** ;
  - page **« Ma commande »** (`screens/besoin/CommandePressing.tsx`) :
    - adresse enregistrée ou nouvelle : domicile, bureau ou autre lieu (`GET/POST/DELETE /api/moi/adresses`) ;
    - service : lavage et repassage, repassage seul, nettoyage à sec, plus l'option **express** ;
    - mode de dépôt : collecte à domicile ou dépôt au pressing ;
    - créneau : date et heure ;
    - total estimé en direct.
  - confirmation : récapitulatif, **prix estimé**, **facture** à voir et télécharger, paiement (espèces, Mobile Money ou autre moyen), **« Valider la commande »**.
  - Après l'envoi : facture avec sa référence et « Suivre ma commande ».
- *Dans les onglets* : la commande validée y entre aussitôt (`Accord` créé avec la demande). On y trouve :
  - le **suivi** étape par étape :
    - collecte à domicile : agent en route, collectée, reçue au pressing, en traitement, prête, en livraison, livrée ;
    - dépôt au pressing : reçue, en traitement, prête, récupérée ;
  - la facture ;
  - « J'ai reçu mon linge » ;
  - la **note** du pressing, après la livraison ;
  - **« Signaler un problème »** : retard, vêtement manquant, erreur, article endommagé, autre (`POST /api/demandes/{id}/signalements`) ;
  - **« Recommander »** en un toucher : la confirmation s'ouvre pré-remplie, pour demain à la même heure ;
  - l'annulation, tant que la commande n'est pas en cours.
- *Dans la cloche* : `GET /api/notifications`, avec « Commande confirmée », « Agent en route », « Linge prêt », « Livraison en cours », « Commande livrée » et les réponses des techniciens.
  - Elles sont marquées lues sur l'appareil.
  - Toucher une notification ouvre l'onglet.
- *Côté gérant* : Paramètres → **« Commandes reçues »** (`screens/pro/DemandesRecues.tsx`, aussi dans l'espace prestataire). Le gérant y voit tout le détail, accepte ou refuse, puis fait avancer l'étape (`POST /api/pro/demandes/{id}/etape`). Le client est notifié à chaque étape.
  - Compte gérant de démonstration, relié à Pressing Éclat : **07 08 08 08 08**, mot de passe **terraclick2026**.
- **À valider avec les pressings**, dans `config/pressing.php` :
  - coefficients des services : repassage 50 %, nettoyage à sec 150 % ;
  - majoration express : +50 % ;
  - heures de créneau ;
  - motifs de signalement.

Tout le reste est **masqué, pas supprimé**. Les données sont toujours en base et les écrans
restent dans le code. Les secteurs reviendront un par un, au fil de l'usage. Cette section
recense ce qui est masqué et dit comment le rouvrir.

### Comment c'est masqué

| Où | Réglage | Effet |
| --- | --- | --- |
| Espace administrateur | « Secteurs d'activité » (table `secteurs`) | Les catégories ouvertes sont celles des secteurs **actifs**. Le méga-menu, la recherche, les vedettes, les fiches et les avis taisent tout le reste. Une rubrique ou un département vidé disparaît. `config/mvp.php` n'est plus que la liste de départ. |
| API | `MVP_ACTIF=false` dans `backend/.env` | Rouvre tout l'annuaire d'un coup. |
| Frontend | `frontend/src/lib/config.ts` : `moduleConstruction` | `false` masque le module Construction (voir plus bas), `true` le rebranche partout. |
| Frontend | `frontend/src/lib/config.ts` : `modesAccueil` | `false` masque la bascule Recherche / Autour de moi / Box intelligente de l'accueil et l'onglet « Carte » de la barre mobile (voir plus bas), `true` les rebranche. |
| Frontend | `frontend/src/lib/config.ts` : `carteResultats` | `false` masque la bascule Liste / Carte des résultats, qui restent en liste ; `true` la rebranche. |
| Frontend | `frontend/src/lib/config.ts` : `motDePasse` | `true` : comptes avec mot de passe. `false` rebranche la connexion par code seul, sans mot de passe (voir « Compte avec mot de passe »). |
| Frontend | `frontend/src/lib/config.ts` : `actionsAccueilMobile` | `false` masque les boutons « Urgence » et « Programmer » sous l'en-tête de l'accueil mobile (voir plus bas), `true` les rebranche. |
| Frontend | `frontend/src/data/catalogue.ts` : `SECTEURS` | Liste du premier affichage seulement : elle est remplacée au démarrage par les secteurs actifs de l'API (`GET /api/secteurs`), dans l'ordre choisi par l'administrateur, et gardée sur l'appareil. |
| Tests | `frontend/tests/parcours.mjs` : `MODULE_CONSTRUCTION` | Réactive les règles C à F (assistant, contrat, PV, bloc BTP). |
| Tests | `frontend/tests/parcours.mjs` : `MODES_ACCUEIL` | Réactive la première moitié de la règle N (Box intelligente et « Autour de moi » réservées aux inscrits). |
| Tests | `frontend/tests/parcours.mjs` : `CARTE_RESULTATS` | Réactive la fin de la règle N (vue carte des résultats réservée aux inscrits). |

**Rouvrir ou ajouter un secteur** : depuis l'espace administrateur, écran **Secteurs d'activité**
(permission `secteurs.gerer`, administrateur seulement ; le manager voit les chiffres avec `secteurs.voir`).

- **Créer** un secteur : nom, métier, description, icône, couleur, catégories de l'annuaire
  (sans choix, une catégorie à son nom est créée dans « Autres services »), problèmes proposés
  au client, mots compris par la recherche (« peint* » reconnaît peinture et peintre). Le nom et
  le métier sont compris d'office. Un secteur neuf reste **désactivé** tant qu'on ne l'ouvre pas.
- **Modifier**, **activer** ou **désactiver** : désactivé, il disparaît de l'accueil, de la
  recherche et des demandes, sans être supprimé (les anciennes demandes gardent son nom).
- **Classer** : flèches haut et bas, l'ordre est celui de l'accueil client.
- **Sous-services** : les prestations du secteur et leur prix indicatif ; on les ajoute,
  on les désactive.
- **Statistiques** par secteur : demandes, prestataires actifs, interventions réussies
  (terminées ou confirmées) et leur montant.
- Icônes et couleurs proposées : `backend/config/secteurs_affichage.php` (chaque icône est
  aussi déclarée dans `frontend/src/components/Icon.tsx`). Un secteur sans photo s'affiche
  avec son icône sur un fond de sa couleur.
- `config/secteurs.php` n'est plus que la liste de départ, recopiée en base par la migration
  `create_secteurs_table`.

### Catégories ouvertes

| Secteur | Catégories (slug) |
| --- | --- |
| Plomberie | `plombiers`, `entretien-plomberie` |
| Électricité | `electriciens`, `entretien-electricite` |
| Climatisation | `climatisation-vente-et-reparation` |
| Serrurerie | `serruriers` (catégorie créée pour le MVP, rubrique Construction) |
| Menuiserie | `menuisiers` |

### Masqué pour l'instant, à rouvrir plus tard

**Départements et catégories de l'annuaire** (`CatalogueSeeder`) :

- **Maison & Bâtiment**, sauf les catégories ci-dessus :
  - Immobilier : maisons à louer, appartements à vendre, terrains, magasins à louer, agences
    immobilières, notaires ;
  - Construction : entreprises de construction, architectes et bureaux d'études,
    quincailleries et matériaux, cimenteries, maçons, vitriers, carreleurs, peintres ;
  - Équipement maison : panneaux solaires, groupes électrogènes, sécurité et
    vidéosurveillance, meubles, décoration ;
  - Entretien : femmes de ménage, jardiniers, piscinistes, désinsectisation, nettoyage de
    façades et toitures.
- **Auto & Transport** : mécanique, pièces détachées, transport, carburant.
- **Alimentation & Marché** : supermarchés, marchés, restaurants et maquis, livraison.
- **Éducation & Services** : cours, démarches administratives, formation.
- **Santé & Bien-être** : santé, beauté.
- **Hôtellerie & Tourisme** : hébergement, loisirs.
- **Entreprise & Pro** : services aux entreprises, bureautique, événementiel.
- **Technologie & Énergie** : informatique, énergie (dont « Électricien », doublon de la
  catégorie ouverte), électroménager.
- **Mode & Commerce** : vêtements, boutiques en ligne.
- **Finance & Assurance** : banque, mobile money, assurance.
- **Religion & Association** : lieux de culte, associations.
- **Administration** : services publics, urgence.

**Prestataires de démonstration masqués** : Garage Bamba, Auto Service Yakro, Solar Mamadou,
Soleil Énergie, Ent. Bakayoko. Ali Diomandé n'apparaît que comme plombier, pas comme
carreleur.

**Module Construction** (`moduleConstruction: false`) :

- page « Construction & travaux » ;
- assistant de projet en sept étapes et page « Projet publié » ;
- « Mes projets » et page projet à onze onglets ;
- suivi avancé avec séquestre et litige ;
- contrat en cinq étapes, PV de réserves.

Ses points d'entrée sont retirés :

- liens « Construction » et « Mes projets » de l'en-tête ;
- onglet « Projets » de la barre mobile ;
- bloc « Projet de construction ? » du méga-menu ;
- bloc « Accompagnement BTP » et bandeau « Suivi avancé » des résultats ;
- carte « Besoin en plusieurs étapes ? » de la Box intelligente ;
- badge « Accepte les projets suivis » et bouton « Ajouter à mon projet suivi » de la fiche.

Sur la fiche, « Demander un devis » ouvre le devis simple au lieu de l'assistant. Un écran du
module atteint malgré tout (historique, état restauré) affiche l'accueil.

**Modes de l'accueil** (`modesAccueil: false`), fonctionnalités à construire plus tard :

- la bascule à trois boutons sous la barre de recherche : **Recherche**, **Autour de moi** et
  **Box intelligente** ;
- **Autour de moi** (`screens/home/ModeCarte.tsx`) : carte et liste des prestataires proches
  de la position de l'utilisateur, réservées aux clients inscrits ;
- **Box intelligente** (`screens/home/ModeBox.tsx`) : le client décrit son problème en une
  phrase, et la Box répond par le métier, une fourchette de prix et le niveau d'enjeu. Elle
  écoute aussi les messages vocaux et peut ouvrir un projet suivi. Réservée aux inscrits ;
- l'onglet **Carte** de la barre d'onglets mobile, qui ouvrait « Autour de moi ».

L'accueil reste en mode recherche.

**Vue carte des résultats** (`carteResultats: false`) : la bascule **Liste / Carte** en haut
à droite de la page des résultats est masquée. Les résultats s'affichent toujours en liste.
La vue carte (`components/MapCanvas.tsx`) plaçait les prestataires trouvés sur une carte
au-dessus de la liste, et elle était réservée aux clients inscrits.

**Accueil mobile précédent** (`accueilMobile: "fil"`) : l'accueil sur téléphone suit
désormais la disposition d'une page d'accueil de navigateur (`screens/home/AccueilFil.tsx`) :
ville, cloche et photo en haut ; nom TerraClick au centre ; grande barre de recherche (logo,
micro, appareil photo) ; raccourcis des secteurs, les plus cherchés récemment sur l'appareil
d'abord ; entrée « Devenir partenaire » ; puis le fil d'actualité de la plateforme
(`GET /api/actualites` : nouveaux techniciens, avis, réalisations, chargé au défilement).
L'accueil précédent (en-tête orange « Salut, … », filtres de ville, prestataires à la une,
besoin guidé) reste dans `screens/home/AccueilMobile.tsx` : `"epuree"` ou `"riche"` le rebranche.

**Menu ⋮ de l'accueil mobile** (`components/MenuPlus.tsx`, écrans dans
`screens/menu/EcransMenu.tsx`) : rangée Retour, Suivant, Favoris, Télécharger l'application,
Actualiser ; puis Onglets de recherche (un onglet par service cherché), Historique,
Supprimer les données de navigation, Téléchargements (reçus), Favoris, Onglets récents (les
recherches du compte sur ses autres appareils) et Paramètres (ville, compte, notifications,
historique, **Devenir prestataire**, installation). « Personnaliser la page » et « Aide et
commentaires » sont affichés, marqués « Bientôt ». Chaque recherche est enregistrée
(`POST /api/recherches`, table `recherches`) ; « Supprimer les données de navigation » la
masque pour l'utilisateur (`efface_le`) mais l'administration la garde.

**Fiche du technicien sur téléphone** (`ficheMobile: "profil"`, `screens/FicheMobile.tsx`) : profil
centré (photo ronde, nom, métier, zone, note), bouton ✕ pour quitter en haut à droite, bloc
présentation et tarifs portant en bas à droite les deux actions en icônes — Contacter (appel,
WhatsApp ou message) et Demander ce technicien —, puis prestations, réalisations,
disponibilités, garanties et documents, et les avis clients en bas. `"page"` rebranche la page
d'avant (retour en haut à gauche, barre d'actions fixe en bas). Le **profil client** est épuré
(`profilComplet: false`) : carte d'identité, tuiles, « Paramètres du compte » et déconnexion.

**Bouton central de la barre du bas** (`ongletCentral: true`, `components/TabBar.tsx`) : sur
téléphone, un bouton rond orange, surélevé entre Favoris et Messages, ouvre « Mes onglets » ;
la ligne de la barre plonge en arrondi sous lui. `false` revient à la barre simple.

**Mes onglets : relations abouties** (table `accords`, `GET/POST /api/accords`) : un onglet n'est
pas une recherche, c'est un accord conclu avec un technicien. Quand le client le contacte
(appel, WhatsApp, message depuis sa fiche ou les résultats), l'application note le contact
(`lib/contacts.ts`) ; à son retour, elle lui demande « Avez-vous conclu avec … ? »
(`components/ConfirmationAccord.tsx`). Oui → l'accord (travail, montant, date, recherche
d'origine, canal) rejoint ses onglets, avec les étapes qui y ont mené et un **reçu à
télécharger** (impression en PDF). Une demande faite dans l'application et confirmée terminée
devient aussi un onglet. Les recherches sans suite restent dans l'Historique.

**Prestations et prix** (table `prestations`, `database/seeders/PrestationSeeder.php`) : chaque
secteur a ses prestations (plomberie : fuite, tuyau cassé, débouchage, robinet, chauffe-eau,
pompe, installation sanitaire…), avec des mots-clés pondérés et un **prix indicatif à valider
avec les techniciens**. Une recherche précise (« tuyau cassé ») reconnaît la prestation, montre
les techniciens qui la proposent (`prestataire_prestation`) et affiche son prix chez chacun (le
sien s'il l'a fixé, sinon l'indicatif). Les onglets des résultats deviennent les prestations du
secteur en jeu. API : `GET /api/prestataires?q=…` ou `?prestation=slug`, réponse `analyse.secteur`,
`analyse.prestation`, `analyse.prestations`.

**Résultats sur téléphone** (`resultatsMobile: "moteur"`) : la page de résultats suit la mise en
page d'un moteur de recherche (`screens/ResultatsMobile.tsx`) : barre de recherche (effacer,
micro), onglets Tous puis les services, conseil, puis chaque technicien en résultat (nom en
petit, grand titre métier · quartier · prix, extrait, note, délai, menu ⋮ Voir le profil /
Chat / Appeler). `"cartes"` rebranche les cartes de prestataires d'avant.

**Boutons « Urgence » et « Programmer » de l'accueil mobile** (`actionsAccueilMobile: false`) :
les deux boutons côte à côte sous l'en-tête orange (`screens/home/AccueilMobile.tsx`) sont
masqués pour le moment. « Urgence » ouvrait l'assistant de demande avec une intervention
immédiate, « Programmer » l'ouvrait pour une date à choisir. L'assistant reste accessible
par la recherche, les tuiles Services et la carte « besoin guidé ».

Côté API, les filtres `lat`, `lng` et `rayon_km` de `/prestataires` sont conservés pour ces
fonctionnalités.

**Méga-menu** (bouton « Départements » de la barre de recherche) : tant que l'API ne
renvoie qu'un département, `components/MegaMenu.tsx` masque :

- la colonne de gauche qui liste les départements ;
- le nom du département (« Maison & Bâtiment ») ;
- le bouton « Tout voir ».

Seules restent les rubriques (Construction, Équipement maison, Entretien) et leurs
catégories. Ces éléments reviennent d'eux-mêmes dès qu'un deuxième département est rouvert
dans `config/mvp.php`.

**Contenus d'interface remplacés** (anciennes valeurs, à reprendre au besoin) :

- *Recherches populaires* : Mécanicien, Réparation climatisation, Panneaux solaires,
  Plomberie, Électricité.
- *Recherché en ce moment* : Plombier, Mécanicien, Cyber, Point Wave, Maquis.
- *Formulaire de devis* : Plomberie, Électricité, Climatisation, Menuiserie (Serrurerie
  ajoutée).
- *Services d'un prestataire* : Carrelage, Peinture, Maçonnerie, Ménage retirés ; Serrurerie
  ajoutée.
- *Dépannage 24/24* : « Remorquage auto 24/24 » remplacé par « Plombier d'urgence ».
- *Exemples de la Box intelligente* : « Je veux carreler 40 m² à Habitat », « Trouver un
  traiteur pour 80 personnes ».
- *Espace client fictif* (`data/compte.ts`, `data/client.ts`, reçu, avis) : achat
  d'ordinateur chez Tech Ivoire avec séquestre, panneaux solaires, ménage hebdomadaire,
  offres de gros œuvre, demande de carrelage, demande à Garage Bamba. Ces exemples sont
  remplacés par des prestations des cinq secteurs.

## Démarrer

Le dépôt contient deux applications :

- `frontend/` : React, Vite et TypeScript ;
- `backend/` : API Laravel 13 avec MySQL. Son installation et ses routes sont décrites dans
  [`backend/README.md`](backend/README.md).

```bash
cd backend && composer serve     # API sur http://127.0.0.1:8000
cd frontend && npm install && npm run dev   # http://localhost:5173
```

En développement, le serveur Vite relaie `/api` vers Laravel (`frontend/vite.config.ts`) :
lancez donc l'API avant le frontend. Pour un déploiement, renseignez `VITE_API_URL` et videz
`VITE_CODE_DEMO` dans `frontend/.env`.

**Ce qui passe par l'API** :

- le compte : inscription avec mot de passe et numéro vérifié par code (SMS ou WhatsApp),
  connexion, mot de passe oublié, profil, session gardée après rechargement, déconnexion ;
- le cycle d'une demande : `GET /api/demandes`, suivi détaillé, annuler, confirmer côté
  client (« Mes demandes », suivi, tableau de bord et profil lisent la base ; le compte de
  démonstration a une demande à chaque étape) ; `GET /api/pro/demandes`, accepter (message, estimation, créneau), refuser
  (motif), démarrer, terminer côté technicien, dont le compte est relié à sa fiche
  (`prestataires.user_id`). Chaque étape est journalisée (`demande_evenements`). Compte
  technicien de démonstration : **07 07 07 07 07**, mot de passe **terraclick2026** ;
- le méga-menu ;
- la recherche et ses filtres de quartier ;
- les prestataires à la une ;
- « Autour de moi » ;
- la fiche professionnelle.

**Ce qui reste fictif**, dans `frontend/src/data/` :

- la messagerie ;
- les demandes de devis ;
- les projets de construction ;
- le reçu et le dépôt d'avis.

Compte de démonstration : 07 58 42 19 03. En local, le code est toujours 417802, et la bulle
sous les cases le remplit.

Commandes du frontend, à lancer dans `frontend/` :

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | vérification des types puis build de production dans `dist/` |
| `npm run preview` | sert le build sur http://localhost:4173 |
| `npm run typecheck` | TypeScript seul |
| `npm run test:parcours` | rejoue les règles de fonctionnement dans un navigateur (voir plus bas) |

## Parcours de demande (lot 1)

Le parcours client remplace l'ancienne demande de devis en 3 étapes (`screens/Devis.tsx`,
conservé mais plus atteignable). Les écrans se trouvent dans `frontend/src/screens/besoin/`.

1. **Accueil orienté problème** : barre « Quel est votre problème ? », boutons « Urgence
   maintenant » et « Programmer une intervention », services en tuiles. La recherche passe
   par `/api/analyse` :
   - si un service est reconnu, l'assistant s'ouvre, problème présélectionné quand il est nommé ;
   - si plusieurs services sont possibles, l'assistant demande lequel ;
   - sinon, c'est la recherche texte.
2. **Assistant en 4 questions** : le problème (ou « Autre » décrit), le quartier et un point
   de repère, le moment (maintenant, aujourd'hui, demain, date), puis jusqu'à 3 photos
   facultatives. Un résumé suit : « Plomberie · Fuite d'eau · Habitat · Maintenant ».
3. **Choix du mode** : « Trouver pour moi » est proposé en premier pour une urgence,
   « Choisir moi-même » pour une intervention programmée ou une installation.
4. **Mise en relation** :
   - « Trouver pour moi » propose les 3 meilleurs techniciens, le premier marqué
     « Recommandé ». Le client peut aussi en choisir un autre, en demander d'autres ou
     comparer lui-même ;
   - « Choisir moi-même » ouvre la liste filtrable, et la fiche porte « Demander ce
     technicien ».
5. **Confirmation** : résumé, technicien, frais de déplacement, paiement (espèces ou Mobile
   Money, réglé directement au technicien), annulation, puis « Confirmer ma demande ».
   **Le compte n'est demandé qu'à ce moment.** La demande est enregistrée par l'API (table
   `demandes`, photos sur le disque `public`), et un accusé d'envoi affiche sa référence
   (DEM-AAAA-NNNNN).

Les textes de frais, d'annulation et de paiement sont dans `frontend/src/data/catalogue.ts`
(`FRAIS_DEPLACEMENT`, `POLITIQUE_ANNULATION`, `PAIEMENTS`), **à valider côté produit**.

**Restent pour les lots suivants** :
- **Lot 2** : envoi au technicien, acceptation ou refus, passage automatique au suivant, et
  suivi « Acceptée → En route → Arrivé → En cours → Terminée ». « Mes demandes » affiche la
  nouvelle demande, mais son suivi reste fictif.
- **Lot 3** : « Problème résolu ? », notation, signalement et avis du technicien sur le client.
- **Filtres de comparaison** : ceux du texte (disponibilité, note minimale, type
  d'intervention, budget) attendent des données que les fiches n'ont pas encore, notamment
  les disponibilités.

## Ce que fait l'application

> Cette section décrit le produit complet. Dans le MVP, l'annuaire se limite aux cinq
> secteurs ci-dessus. Le module Construction, le suivi avancé, « Autour de moi » et la Box
> intelligente sont masqués.

**Recherche.** L'accueil offre trois entrées : la **recherche** classique, **Autour de moi**
(carte et liste des prestataires proches) et la **Box intelligente**, où le besoin est décrit
en une phrase et traduit en métier, fourchette de prix et niveau d'enjeu. Les 12 départements
et leurs sous-catégories s'ouvrent en méga-menu depuis la barre de recherche. Les résultats se
filtrent par quartier de Yakro et basculent entre liste et carte.

**Mise en relation.** Chaque fiche porte deux actions : *Chat* et *Appeler*. La messagerie
interne passe avant tout. La fiche professionnelle réunit réalisations, prestations, tarifs
indicatifs, disponibilités, garanties, documents vérifiés et avis.

**Compte avec mot de passe** (`motDePasse: true`). L'inscription demande le nom, le
téléphone, l'e-mail (facultatif), un mot de passe (8 caractères au moins, avec une lettre et
un chiffre), la ville et le quartier ; le compte est **créé directement en base, sans code
SMS ni WhatsApp**. La vérification du numéro par code reste dans le code, masquée :
`verificationTelephone: true` (application) et `OTP_VERIFICATION_INSCRIPTION=true` (API) la
rebranchent. Sans elle, une inscription ne reprend jamais un numéro qui a déjà un compte. La connexion se fait par numéro et
mot de passe. « Mot de passe oublié » : nouveau mot de passe, confirmé par un code reçu ; les
autres sessions sont alors fermées. Chercher et consulter restent libres ; le mur ne tombe
qu'au moment d'agir, sous forme de feuille basse (numéro et mot de passe), et l'action
interrompue reprend ensuite toute seule.
Compte de démonstration : **07 58 42 19 03**, mot de passe **terraclick2026**
(`DemoSeeder::MOT_DE_PASSE_DEMO`, posé une seule fois).

**Connexion par code seul, masquée** (`motDePasse: false`). Le parcours d'origine, sans mot de
passe : le système regarde si le numéro existe déjà et décide lui-même s'il s'agit d'une
inscription ou d'une connexion (numéro, canal, code, puis deux champs de profil si le numéro
est inconnu). Les écrans (`ConnexionParCode`, étapes « code » et « profil » de `AuthSheet`)
et la route `POST /api/auth/verifier` restent en place. Un compte créé ainsi n'a pas de mot de
passe : il s'en donne un avec « Mot de passe oublié ».

**Suivi avancé.** Sur les besoins lourds, l'application propose — sans jamais l'imposer — un
suivi encadré : questionnaire, offres à comparer, séquestre par étape via mobile money,
vérification par un agent avant remise, confirmation de réception, et négociation de 48 h en
cas d'écart.

**Module Construction.** Page dédiée, assistant de projet en sept étapes, liste « Mes projets »
sur sept statuts, page projet à onze onglets (vue d'ensemble, propositions, suivi de chantier,
pré-réception, paiements, matériaux, équipements, messages, documents, incidents et SAV,
entretien), comparaison des devis, contrat en cinq étapes avec signature électronique, et
procès-verbal de réserves.

**Espace client.** Conversations, demandes de devis, favoris, équipements posés et leurs
garanties, abonnements d'entretien, reçus, canaux de notification, coordonnées.

## Organisation du code

Le frontend :

```
frontend/src/
  main.tsx, App.tsx        point d'entrée et aiguillage des écrans
  state/                   état applicatif partagé (contexte React) et types
  screens/                 un fichier par écran ; projet/ pour le module de suivi
  components/              coque (en-tête, pied de page, barre d'onglets), feuille
                           d'authentification, notifications, carte, notation, icônes
  data/                    contenu : annuaire, projets, chantier, contrat, fiche, compte
  lib/                     habillages (theme.ts) et configuration (config.ts)
  styles/ds/               design system Servis Yakro, repris tel quel du bundle
  styles/app.css           système responsive à 4 paliers
```

La navigation est une machine à états (`state/app.tsx`) plutôt qu'un routeur : les écrans
dépendent d'un contexte transitoire — le sujet suivi, l'onglet courant, l'action interrompue —
que des URL ne porteraient pas telles quelles. Chaque changement d'écran est tout de même
empilé dans l'historique, donc le bouton « Précédent » du navigateur et le geste de retour
Android fonctionnent.

## Design system

Le design system **Servis Yakro** est vendorisé dans `src/styles/ds/`, repris sans
modification du bundle de conception. Il fournit les jetons (couleurs Kola / Lagune / Soleil /
Argile, typographie, espacements, rayons, ombres, mouvement) et les classes `sy-*`.
Règles à respecter :

- Français ivoirien, au **vous**, casse normale, jamais d'emoji ni de glyphe unicode en guise
  d'icône. Les icônes viennent de **Lucide** (`src/components/Icon.tsx`).
- Neutres chauds uniquement — un gris froid dans ce produit est un bug.
- Montants en F CFA avec espace comme séparateur de milliers, virgule décimale française.
- Cibles tactiles d'au moins 44 px.

`src/lib/theme.ts` pose par-dessus les alias `--color-*` utilisés par les écrans, ce qui permet
de rhabiller toute l'application : cinq variantes existent (officielle, Chaleureux, Sobre & pro,
Nuit, Compact annuaire), sélectionnées dans `src/lib/config.ts`.

## Vérification des règles de fonctionnement

`frontend/tests/parcours.mjs` rejoue les règles produit dans un vrai navigateur, avec l'API
réelle (98 dans le MVP, celles du module Construction, des modes de l'accueil et de la carte des
résultats étant suspendues) :

- le mur d'authentification et la reprise de l'action interrompue ;
- la création d'un compte et sa session après rechargement ;
- l'affichage des erreurs du serveur ;
- le filtre par catégorie du méga-menu ;
- le blocage de l'assistant tant qu'une étape est incomplète ;
- l'impossibilité de terminer le contrat sans signature ;
- l'isolement du parcours PV ;
- l'affichage conditionnel du bloc BTP ;
- le périmètre du MVP : cinq secteurs, métiers masqués introuvables, pas de module Construction.

```bash
cd backend && php artisan migrate:fresh --seed && composer serve     # API, port 8000
cd frontend && npx playwright install chromium
npm run build && npm run preview &                                    # port 4173
npm run test:parcours
```

## Points laissés ouverts

Repris du travail de conception, à trancher avant la mise en production :

- **Acompte au démarrage** — aucun artisan n'achète le ciment en attendant la fin de l'étape.
- **Libération automatique** du séquestre après un délai sans réclamation.
- **Étapes parallèles** dans un chantier, et **durée de la session** sur le téléphone.
- **Côtés prestataire, entreprise, conducteur de travaux et administrateur** : aucun n'est
  maquetté, c'est un doublement du périmètre.
- Les paiements mobile money (Wave, Orange Money, MTN), l'envoi réel des codes SMS/WhatsApp et
  la cartographie sont représentés dans l'interface mais ne sont branchés sur aucun service.
  Les comptes et l'annuaire passent par l'API ; la messagerie, les devis et les projets
  affichent encore les jeux d'exemple de `frontend/src/data/`.

## Origine

Cette application est l'implémentation d'un ensemble de maquettes conçues dans Claude Design.
Le bundle d'origine — transcript de conception, prototypes HTML, design system complet — est
conservé dans `chats/` et `project/`, et les consignes de reprise dans
[`docs/HANDOFF.md`](docs/HANDOFF.md). En cas de doute sur une intention, le transcript
`chats/chat1.md` fait foi.
