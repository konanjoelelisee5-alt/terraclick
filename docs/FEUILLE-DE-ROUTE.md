# Feuille de route — Servis Yakro

Analyse du 14 octobre 2026. Rien de ce document n'est encore développé : c'est la base des
prochaines décisions. Les coûts indiqués sont des estimations, à mesurer en conditions réelles.

## Déjà en place

**API Laravel (`backend/`)**

- connexion sans mot de passe par code SMS ou WhatsApp, et profil ;
- villes et quartiers ;
- départements et catégories ;
- recherche de prestataires, y compris par distance ;
- prestataires à la une ;
- fiche professionnelle ;
- avis.

**Reliés au frontend**

- le compte ;
- le méga-menu ;
- la recherche ;
- « Autour de moi » ;
- les prestataires à la une ;
- la fiche professionnelle.

**API prête, pas encore branchée à l'écran**

- la publication d'un avis ;
- la liste complète des avis ;
- la modification du profil depuis l'espace client.

---

## 1. Box intelligente (à développer plus tard)

### L'intention

Un lieu de recherche assisté par une IA intégrée à l'application. Le client obtient une réponse
concrète sans avoir à chercher lui-même dans l'application. La Box ne se disperse pas sur tout
internet : elle se concentre sur ce qui existe dans l'application, localement, dans la ville et
le secteur du client.

### Deux fonctionnalités distinctes

| | A. Trouver un technicien | B. Conseiller un achat (ordinateur, télé…) |
| --- | --- | --- |
| Exemple | « Un électricien sérieux à Kokrenou, disponible ce soir, pas trop cher » | « Un ordinateur pour la comptabilité, budget 300 000 F : lequel, et où l'acheter à Yakro ? » |
| Données nécessaires | La base existante : prestataires, notes, prix, quartiers, avis | Des connaissances générales, que l'IA possède déjà, et **un catalogue de produits locaux (prix, stock), qui n'existe pas encore** |
| Difficulté | Modérée : réutilise les routes de l'annuaire | Lourde : il faut d'abord un module produits, rempli par les vendeurs |
| Sans données supplémentaires | Faisable | Conseils généraux seulement, et orientation vers la catégorie « Vente PC / téléphone » |

Une IA intégrée ne vaut que par les données qu'elle peut consulter. Pour rester locale, elle
doit répondre à partir de la base de Servis Yakro.

### Architecture envisagée

1. Le client écrit dans la Box, et le frontend appelle `POST /api/box` sur Laravel.
2. Laravel appelle Claude avec le SDK PHP officiel et une liste d'**outils en lecture seule** :
   - rechercher des prestataires ;
   - lire une fiche ;
   - lister les catégories ;
   - plus tard, rechercher des produits.
3. Claude choisit les outils à appeler. Laravel les exécute, puis Claude rédige la réponse en
   français, avec des actions : voir la fiche, chat, demander un devis.

**Garde-fous :**

- une consigne qui limite la Box aux services et produits locaux ;
- une limite de questions par personne ;
- la clé d'API reste sur le serveur ;
- une mention « réponse générée par une IA ».

**Prérequis :** un compte Anthropic avec une clé d'API et un moyen de paiement.

### Coût indicatif par question

Estimation pour environ 2 à 3 échanges avec l'IA par question :

| Modèle | Par question | Remarque |
| --- | --- | --- |
| Claude Opus 5.5 | ≈ 0,05 $ (≈ 30 F CFA) | Meilleure qualité de conseil |
| Claude Sonnet 5.5 | ≈ 0,02 $ (≈ 15 F CFA) | Compromis |
| Claude Haiku 5.5 | ≈ 0,001 $ (< 1 F CFA) | Économique, qualité à vérifier |

Le choix du modèle est une décision commerciale. L'idée est de commencer par le plus capable pour
juger la qualité, puis de tester un modèle moins cher sur de vraies questions.

### Calendrier retenu

À faire **après** les modules de base, quand l'annuaire contiendra de vrais prestataires. La
partie B dépend de la décision sur le module produits (question 1 ci-dessous).

---

## 2. Fonctionnalités encore fictives (données d'exemple, sans backend)

| # | Module | Écran actuel | Backend à construire |
| --- | --- | --- | --- |
| 1 | Messagerie | Conversation inventée, réponse automatique | Conversations et messages client ↔ prestataire, notifications |
| 2 | Demande de devis (3 étapes) | 4 catégories en dur, rien d'enregistré | Demandes, envoi aux prestataires du quartier, réponses chiffrées |
| 3 | Urgence 24/24 | Numéros et dépanneurs fictifs | Numéros fixes ; dépanneurs tirés de l'annuaire (« dispo 24/24 ») |
| 4 | Espace client | Conversations, demandes, favoris, équipements et garanties, abonnements d'entretien, reçus, préférences de notification, coordonnées | Un module par bloc ; favoris et coordonnées rapides |
| 5 | Notifications | 4 notifications inventées | Table de notifications, envoi SMS, WhatsApp ou e-mail |
| 6 | Reçu et avis | Reçu fictif « Tech Ivoire » | API des avis prête ; manquent les prestations terminées et les reçus |
| 7 | Suivi avancé d'un achat | Questionnaire, offres, séquestre, agent, litige | Le plus lourd : commandes, mobile money, séquestre, agents. Lié à la Box (partie B) |
| 8 | Module Construction | Assistant 7 étapes, projets, 11 onglets, contrat, PV | Très lourd, presque une application à part |
| 9 | Côté prestataire | Bouton « Devenir partenaire » inactif | Inscription, gestion de la fiche, documents, réponses aux messages et devis |
| 10 | Administration | Rien | Validation des documents, modération, gestion des catégories |
| 11 | Petits éléments inactifs | « Me localiser », filtres « Ouvert maintenant » et « Urgence », carte dessinée | Géolocalisation, horaires d'ouverture, fournisseur de cartes |

Le côté prestataire (n° 9) est indispensable au MVP : sans lui, personne ne peut répondre aux
messages ni aux devis.

## 3. Ordre proposé pour le MVP

1. Espace prestataire minimal : inscription, fiche, réception des messages.
2. Messagerie réelle.
3. Demandes de devis réelles.
4. Favoris et coordonnées dans l'espace client.
5. Prestations terminées, reçus et avis.
6. Plus tard : Box intelligente, suivi avancé avec séquestre, module Construction, paiements.

## 4. Décisions à prendre

1. Le **module produits** (achat d'articles) fait-il partie du MVP ?
2. Parmi les 11 modules, lesquels **garder, modifier ou retirer** ? Le module Construction
   fait-il partie du MVP ou d'une version 2 ?
3. L'ordre proposé convient-il, en commençant par l'espace prestataire ?

Points déjà laissés ouverts par la conception (voir `README.md`) :

- l'acompte au démarrage ;
- la libération automatique du séquestre ;
- les étapes parallèles d'un chantier ;
- la durée de la session sur le téléphone.
