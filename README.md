# Servis Yakro

Place de marché de services locaux pour la Côte d'Ivoire, ancrée à **Yamoussoukro**.
Un citoyen décrit son besoin — une fuite, un maçon, un ordinateur, une maison à construire —
et l'application le relie à des prestataires vérifiés, jusqu'à la réception de la prestation.

Application web responsive, utilisée sur ordinateur comme sur Android (360–412 px).

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

- le compte : code par SMS ou WhatsApp, profil, session gardée après rechargement,
  déconnexion ;
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

## Ce que fait l'application

**Recherche.** L'accueil offre trois entrées : la **recherche** classique, **Autour de moi**
(carte et liste des prestataires proches) et la **Box intelligente**, où le besoin est décrit
en une phrase et traduit en métier, fourchette de prix et niveau d'enjeu. Les 12 départements
et leurs sous-catégories s'ouvrent en méga-menu depuis la barre de recherche. Les résultats se
filtrent par quartier de Yakro et basculent entre liste et carte.

**Mise en relation.** Chaque fiche porte deux actions : *Chat* et *Appeler*. La messagerie
interne passe avant tout. La fiche professionnelle réunit réalisations, prestations, tarifs
indicatifs, disponibilités, garanties, documents vérifiés et avis.

**Compte sans mot de passe.** Un seul parcours : le système regarde si le numéro existe déjà
et décide lui-même s'il s'agit d'une inscription ou d'une connexion. Chercher et consulter
restent libres ; le mur ne tombe qu'au moment d'agir, sous forme de feuille basse — numéro,
canal (SMS ou WhatsApp), code à six chiffres, puis deux champs de profil si le numéro est
inconnu. L'action interrompue reprend ensuite toute seule.
Numéro de démonstration reconnu : **07 58 42 19 03**.

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

`frontend/tests/parcours.mjs` rejoue 27 règles produit dans un vrai navigateur, avec l'API
réelle :

- le mur d'authentification et la reprise de l'action interrompue ;
- la création d'un compte et sa session après rechargement ;
- l'affichage des erreurs du serveur ;
- le filtre par catégorie du méga-menu ;
- le blocage de l'assistant tant qu'une étape est incomplète ;
- l'impossibilité de terminer le contrat sans signature ;
- l'isolement du parcours PV ;
- l'affichage conditionnel du bloc BTP.

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
