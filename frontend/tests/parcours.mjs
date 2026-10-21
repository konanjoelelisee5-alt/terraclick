/* Vérification des règles de fonctionnement arbitrées pendant la conception.
 *
 * Ce ne sont pas des tests unitaires : chaque assertion rejoue un parcours réel
 * dans un navigateur et vérifie une décision produit — le mur d'authentification
 * n'arrive qu'à l'action, une étape ne s'ouvre pas sans la précédente, le
 * chantier ne démarre pas sans signature, le suivi avancé est proposé et jamais
 * imposé.
 *
 * Prérequis : `npm install -D playwright && npx playwright install chromium`,
 * puis `npm run build && npm run preview` dans un autre terminal.
 * Lancement : `npm run test:parcours`
 */
import pw from 'playwright';
const { chromium } = pw;
const b = await chromium.launch();
const R = [];
const ok = (n, c) => R.push((c ? '  OK   ' : '  ÉCHEC') + ' · ' + n);
// Les données viennent de l'API : on attend l'élément au lieu d'un délai fixe.
const apparait = (loc, ms = 12000) => loc.waitFor({ state: 'visible', timeout: ms }).then(() => true, () => false);

async function neuve(w = 1440, h = 1000) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(350);
  // Sans session, l'application s'ouvre sur la connexion : la flèche retour mène à l'accueil.
  if (await p.locator('[data-r="page-auth"]').isVisible().catch(() => false)) {
    await p.getByRole('button', { name: "Retour à l'accueil", exact: true }).click();
    await p.waitForTimeout(200);
  }
  return { ctx, p };
}
// Comptes avec mot de passe (CONFIG.motDePasse) ; celui de démonstration est posé par DemoSeeder.
const MDP = 'terraclick2026';
// Titre de la feuille de connexion qui monte au moment d'agir.
const MUR = 'Connectez-vous pour continuer';

/** Connexion dans la feuille basse (le mur) : numéro et mot de passe. */
async function connecter(p, tel = '07 58 42 19 03', mdp = MDP) {
  const feuille = p.getByRole('dialog', { name: 'Connexion à TerraClick' });
  await feuille.getByLabel('Votre numéro de téléphone').fill(tel);
  await feuille.getByLabel('Votre mot de passe').fill(mdp);
  await feuille.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await feuille.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(150);
}

/** Connexion sur la page Connexion (plein écran). */
async function connecterPage(p, tel = '07 58 42 19 03', mdp = MDP) {
  const page = p.locator('[data-r="page-auth"]');
  await page.getByLabel('Numéro de téléphone', { exact: true }).fill(tel);
  await page.getByLabel('Mot de passe', { exact: true }).fill(mdp);
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
}

// A · Le mur d'authentification n'arrive qu'à l'action, et l'action reprend ensuite
{
  const { ctx, p } = await neuve();
  // Un nom de technicien n'est pas un service : la recherche texte affiche ses résultats.
  await p.getByPlaceholder(/Quel est votre problème/).fill('Koffi');
  await p.locator('[data-r="search-go"]').click();
  await p.waitForTimeout(300);
  ok('chercher reste libre, sans compte', await apparait(p.getByText('Koffi Tanoh').first()));
  await p.getByRole('button', { name: 'Chat', exact: true }).first().click();
  await p.waitForTimeout(300);
  ok('le mur monte au moment d’agir', await p.getByText(MUR).isVisible());
  await connecter(p);
  ok('numéro et mot de passe : la feuille se referme',
     !(await p.getByRole('dialog', { name: 'Connexion à TerraClick' }).isVisible().catch(() => false)));
  ok('l’action interrompue reprend (le chat s’ouvre)',
     await apparait(p.getByPlaceholder('Écrivez votre message…')));
  await ctx.close();
}

// B · Dans la feuille basse (le mur) : mauvais mot de passe refusé, « Créer un compte » mène à l'inscription
{
  const { ctx, p } = await neuve();
  await p.getByPlaceholder(/Quel est votre problème/).fill('Koffi');
  await p.locator('[data-r="search-go"]').click();
  await p.getByRole('button', { name: 'Chat', exact: true }).first().click();
  await apparait(p.getByText(MUR));
  const feuille = p.getByRole('dialog', { name: 'Connexion à TerraClick' });
  await feuille.getByLabel('Votre numéro de téléphone').fill('07 58 42 19 03');
  await feuille.getByLabel('Votre mot de passe').fill('mauvais2026');
  await feuille.getByRole('button', { name: 'Se connecter', exact: true }).click();
  ok('mur : mauvais mot de passe refusé', await apparait(feuille.getByText('Numéro ou mot de passe incorrect.')));
  await feuille.getByRole('button', { name: 'Créer un compte' }).click();
  ok('mur : « Créer un compte » ouvre la page Inscription', await apparait(p.getByRole('tab', { name: 'Inscription', selected: true })));
  await ctx.close();
}

// Le module Construction est masqué dans le MVP (CONFIG.moduleConstruction, src/lib/config.ts).
// Les règles C à F le parcourent : elles ne tournent que s'il est rebranché.
const MODULE_CONSTRUCTION = false;

// C · L'assistant bloque « Continuer » tant que l'étape n'est pas renseignée
if (MODULE_CONSTRUCTION) {
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: 'Construction' }).click();
  await p.waitForTimeout(250);
  await p.getByRole('button', { name: 'Commencer mon projet' }).click();
  await p.waitForTimeout(250);
  await connecter(p);
  const continuer = p.getByRole('button', { name: 'Continuer' });
  ok('étape 1 : « Continuer » est bloqué', await continuer.isDisabled());
  ok('l’aide dit ce qui manque', await p.getByText(/Choisissez le type de projet/).isVisible());
  await p.getByRole('button', { name: 'Construction neuve' }).click();
  await p.getByRole('button', { name: 'Villa', exact: true }).click();
  await p.waitForTimeout(200);
  ok('étape 1 complétée : « Continuer » s’active', await continuer.isEnabled());
  await continuer.click();
  await p.waitForTimeout(300);
  ok('étape 2 atteinte', await p.getByText('Où se situe votre projet ?').isVisible());
  await ctx.close();
}

// D · Le contrat ne se termine pas sans signature
if (MODULE_CONSTRUCTION) {
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: 'Mes projets' }).click();
  await p.waitForTimeout(250);
  await connecter(p);
  await p.getByRole('button', { name: 'Voir le projet' }).first().click();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: 'Propositions' }).click();
  await p.waitForTimeout(250);
  await p.getByRole('button', { name: 'Voir le devis' }).first().click();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: 'Continuer' }).click();
  await p.waitForTimeout(250);
  await p.getByRole('button', { name: 'Continuer' }).click();
  await p.waitForTimeout(300);
  ok('étape 3 : signature électronique', await p.getByText('Choisissez votre moyen de signature.').isVisible());
  ok('« Continuer » bloqué sans signature', await p.getByRole('button', { name: 'Continuer' }).isDisabled());
  ok('l’aide l’explique', await p.getByText(/le chantier ne démarre qu'après votre signature/).isVisible());
  for (const d of ['4','1','7','8','0','2']) { await p.getByRole('button', { name: d, exact: true }).click(); }
  await p.waitForTimeout(300);
  ok('après signature, « Continuer » se débloque', await p.getByRole('button', { name: 'Continuer' }).isEnabled());
  await ctx.close();
}

// E · Le PV de réserves n'ouvre aucune étape contractuelle
if (MODULE_CONSTRUCTION) {
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: 'Mes projets' }).click();
  await p.waitForTimeout(250);
  await connecter(p);
  await p.getByRole('button', { name: 'Voir le projet' }).first().click();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: 'Pré-réception' }).click();
  await p.waitForTimeout(250);
  await p.getByRole('button', { name: 'Signer le PV de réserves' }).click();
  await p.waitForTimeout(350);
  ok('contexte PV : titre dédié', await p.getByText('Signature du PV de réserves').isVisible());
  ok('contexte PV : pas de rail à 5 étapes',
     !(await p.getByText('Validation du devis').isVisible().catch(() => false)));
  ok('contexte PV : pas de bouton « Continuer »',
     (await p.getByRole('button', { name: 'Continuer' }).count()) === 0);
  await p.getByRole('button', { name: 'Retour', exact: true }).click();
  await p.waitForTimeout(350);
  ok('« Retour » ramène à l’onglet Pré-réception', await p.getByText('Checklist par lot').isVisible());
  await ctx.close();
}

// F · Bandeau de suivi contre bloc BTP, selon la recherche
if (MODULE_CONSTRUCTION) {
  const { ctx, p } = await neuve();
  await p.getByPlaceholder(/Quel est votre problème/).fill('Maçon');
  await p.locator('[data-r="search-go"]').click();
  await p.waitForTimeout(350);
  ok('recherche BTP : bloc « Accompagnement BTP »', await p.getByText('Accompagnement BTP').isVisible());
  ok('recherche BTP : bandeau générique masqué',
     !(await p.getByText('Suivi avancé disponible pour ce besoin').isVisible().catch(() => false)));
  await p.getByRole('button', { name: /Retour à l'accueil/ }).click();
  await p.waitForTimeout(250);
  await p.getByPlaceholder(/Quel est votre problème/).fill('Coiffure');
  await p.locator('[data-r="search-go"]').click();
  await p.waitForTimeout(350);
  ok('hors BTP : bandeau de suivi avancé proposé (jamais imposé)',
     await p.getByText('Suivi avancé disponible pour ce besoin').isVisible());
  await ctx.close();
}

// G · Le retour navigateur fonctionne
{
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: 'Programmer une intervention' }).click();
  await apparait(p.getByRole('heading', { name: 'De quel service avez-vous besoin ?' }));
  await p.waitForTimeout(300);
  await p.goBack();
  await p.waitForTimeout(400);
  ok('le bouton Précédent du navigateur revient à l’accueil',
     await p.getByText('Recherches populaires').isVisible());
  await ctx.close();
}

// G bis · MVP : seuls les six secteurs sont ouverts, le module Construction est masqué
if (!MODULE_CONSTRUCTION) {
  const { ctx, p } = await neuve();
  ok('MVP : pas d’entrée « Construction » ni « Mes projets »',
     (await p.getByRole('button', { name: 'Construction', exact: true }).count()) === 0 &&
       (await p.getByRole('button', { name: 'Mes projets', exact: true }).count()) === 0);
  ok('MVP : les six secteurs sur l’accueil, dont le pressing',
     (await Promise.all(['Plomberie', 'Électricité', 'Climatisation', 'Serrurerie', 'Menuiserie', 'Pressing']
       .map((s) => p.getByRole('button', { name: s, exact: true }).first().isVisible()))).every(Boolean));
  await p.locator('[data-r="search-depts"]').click();
  await apparait(p.getByRole('button', { name: 'Serruriers', exact: true }));
  ok('MVP : le méga-menu ne montre que les métiers ouverts',
     (await p.getByRole('button', { name: 'Serruriers', exact: true }).isVisible()) &&
       !(await p.getByText('Mécanicien auto').isVisible().catch(() => false)));
  const menu = p.locator('[data-r="megamenu"]');
  ok('MVP : méga-menu sans « Maison & Bâtiment » ni « Tout voir »',
     (await menu.getByText('Maison & Bâtiment').count()) === 0 &&
       (await menu.getByRole('button', { name: 'Tout voir' }).count()) === 0);
  await p.locator('[data-r="search-depts"]').click();
  await p.getByPlaceholder(/Quel est votre problème/).fill('Garage');
  await p.locator('[data-r="search-go"]').click();
  ok('MVP : un métier masqué ne renvoie personne', await apparait(p.getByText('Aucun prestataire pour cette recherche')));
  ok('MVP : ni bloc BTP ni suivi avancé',
     !(await p.getByText('Accompagnement BTP').isVisible().catch(() => false)) &&
       !(await p.getByText('Suivi avancé disponible pour ce besoin').isVisible().catch(() => false)));
  await ctx.close();
}

// G quater · La barre comprend une phrase : le client décrit son problème sans nommer le métier
{
  const { ctx, p } = await neuve();
  await p.getByPlaceholder(/Quel est votre problème/).fill('ma douche fuit depuis hier');
  await p.locator('[data-r="search-go"]').click();
  ok('phrase libre : les résultats s’affichent directement, sans formulaire',
     await apparait(p.getByRole('heading', { name: /Plomberie|Réparation de fuite/ })) &&
       !(await p.getByText('Étape 1 sur 4').isVisible().catch(() => false)));
  await ctx.close();
}

// G quinquies · Sur téléphone aussi, la recherche affiche directement les résultats
{
  const { ctx, p } = await neuve(390, 844);
  await p.getByPlaceholder('Rechercher sur TerraClick').fill('ma douche fuit depuis hier');
  await p.locator('[data-r="search-go"]').click();
  ok('mobile : phrase libre → résultats directs, sans formulaire',
     await apparait(p.getByRole('heading', { name: /Plomberie|Réparation de fuite/ })) &&
       !(await p.getByText('Étape 1 sur 4').isVisible().catch(() => false)));
  const etats = () => p.locator('[data-r="results-head"] [data-r="pastille-filtre"]').evaluateAll((l) => l.map((e) => e.dataset.reduite).join(','));
  ok('résultats : Quartier et Trier à droite du titre, Quartier déplié, Trier réduit', (await etats()) === 'non,oui');
  await p.getByLabel('Trier').click({ force: true });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  ok('résultats : toucher Trier le déplie et réduit Quartier', (await etats()) === 'oui,non');
  ok('résultats : pas de défilement horizontal', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  // Mise en page façon moteur de recherche (CONFIG.resultatsMobile).
  const onglets = p.locator('[data-r="onglets-resultats"]');
  // « ma douche fuit » : la plomberie est en jeu, les onglets sont ses prestations, la fuite soulignée.
  ok('résultats : onglets = prestations de la plomberie, « fuite d’eau » soulignée',
     (await apparait(onglets.getByRole('button', { name: 'Débouchage WC et canalisation' }))) &&
       (await onglets.getByRole('button', { name: "Réparation de fuite d'eau" }).getAttribute('aria-current')) === 'page');
  ok('résultats : prix indicatif de la prestation et titres à son prix',
     (await p.locator('[data-r="prix-indicatif"]').getByText('5 000 – 15 000 F').isVisible()) &&
       (await p.locator('[data-r="conseil"]').getByText(/ma douche fuit/).isVisible()) &&
       /^Réparation de fuite d'eau · /.test(await p.locator('[data-r="titre-resultat"]').first().textContent()));
  await p.locator('[data-r="resultat"]').first().getByRole('button', { name: /Actions pour/ }).click();
  ok('résultats : le menu ⋮ propose profil, chat et appel', (await p.getByRole('menuitem').allTextContents()).join('|') === 'Voir le profil|Chat|Appeler');
  await p.keyboard.press('Escape');
  await onglets.getByRole('button', { name: 'Débouchage WC et canalisation' }).click();
  ok('résultats : un onglet de prestation donne son prix', await apparait(p.locator('[data-r="prix-indicatif"]').getByText('8 000 – 25 000 F')));
  await p.locator('[data-r="tous-les-services"]').click();
  ok('résultats : « Tous les services » ramène aux onglets des services', await apparait(onglets.getByRole('button', { name: 'Électricité' })));
  await onglets.getByRole('button', { name: 'Électricité' }).click();
  ok('résultats : un onglet de service propose ses prestations', await apparait(onglets.getByRole('button', { name: 'Disjoncteur qui saute' })));
  await p.locator('[data-r="titre-resultat"]').first().click();
  ok('résultats : le grand titre ouvre la fiche', await apparait(p.getByRole('button', { name: /Demander ce technicien|Chat/ }).first()));
  await ctx.close();
}

// G sexies · « tuyau cassé » : la plomberie, les plombiers, et le prix de la réparation du tuyau
{
  const { ctx, p } = await neuve(390, 844);
  await p.getByPlaceholder('Rechercher sur TerraClick').fill('tuyau cassé');
  await p.locator('[data-r="search-go"]').click();
  ok('tuyau cassé : prestation reconnue, prix indicatif de la réparation',
     (await apparait(p.getByRole('heading', { name: 'Réparation de tuyau cassé' }))) &&
       (await p.locator('[data-r="prix-indicatif"]').getByText('7 000 – 20 000 F').isVisible()));
  ok('tuyau cassé : chaque plombier affiche son prix pour cette réparation',
     (await p.locator('[data-r="resultat"]').filter({ hasText: 'Koffi Tanoh' }).locator('[data-r="titre-resultat"]').textContent()) === 'Réparation de tuyau cassé · 6 000 – 15 000 F');
  ok('tuyau cassé : l’onglet de la prestation est visible et souligné',
     await p.locator('[data-r="onglets-resultats"]').getByRole('button', { name: 'Réparation de tuyau cassé' }).evaluate((e) => {
       const r = e.getBoundingClientRect();
       return e.getAttribute('aria-current') === 'page' && r.left >= 0 && r.right <= window.innerWidth;
     }));
  await ctx.close();
}

// P · Lot 1 : urgence → assistant en 4 questions → « Trouver pour moi » → confirmation → envoi
{
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: 'Urgence maintenant' }).click();
  await p.locator('[data-r="choix-service"]').getByRole('button', { name: /Plomberie/ }).click();
  const continuer = p.getByRole('button', { name: 'Continuer', exact: true });
  ok('assistant : « Continuer » bloqué sans problème choisi', await continuer.isDisabled());
  await p.getByRole('radio', { name: "Fuite d'eau" }).click();
  await continuer.click();
  await p.getByLabel('Quartier à Yamoussoukro').selectOption({ label: 'Habitat' });
  await p.getByLabel(/point de repère/).fill('Derrière la pharmacie');
  await continuer.click();
  ok('urgence : « Maintenant » déjà choisi', (await p.getByRole('radio', { name: /Maintenant/ }).getAttribute('aria-checked')) === 'true');
  await continuer.click();
  await p.getByRole('button', { name: 'Passer cette étape' }).click();
  ok('résumé : Plomberie · Fuite d’eau · Habitat · Maintenant',
     (await p.locator('[data-r="resume-besoin"]').textContent()).includes("Plomberie · Fuite d'eau · Habitat · Maintenant"));
  ok('urgence : « Trouver pour moi » proposé en premier',
     await p.locator('[data-r^="mode-"]').first().evaluate((e) => e.dataset.r === 'mode-recommande'));
  await p.getByRole('button', { name: 'Trouver pour moi' }).click();
  ok('recommandations : le plombier du quartier en tête, marqué « Recommandé »',
     await apparait(p.locator('[data-r="carte-technicien"]').first().getByText('Koffi Tanoh')) &&
       (await p.locator('[data-r="carte-technicien"]').first().getByText('Recommandé').isVisible()));
  await p.getByRole('button', { name: 'Confirmer ce technicien' }).click();
  ok('confirmation : résumé, frais, paiement et annulation visibles',
     await apparait(p.getByRole('heading', { name: "Vérifiez avant d'envoyer" })) &&
       (await p.getByText('Frais de déplacement', { exact: true }).isVisible()) && (await p.getByText('Annulation', { exact: true }).isVisible()));
  ok('aucune inscription demandée avant la confirmation', !(await p.getByText(MUR).isVisible().catch(() => false)));
  await p.getByRole('radio', { name: /Mobile Money/ }).click();
  await p.getByRole('button', { name: 'Confirmer ma demande' }).click();
  ok('confirmer demande un compte', await apparait(p.getByText(MUR)));
  await connecter(p);
  const envol = p.locator('[data-r="envol-demande"]');
  ok('demande envoyée par l’API : la fenêtre « Demande envoyée », avec sa référence',
     await apparait(envol.getByRole('heading', { name: 'Demande envoyée' }), 8000) && (await envol.getByText(/Référence DEM-\d{4}-\d{5}/).isVisible()));
  ok('le parcours s’arrête là : ni « Suivre ma demande » ni « Accueil »', (await p.getByRole('button', { name: 'Suivre ma demande' }).count()) === 0);
  // Sur ordinateur, sans barre d'onglets : l'avion s'envole et les onglets s'ouvrent.
  ok('l’avion en papier s’envole, puis les onglets s’ouvrent',
     (await envol.waitFor({ state: 'detached', timeout: 12000 }).then(() => true, () => false)) && (await apparait(p.locator('[data-r="onglets"]'))));
  // Comme une commande pressing, la demande d'intervention se suit dans son onglet.
  await p.locator('[data-r="onglet"]').first().click();
  const suivi = p.locator('[data-r="suivi-commande"]');
  ok('onglet : la demande d’intervention s’y suit, en attente du technicien',
     (await apparait(suivi)) && (await p.locator('[data-r="statut-commande"]').textContent()) === 'En attente du technicien' &&
       (await p.locator('[data-r="etape-suivi"]').count()) === 5 && (await p.locator('[data-r="etape-suivi"][data-fait]').count()) === 1);
  ok('onglet : annuler, signaler, recommander, et le reçu',
     (await suivi.getByRole('button', { name: /Annuler la demande/ }).isVisible()) && (await suivi.getByRole('button', { name: /Signaler un problème/ }).isVisible()) &&
       (await suivi.getByRole('button', { name: /Recommander/ }).isVisible()) && (await p.locator('[data-r="facture"]').getByText('Reçu', { exact: true }).isVisible()));
  await suivi.getByRole('button', { name: /Signaler un problème/ }).click();
  ok('onglet : motifs d’une intervention pour signaler', await apparait(p.getByRole('radio', { name: 'Le technicien n’est pas venu'.replace('’', "'") })));
  await ctx.close();
}

// Q · « Programmer une intervention » : comparer d'abord, puis « Demander ce technicien » depuis la fiche
{
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: 'Programmer une intervention' }).click();
  await p.locator('[data-r="choix-service"]').getByRole('button', { name: /Serrurerie/ }).click();
  const continuer = p.getByRole('button', { name: 'Continuer', exact: true });
  await p.getByRole('radio', { name: 'Changer une serrure' }).click();
  await continuer.click();
  await p.getByLabel('Quartier à Yamoussoukro').selectOption({ label: 'Centre-ville' });
  await continuer.click();
  await p.getByRole('radio', { name: /Choisir une date/ }).click();
  ok('date : « Continuer » bloqué tant qu’aucune date n’est choisie', await continuer.isDisabled());
  const demain = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await p.getByLabel('Date souhaitée').fill(demain);
  await continuer.click();
  await p.getByRole('button', { name: 'Passer cette étape' }).click();
  ok('intervention programmée : « Comparer » proposé en premier',
     await p.locator('[data-r^="mode-"]').first().evaluate((e) => e.dataset.r === 'mode-choisi'));
  await p.getByRole('button', { name: 'Choisir moi-même' }).click();
  ok('comparer : la demande est rappelée au-dessus de la liste', await apparait(p.locator('[data-r="rappel-besoin"]')));
  await p.getByRole('button', { name: 'Voir le profil' }).first().click();
  await p.getByRole('button', { name: 'Demander ce technicien' }).click();
  ok('« Demander ce technicien » mène à la confirmation, avec ce serrurier',
     await apparait(p.getByRole('heading', { name: "Vérifiez avant d'envoyer" })) &&
       (await p.locator('[data-r="carte-technicien"]').getByText("Serrurerie N'Guessan").isVisible()));
  await ctx.close();
}

// G ter · La ville se choisit dans une liste déroulante, sans faire défiler les autres
{
  const { ctx, p } = await neuve();
  const choix = p.locator('[data-r="search-ville"] select');
  ok('ville : liste déroulante avec les quatre villes', (await choix.locator('option').count()) === 4);
  await choix.selectOption({ label: 'Daloa' });
  ok('ville : Daloa choisie directement, affichée dans la barre',
     (await p.locator('[data-r="search-ville"] [data-r="ville-nom"]').textContent()) === 'Daloa');
  await ctx.close();
}

// H · L'annuaire vient de l'API : méga-menu, filtre par catégorie, fiche du bon prestataire
{
  const { ctx, p } = await neuve();
  await p.locator('[data-r="search-depts"]').click();
  await apparait(p.getByRole('button', { name: 'Plombiers', exact: true }));
  await p.getByRole('button', { name: 'Plombiers', exact: true }).click();
  ok('catégorie « Plombiers » : les plombiers de la base', await apparait(p.getByText('Ali Diomandé')));
  ok('catégorie « Plombiers » : pas le garage', !(await p.getByText('Garage Bamba').isVisible()));
  await p.getByRole('button', { name: 'Voir le profil' }).first().click();
  ok('« Voir le profil » ouvre la fiche de ce prestataire',
     await apparait(p.getByRole('heading', { name: /Koffi Tanoh|Ali Diomandé/ })));
  await ctx.close();
}

const numeroNeuf = () => '07' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0');

// I · Page Connexion : numéro et mot de passe, erreurs du serveur, compte connu
{
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: 'Se connecter' }).click();
  ok('« Se connecter » ouvre la page Connexion', await apparait(p.getByRole('tab', { name: 'Connexion', selected: true })));
  ok('page Connexion : ni « Bienvenue », ni emoji, ni pastille « Espace Client »',
     (await p.getByText('Bienvenue').count()) === 0 && (await p.getByText('Espace Client').count()) === 0 && (await p.getByText('👋').count()) === 0);
  ok('page Connexion : numéro, mot de passe et « Mot de passe oublié ? »',
     (await p.getByLabel('Mot de passe', { exact: true }).isVisible()) &&
       (await p.getByRole('button', { name: 'Mot de passe oublié ?' }).isVisible()));
  await connecterPage(p, '09 12 34 56 78');
  ok('numéro refusé par le serveur : le motif s’affiche', await apparait(p.getByText(/pas un numéro ivoirien valide/)));
  await connecterPage(p, '07 58 42 19 03', 'mauvais2026');
  ok('mauvais mot de passe : refusé', await apparait(p.getByText('Numéro ou mot de passe incorrect.')));
  await connecterPage(p);
  ok('compte connu : connexion puis espace client', await apparait(p.getByText('Aya Konan').first()));
  await ctx.close();
}

// J · Page Inscription : nom, téléphone, e-mail, mot de passe, puis code ; compte enregistré, session gardée
const numeroInscrit = numeroNeuf();
{
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: "S'inscrire" }).click();
  ok('« S’inscrire » ouvre la page Inscription', await apparait(p.getByRole('tab', { name: 'Inscription', selected: true })));
  await p.getByLabel('Nom complet').fill('Awa Test');
  await p.getByLabel('Mot de passe', { exact: true }).fill('soleil2026');
  await p.getByLabel('Confirmer le mot de passe').fill('soleil2026');
  await p.getByRole('button', { name: 'Créer mon compte' }).click();
  ok('conditions non acceptées : inscription bloquée', await apparait(p.getByText(/Acceptez les conditions/)));
  await p.locator('.sy-choice').click();

  await p.getByLabel('Confirmer le mot de passe').fill('autre2026');
  await p.getByRole('button', { name: 'Créer mon compte' }).click();
  ok('mots de passe différents : inscription bloquée', await apparait(p.getByText('Les deux mots de passe ne sont pas identiques.')));
  await p.getByLabel('Mot de passe', { exact: true }).fill('court');
  await p.getByLabel('Confirmer le mot de passe').fill('court');
  await p.getByRole('button', { name: 'Créer mon compte' }).click();
  ok('mot de passe trop court : inscription bloquée', await apparait(p.getByText(/au moins 8 caractères/)));

  const numero = numeroInscrit;
  await p.getByLabel('Mot de passe', { exact: true }).fill('soleil2026');
  await p.getByLabel('Confirmer le mot de passe').fill('soleil2026');
  await p.getByLabel('E-mail (facultatif)').fill(`awa.${numero}@exemple.ci`);
  await p.getByLabel('Numéro de téléphone', { exact: true }).fill(numero);
  await p.getByLabel('Quartier').selectOption({ label: 'Kokrenou' });
  await p.getByRole('button', { name: 'Créer mon compte' }).click();
  ok('compte créé : le nom apparaît dans l’en-tête', await apparait(p.getByText('Awa Test').first()));
  ok('inscription directe : ni code SMS ni WhatsApp', (await p.getByText(/Code reçu par/).count()) === 0);
  const moi = await p.evaluate(async () => {
    const r = await fetch('/api/moi', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + localStorage.getItem('sy.jeton') } });
    return (await r.json()).data;
  });
  ok('e-mail, ville, quartier et mot de passe enregistrés',
     moi?.email === `awa.${numero}@exemple.ci` && moi?.ville?.nom === 'Yamoussoukro' && moi?.quartier?.nom === 'Kokrenou' && moi?.a_mot_de_passe === true);
  await p.reload({ waitUntil: 'domcontentloaded' });
  ok('la session survit au rechargement de la page', await apparait(p.getByText('Awa Test').first()));
  await ctx.close();

  // Le compte se reconnecte avec son mot de passe, sur un autre appareil.
  const autre = await neuve();
  await autre.p.getByRole('button', { name: 'Se connecter' }).click();
  await connecterPage(autre.p, numero, 'soleil2026');
  ok('nouveau compte : reconnexion avec le mot de passe choisi', await apparait(autre.p.getByText('Awa Test').first()));
  await autre.ctx.close();
}

// J bis · « Mot de passe oublié » : nouveau mot de passe, prouvé par le code reçu
{
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: 'Se connecter' }).click();
  await p.getByRole('button', { name: 'Mot de passe oublié ?' }).click();
  ok('« Mot de passe oublié ? » ouvre le formulaire', await apparait(p.getByRole('heading', { name: /Mot de passe oublié/ })));
  const page = p.locator('[data-r="page-auth"]');
  await page.getByLabel('Numéro de téléphone', { exact: true }).fill(numeroInscrit);
  await page.getByLabel('Nouveau mot de passe').fill('lune2027ok');
  await page.getByLabel('Confirmer le mot de passe').fill('lune2027ok');
  await page.getByRole('button', { name: 'Recevoir mon code' }).click();
  await p.getByText(/appuyer pour remplir/).click();
  ok('mot de passe changé : connecté', await apparait(p.getByText('Awa Test').first()));
  await ctx.close();

  const ancien = await neuve();
  await ancien.p.getByRole('button', { name: 'Se connecter' }).click();
  await connecterPage(ancien.p, numeroInscrit, 'soleil2026');
  ok('l’ancien mot de passe ne marche plus', await apparait(ancien.p.getByText('Numéro ou mot de passe incorrect.')));
  await connecterPage(ancien.p, numeroInscrit, 'lune2027ok');
  ok('le nouveau mot de passe marche', await apparait(ancien.p.getByText('Awa Test').first()));
  await ancien.ctx.close();
}

// K · Sur téléphone, l'onglet « Profil » mène à la page de connexion pour un visiteur
{
  const { ctx, p } = await neuve(390, 844);
  await p.locator('[data-r="tabbar"]').getByRole('button', { name: /Profil/ }).click();
  ok('mobile : l’onglet Profil ouvre la page Connexion', await apparait(p.getByRole('tab', { name: 'Connexion', selected: true })));
  ok('mobile : pas de défilement horizontal', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  await ctx.close();
}

// K0 · Sans session, l'application s'ouvre sur la connexion (plein écran) ; la flèche retour mène à l'accueil
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
  ok('ouverture sans session : formulaire de connexion', await apparait(p.getByRole('tab', { name: 'Connexion', selected: true })));
  ok('ouverture : « Télécharger l’application » présent dès la page de connexion', await apparait(p.locator('[data-r="page-auth"]').getByRole('button', { name: /Télécharger l.application/ })));
  // Même après « Ne plus proposer » sur l'accueil, la connexion garde le bouton.
  await p.evaluate(() => localStorage.setItem('tc.installation-masquee', '1'));
  await p.reload({ waitUntil: 'domcontentloaded' });
  ok('installation : toujours proposée à la connexion, même après un ✕ sur l’accueil', await apparait(p.locator('[data-r="page-auth"]').getByRole('button', { name: /Télécharger l.application/ })));
  ok('formulaire plein écran : ni en-tête ni barre du bas',
     (await p.locator('header').count()) === 0 && (await p.locator('[data-r="tabbar"]').count()) === 0);
  await p.getByRole('tab', { name: 'Inscription' }).click();
  ok('bascule vers l’inscription', await apparait(p.getByRole('button', { name: /Créer mon compte/ })));
  await p.getByRole('button', { name: "Retour à l'accueil", exact: true }).click();
  ok('flèche retour : accueil en visiteur', await apparait(p.locator('[data-r="accueil-fil"]')));
  await ctx.close();
}

// G septies · Pressing : un service comme les autres, cherché depuis l'accueil
{
  const { ctx, p } = await neuve(390, 844);
  await p.getByPlaceholder('Rechercher sur TerraClick').fill('repassage de mes chemises');
  await p.locator('[data-r="search-go"]').click();
  ok('pressing : « repassage » mène aux pressings, au prix par pièce',
     (await apparait(p.getByRole('heading', { name: 'Lavage et repassage' }))) &&
       (await p.locator('[data-r="prix-indicatif"]').getByText('300 – 1 500 F par pièce').isVisible()) &&
       (await p.locator('[data-r="resultat"]').filter({ hasText: 'Pressing Éclat' }).count()) === 1);
  ok('pressing : ses prestations en onglets', await p.locator('[data-r="onglets-resultats"]').getByRole('button', { name: 'Nettoyage à sec' }).isVisible());
  await ctx.close();
}

// G decies · Faute de frappe : corrigée comme dans Chrome, résultats du mot voulu, « Rechercher plutôt »
{
  const { ctx, p } = await neuve(390, 844);
  await p.getByPlaceholder('Rechercher sur TerraClick').fill('plonbier');
  await p.locator('[data-r="search-go"]').click();
  const correction = p.locator('[data-r="correction-recherche"]');
  ok('faute : « Résultats pour plombier », annoncé en même temps que les résultats',
     (await apparait(correction)) && /Résultats pour plombier/.test(await correction.textContent()) &&
       (await apparait(p.locator('[data-r="resultat"]').filter({ hasText: 'Koffi Tanoh' }).first())));
  await p.locator('[data-r="rechercher-plutot"]').click();
  ok('faute : « Rechercher plutôt plonbier » relance la saisie telle quelle',
     (await correction.waitFor({ state: 'detached', timeout: 12000 }).then(() => true, () => false)) && (await apparait(p.getByText(/0 résultat/))));
  await ctx.close();
}

// G nonies · Messages sur téléphone : l'en-tête est celui de la conversation, sans flèche retour
{
  const { ctx, p } = await neuve(390, 844);
  await p.locator('[data-r="fil-avatar"]').click();
  await connecterPage(p);
  await apparait(p.locator('[data-r="profil-mobile"]'));
  await p.getByRole('button', { name: /Messages/ }).first().click();
  const entete = p.locator('[data-r="entete-chat"]');
  ok('messages : photo, nom du technicien et « Appeler » en haut',
     (await apparait(entete)) && (await entete.getByRole('button', { name: 'Appeler' }).isVisible()) && (await entete.boundingBox()).y < 20);
  ok('messages : ni logo, ni cloche, ni flèche retour',
     (await p.locator('[data-r="page"] > header').count()) === 0 && (await p.getByRole('button', { name: /^Notifications/ }).count()) === 0 &&
     (await p.getByRole('button', { name: 'Retour', exact: true }).count()) === 0);
  await ctx.close();
}

// G octies · Pack pressing : le client choisit un pressing, compose son pack, l'envoie ; l'API recalcule le total
{
  const { ctx, p } = await neuve(390, 844);
  await p.locator('[data-r="fil-avatar"]').click();
  await connecterPage(p);
  await apparait(p.locator('[data-r="profil-mobile"]'));
  await p.goto('http://localhost:4173/'); await apparait(p.locator('[data-r="accueil-fil"]'));
  await p.getByPlaceholder('Rechercher sur TerraClick').fill('pressing');
  await p.locator('[data-r="search-go"]').click();
  await p.locator('[data-r="resultat"]').filter({ hasText: 'Pressing Éclat' }).locator('[data-r="titre-resultat"]').click();
  ok('pack : la fiche d’un pressing propose « Composer mon pack », pas « Demander »',
     (await apparait(p.getByRole('button', { name: 'Composer mon pack' }))) && (await p.getByRole('button', { name: 'Demander ce technicien' }).count()) === 0);
  await p.getByRole('button', { name: 'Composer mon pack' }).click();
  ok('pack : page dédiée « Mon pack pressing », au nom du pressing',
     (await apparait(p.getByRole('heading', { name: 'Mon pack pressing' }))) && (await p.locator('[data-r="composer-pack"]').getByText('Pressing Éclat').isVisible()));
  const continuer = p.getByRole('button', { name: 'Continuer', exact: true });
  ok('pack : « Continuer » bloqué tant que le pack est vide', await continuer.isDisabled());
  for (let i = 0; i < 3; i++) await p.getByRole('button', { name: 'Ajouter : Chemise' }).click();
  await p.getByRole('button', { name: /^Tenues/ }).click();
  await p.getByRole('button', { name: 'Ajouter : Costume (veste et pantalon)' }).click();
  ok('pack : nombre de pièces et total estimé en direct', (await p.locator('[data-r="total-pack"]').textContent()).replace(/\s/g, ' ').includes('4 pièces') &&
     (await p.locator('[data-r="total-pack"]').textContent()).replace(/[\s ]/g, '').includes('4500F'));
  await p.locator('[data-r="instructions-pack"]').fill('Pas d’amidon sur les chemises.');
  await continuer.click();

  // « Ma commande » : adresse, service, express, dépôt, créneau
  ok('commande : page « Ma commande » après le pack', await apparait(p.getByRole('heading', { name: 'Ma commande' })));
  if (await p.getByRole('radio', { name: /Ajouter une adresse/ }).isVisible().catch(() => false)) await p.getByRole('radio', { name: /Ajouter une adresse/ }).click();
  await p.getByRole('radio', { name: 'Bureau' }).click();
  await p.getByLabel('Quartier à Yamoussoukro').selectOption({ label: 'Habitat' });
  await p.getByLabel('Adresse ou point de repère (facultatif)').fill('Immeuble bleu, 2e étage');
  // Pas d'enregistrement à chaque passage du test : dix adresses au plus.
  await p.getByLabel(/Enregistrer cette adresse/).uncheck();
  ok('commande : continuer bloqué sans dépôt ni créneau', await continuer.isDisabled());
  await p.getByRole('radio', { name: /Nettoyage à sec/ }).click();
  await p.locator('[data-r="express"]').click();
  await p.getByRole('radio', { name: /Collecte à domicile/ }).click();
  await p.getByLabel('Date', { exact: true }).fill(new Date(Date.now() + 864e5).toISOString().slice(0, 10));
  await p.getByRole('radio', { name: '10 h', exact: true }).click();
  // Chemise 500 F × 150 % × 150 % = 1 125 F (× 3) ; costume 3 000 F → 6 750 F
  ok('commande : le total suit le service et l’express', (await p.locator('[data-r="total-commande"]').textContent()).replace(/[\s  ]/g, '').includes('10125F'));
  await continuer.click();

  // Confirmation : récapitulatif, prix, facture, paiement
  ok('commande : récapitulée à la confirmation', await apparait(p.locator('[data-r="recap-commande"]').getByText(/3 × Chemise/)));
  ok('commande : service, express, collecte et créneau au récapitulatif',
     /Nettoyage à sec · Express/.test(await p.locator('[data-r="recap-commande"]').textContent()) && /à 10 h/.test(await p.locator('[data-r="recap-commande"]').textContent()));
  await p.locator('[data-r="voir-facture"]').click();
  ok('commande : facture visible avant de valider', (await apparait(p.locator('[data-r="facture"]'))) && (await p.locator('[data-r="ligne-facture"]').count()) === 2);
  await p.getByRole('radio', { name: /Autre moyen/ }).click();
  await p.getByRole('button', { name: /Valider la commande/ }).click();
  const envol = p.locator('[data-r="envol-demande"]');
  ok('commande : fenêtre « Commande envoyée », sans autre étape', (await apparait(envol.getByRole('heading', { name: 'Commande envoyée' }))) && (await p.locator('[data-r="suivre-commande"]').count()) === 0);
  ok('commande : la fenêtre s’envole vers « Mes onglets » et l’accueil reste dessous',
     (await envol.waitFor({ state: 'detached', timeout: 12000 }).then(() => true, () => false)) && (await p.locator('[data-r="accueil-fil"]').isVisible()));
  const envoyee = await p.evaluate(async () => {
    const r = await fetch('/api/demandes?par_page=1', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + localStorage.getItem('sy.jeton') } });
    return (await r.json()).data[0];
  });
  ok('commande : enregistrée avec le total recalculé par l’API',
     envoyee?.pack?.pieces === 4 && envoyee?.pack?.total === 10125 && envoyee?.commande?.service?.cle === 'nettoyage_sec' && envoyee?.paiement === 'autre');
  const reference = envoyee.reference;

  // Onglets : la commande s'y suit dès la validation
  await p.locator('[data-r="onglet-central"]').click();
  await p.locator('[data-r="onglet"]').first().click();
  ok('onglet : la commande s’y suit, en attente du pressing',
     (await apparait(p.locator('[data-r="onglet-commande"]'))) && (await p.locator('[data-r="statut-commande"]').textContent()) === 'En attente du pressing');
  {
    const suivi = p.locator('[data-r="suivi-commande"]');
    const boites = await Promise.all([/Annuler la commande/, /Signaler un problème/, /Recommander/].map((n) => suivi.getByRole('button', { name: n }).boundingBox()));
    const bloc = await suivi.boundingBox();
    ok('onglet : annuler, signaler, recommander empilés à droite, dans le bloc de suivi',
       boites.every(Boolean) && boites.every((x) => Math.abs(x.x - boites[0].x) < 2 && x.x > bloc.x + bloc.width / 2) &&
       boites[0].y < boites[1].y && boites[1].y < boites[2].y);
  }

  // Le gérant du pressing reçoit la commande, l'accepte et la fait avancer
  const g = await neuve(390, 844);
  await g.p.locator('[data-r="fil-avatar"]').click();
  await connecterPage(g.p, '07 08 08 08 08');
  await apparait(g.p.locator('[data-r="profil-mobile"]'));
  await g.p.goto('http://localhost:4173/'); await apparait(g.p.locator('[data-r="accueil-fil"]'));
  await g.p.locator('[data-r="menu-plus-ouvrir"]').click();
  await g.p.getByRole('menuitem', { name: /Paramètres/ }).click();
  await g.p.locator('[data-r="lien-demandes-recues"]').click();
  const carte = g.p.locator('[data-r="demande-recue"]').filter({ hasText: reference });
  ok('gérant : la commande arrive, avec tout le détail',
     (await apparait(carte)) && /Nettoyage à sec · Express/.test(await carte.textContent()) && /Pas d’amidon/.test(await carte.textContent()) && /Bureau/.test(await carte.textContent()));
  await carte.locator('[data-r="accepter-demande"]').click();
  await g.p.getByRole('tab', { name: /En cours/ }).click();
  for (const etape of ['Agent en route', 'Collectée', 'Reçue au pressing', 'En traitement', 'Prête']) {
    await apparait(carte.locator('[data-r="etape-suivante"]').filter({ hasText: etape }));
    await carte.locator('[data-r="etape-suivante"]').click();
  }
  ok('gérant : la commande avance étape par étape', await apparait(carte.getByText('En livraison')));

  // Le client est notifié et voit le suivi dans l'onglet
  await p.goto('http://localhost:4173/'); await apparait(p.locator('[data-r="accueil-fil"]'));
  await apparait(p.getByRole('button', { name: 'Mon profil' })); // session rechargée
  await p.getByRole('button', { name: /^Notifications/ }).first().click();
  const pret = p.locator('[data-r="notification"]').filter({ hasText: 'Linge prêt' }).first();
  ok('cloche : « Commande confirmée », « Agent en route », « Linge prêt »',
     (await apparait(pret)) && (await p.locator('[data-r="notification"]').filter({ hasText: 'Agent en route' }).count()) > 0 &&
     (await p.locator('[data-r="notification"]').filter({ hasText: 'Commande confirmée' }).count()) > 0);
  await pret.click({ timeout: 5000 }).catch(async () => { await p.screenshot({ path: "tests/_echec.png" }); console.log(R.join("\n")); });
  ok('onglet : suivi à jour, étape « Prête »',
     (await apparait(p.locator('[data-r="onglet-commande"]'))) && (await p.locator('[data-r="statut-commande"]').textContent()) === 'Prête' &&
     (await p.locator('[data-r="etape-suivi"][data-fait]').count()) === 7);

  // Signaler un problème
  await p.locator('[data-r="signaler-probleme"]').click();
  await p.getByRole('radio', { name: 'Retard' }).click();
  await p.getByRole('button', { name: 'Envoyer le signalement' }).click();
  ok('onglet : problème signalé, visible du client', await apparait(p.locator('[data-r="signalement"]').filter({ hasText: 'Retard' })));

  // Livraison, confirmation de réception, note
  await carte.locator('[data-r="etape-suivante"]').click();
  await apparait(carte.locator('[data-r="etape-suivante"]').filter({ hasText: 'Livrée' }));
  await carte.locator('[data-r="etape-suivante"]').click();
  await apparait(g.p.getByRole('tab', { name: /Terminées/ }));
  await g.ctx.close();
  await p.goto('http://localhost:4173/'); await apparait(p.locator('[data-r="accueil-fil"]'));
  await apparait(p.getByRole('button', { name: 'Mon profil' })); // session rechargée
  await p.getByRole('button', { name: /^Notifications/ }).first().click();
  await p.locator('[data-r="notification"]').filter({ hasText: 'Commande livrée' }).first().click();
  await p.locator('[data-r="confirmer-reception"]').click();
  ok('onglet : réception confirmée, le client peut noter', await apparait(p.locator('[data-r="noter-service"], [data-r="deja-note"]').first()));
  if (await p.locator('[data-r="noter-service"]').isVisible()) {
    for (const critere of ['Qualité du nettoyage', 'Respect du créneau', 'Prix']) await p.getByRole('radiogroup', { name: critere }).getByRole('radio', { name: '5 sur 5' }).click();
    await p.locator('[data-r="publier-note"]').click();
    ok('onglet : note publiée', await apparait(p.locator('[data-r="deja-note"]')));
  }

  ok('onglet : confirmé, le dépannage est accompli et rangé dans l’historique', await apparait(p.locator('[data-r="bandeau-historique"]')));

  // Recommander en un toucher : retour à la confirmation, tout pré-rempli
  await p.locator('[data-r="refaire-commande"]').click();
  ok('onglet : « Recommander » reprend la commande à la confirmation', await apparait(p.locator('[data-r="recap-commande"]').getByText(/3 × Chemise/)));

  // Historique, comme celui de Chrome : les dépannages accomplis, jour par jour
  await p.goto('http://localhost:4173/'); await apparait(p.locator('[data-r="accueil-fil"]'));
  await p.locator('[data-r="menu-plus-ouvrir"]').click();
  await p.getByRole('menuitem', { name: /Historique/ }).click();
  const accompli = p.locator('[data-r="depannage-accompli"]').first();
  ok('historique : le dépannage accompli y est, en tête, sous « Aujourd’hui »',
     (await apparait(accompli)) && /Pressing · 4 pièces/.test(await accompli.textContent()) &&
       (await p.locator('[data-r="historique"] section').first().getByRole('heading').textContent()) === "Aujourd'hui");
  await p.getByLabel("Rechercher dans l'historique").fill('climatisation introuvable xyz');
  ok('historique : la recherche filtre la liste', await apparait(p.getByText('Aucun résultat')));
  await p.getByRole('tab', { name: 'Recherches' }).click();
  ok('historique : l’onglet « Recherches » garde les recherches', (await p.getByRole('tab', { name: 'Recherches' }).getAttribute('aria-selected')) === 'true');
  await ctx.close();
}

// K bis · Accueil mobile « fil » (CONFIG.accueilMobile) : nom au centre, recherche, raccourcis, fil d'actualité
{
  const { ctx, p } = await neuve(390, 844);
  const accueil = p.locator('[data-r="accueil-fil"]');
  ok('accueil fil : nom TerraClick au centre, sans autre en-tête',
     (await apparait(accueil.getByRole('heading', { level: 1, name: 'TerraClick' }))) && (await p.locator('header').count()) === 0);
  ok('accueil fil : ville, cloche et profil en haut',
     (await accueil.getByLabel(/Votre ville/).count()) === 1 &&
       (await accueil.getByRole('button', { name: 'Notifications' }).isVisible()) &&
       (await p.locator('[data-r="fil-avatar"]').isVisible()));
  ok('accueil fil : barre de recherche avec logo et appareil photo',
     (await accueil.getByPlaceholder('Rechercher sur TerraClick').isVisible()) &&
       (await accueil.getByRole('button', { name: 'Montrer le problème en photo' }).isVisible()));
  ok('accueil fil : ni « Urgence » ni « Programmer »',
     await p.evaluate(() => ![...document.querySelectorAll('[data-r="accueil-fil"] button')].some((b) => /^(Urgence|Programmer)$/.test(b.textContent.trim()))));
  const raccourcis = () => p.locator('[data-r="raccourcis"] button').allTextContents();
  ok('raccourcis : les six secteurs, dont le pressing', (await raccourcis()).length === 6 && (await raccourcis()).includes('Pressing'));
  ok('fil d’actualité : de vraies activités de la plateforme', await apparait(p.locator('[data-r="actualite"]').first()));
  const onglets = await p.locator('[data-r="tabbar"] button:not([data-r="onglet-central"])').allTextContents();
  ok('barre du bas : Accueil, Favoris, Messages, Profil', onglets.join('|') === 'Accueil|Favoris|Messages|Profil');
  const centre = p.locator('[data-r="onglet-central"]');
  ok('barre du bas : bouton rond central entre Favoris et Messages, surélevé',
     await p.evaluate(() => {
       const c = document.querySelector('[data-r="onglet-central"]').getBoundingClientRect();
       const [fav, msg] = [...document.querySelectorAll('[data-r="tabbar"] button')].filter((b) => /^(Favoris|Messages)$/.test(b.textContent.trim())).map((b) => b.getBoundingClientRect());
       const barre = document.querySelector('[data-r="tabbar"]').getBoundingClientRect();
       return c.left > fav.right - 4 && c.right < msg.left + 4 && c.top < barre.top;
     }));
  await centre.click();
  ok('bouton central : ouvre « Mes onglets »', await apparait(p.getByRole('heading', { name: 'Mes onglets' })));
  await p.goBack();
  ok('accueil mobile : pas de défilement horizontal', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 390);

  // Un secteur cherché passe en tête des raccourcis.
  await p.locator('[data-r="raccourcis"]').getByRole('button', { name: 'Menuiserie' }).click();
  ok('raccourci : résultats du secteur', await apparait(p.getByRole('heading', { name: 'Menuiserie' })));
  await p.locator('[data-r="tabbar"]').getByRole('button', { name: /Accueil/ }).click();
  await apparait(accueil);
  ok('raccourcis : le secteur cherché récemment passe en tête', (await raccourcis())[0] === 'Menuiserie');
  await p.locator('[data-r="actualite"]').first().click();
  ok('une actualité ouvre la fiche du technicien', await apparait(p.getByRole('button', { name: /Demander ce technicien|Composer mon pack|Chat/ }).first()));
  await ctx.close();
}

// K quater · Menu ⋮ de l'accueil : entrées, historique, onglets, effacement, paramètres
{
  const { ctx, p } = await neuve(390, 844);
  const menu = p.locator('[data-r="menu-plus"]');
  const ouvrirMenu = async () => {
    if (!(await p.locator('[data-r="accueil-fil"]').isVisible().catch(() => false))) await p.getByRole('button', { name: "TerraClick, retour à l'accueil" }).click();
    await p.locator('[data-r="menu-plus-ouvrir"]').click();
    await apparait(menu);
  };
  ok('accueil : « Devenir partenaire » n’est plus sur la page (il est dans Paramètres)',
     (await apparait(p.locator('[data-r="accueil-fil"]'))) && (await p.locator('[data-r="devenir-partenaire"]').count()) === 0);
  await ouvrirMenu();
  const entrees = await menu.getByRole('menuitem').allTextContents();
  ok('menu ⋮ : rangée d’icônes et entrées du modèle',
     ['Mes onglets', 'Historique', 'Supprimer les données de navigation', 'Téléchargements', 'Favoris', 'Onglets récents', 'Paramètres']
       .every((n) => entrees.some((e) => e.startsWith(n))) &&
       (await menu.getByRole('menuitem', { name: 'Actualiser' }).count()) === 1);
  ok('menu ⋮ : « Personnaliser la page » et « Aide » marqués Bientôt', (await menu.getByText('Bientôt').count()) === 2);
  await p.keyboard.press('Escape');
  ok('menu ⋮ : Échap le referme', !(await menu.isVisible().catch(() => false)));

  // Une recherche s'inscrit dans l'historique et dans les onglets.
  await p.locator('[data-r="raccourcis"]').getByRole('button', { name: 'Serrurerie' }).click();
  await apparait(p.getByRole('heading', { name: 'Serrurerie' }));
  await ouvrirMenu();
  await menu.getByRole('menuitem', { name: 'Historique' }).click();
  ok('historique : la recherche y figure', await apparait(p.locator('[data-r="ligne-historique"]').getByText('Serrurerie').first()));
  await ouvrirMenu();
  await menu.getByRole('menuitem', { name: 'Mes onglets' }).click();
  ok('onglets : réservés aux accords conclus (une recherche seule n’y figure pas)', await apparait(p.getByText('Connectez-vous pour voir vos onglets')));
  await ouvrirMenu();
  await menu.getByRole('menuitem', { name: 'Supprimer les données de navigation' }).click();
  await p.getByRole('button', { name: 'Supprimer', exact: true }).click();
  await ouvrirMenu();
  await menu.getByRole('menuitem', { name: 'Historique' }).click();
  ok('données supprimées : historique vide', await apparait(p.getByText('Historique vide')));
  await ouvrirMenu();
  await menu.getByRole('menuitem', { name: 'Paramètres' }).click();
  ok('paramètres : ville et « Devenir prestataire »',
     (await apparait(p.locator('[data-r="devenir-partenaire"]'))) && (await p.getByRole('combobox', { name: 'Votre ville' }).count()) === 1);
  ok('paramètres : pas de défilement horizontal', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  await ctx.close();
}

// K quinquies · Onglets : recherche → contact → « Avez-vous conclu ? » → onglet, étapes et reçu
{
  const { ctx, p } = await neuve(390, 844);
  await p.locator('[data-r="fil-avatar"]').click();
  await connecterPage(p);
  await apparait(p.locator('[data-r="profil-mobile"]'));
  await p.getByRole('button', { name: "TerraClick, retour à l'accueil" }).click().catch(() => {});
  await p.goto('http://localhost:4173/'); await apparait(p.locator('[data-r="accueil-fil"]'));
  await p.getByPlaceholder('Rechercher sur TerraClick').fill('tuyau cassé');
  await p.locator('[data-r="search-go"]').click();
  await p.locator('[data-r="resultat"]').filter({ hasText: 'Koffi Tanoh' }).locator('[data-r="titre-resultat"]').click();
  // Fiche sur téléphone (CONFIG.ficheMobile) : profil centré, quitter en haut à droite, actions en icônes.
  const fiche = p.locator('[data-r="fiche-mobile"]');
  ok('fiche mobile : photo ronde, nom, quitter en haut à droite, sans en-tête ni « Retour »',
     (await apparait(fiche.locator('[data-r="photo-technicien"]'))) &&
       (await fiche.getByRole('heading', { level: 1, name: 'Koffi Tanoh' }).isVisible()) &&
       (await fiche.getByRole('button', { name: 'Quitter la fiche' }).evaluate((e) => e.getBoundingClientRect().right > window.innerWidth - 40)) &&
       (await p.locator('header').count()) === 0 && (await p.getByText('← Retour').count()) === 0);
  ok('fiche mobile : les deux icônes en bas du bloc des tarifs, puis les avis en bas',
     (await fiche.locator('[data-r="bloc-presentation"]').getByRole('button', { name: 'Contacter directement' }).isVisible()) &&
       (await fiche.locator('[data-r="bloc-presentation"]').getByRole('button', { name: 'Demander ce technicien' }).isVisible()) &&
       (await fiche.locator('section').last().getAttribute('data-r')) === 'avis-clients');
  await fiche.getByRole('button', { name: 'Contacter directement' }).click();
  ok('fiche mobile : « Contacter » propose appel, WhatsApp ou message', await apparait(p.getByRole('dialog', { name: 'Contacter directement' }).getByText('Message dans TerraClick')));
  await p.getByRole('dialog', { name: 'Contacter directement' }).getByRole('button', { name: 'Message dans TerraClick' }).click();
  // Après l'échange avec le technicien, l'application demande si l'accord est conclu.
  const question = p.getByRole('dialog', { name: 'Avez-vous conclu avec Koffi Tanoh ?' });
  ok('contact : « Avez-vous conclu ? » est posée au retour', await apparait(question, 20000));
  ok('contact : la prestation cherchée est reprise', (await question.getByLabel('Travail convenu').inputValue()) === 'Réparation de tuyau cassé');
  await question.getByLabel(/Montant convenu/).fill('12 000');
  await question.getByRole('button', { name: 'Oui, accord conclu' }).click();
  const carte = p.locator('[data-r="onglet"]').filter({ hasText: 'Réparation de tuyau cassé' }).filter({ hasText: '12 000 F' }).first();
  ok('onglets : l’accord conclu y figure', await apparait(carte));
  await carte.click();
  ok('onglet : les étapes qui ont mené à l’accord',
     (await apparait(p.getByText('Recherche « tuyau cassé »'))) && (await p.getByText('Contact : Message dans TerraClick').isVisible()) &&
       (await p.getByText('Accord conclu, confirmé par vous').isVisible()));
  ok('onglet : reçu avec référence, prêt à télécharger',
     (await p.locator('[data-r="recu-accord"]').getByText(/^ACC-\d{4}-\d{5}$/).isVisible()) && (await p.locator('[data-r="telecharger-recu"]').isVisible()));
  await p.getByRole('button', { name: 'Intervention terminée' }).click();
  ok('onglet : intervention marquée terminée', await apparait(p.getByText('Intervention terminée', { exact: true }).first()));
  await ctx.close();
}

// K ter · Profil sur téléphone : grand titre sans logo ni ville, carte d'identité, menu, titre réduit au défilement
{
  const { ctx, p } = await neuve(390, 844);
  await p.locator('[data-r="tabbar"]').getByRole('button', { name: /Profil/ }).click();
  await connecterPage(p);
  const profil = p.locator('[data-r="profil-mobile"]');
  ok('profil mobile : écran Profil après connexion', await apparait(profil));
  ok('profil mobile : grand titre, ni logo, ni ville, ni onglets horizontaux',
     (await profil.getByRole('heading', { level: 1, name: 'Profil' }).isVisible()) &&
       (await p.locator('header').count()) === 0 &&
       !(await p.getByRole('navigation', { name: 'Espace client' }).isVisible().catch(() => false)));
  ok('profil mobile : carte d’identité avec le nom et « Vérifié »',
     (await profil.locator('[data-r="carte-identite"]').getByText('Aya Konan').isVisible()) &&
       (await profil.locator('[data-r="carte-identite"]').getByText('Vérifié').isVisible()));
  ok('profil mobile épuré : « Paramètres du compte » seul, sans « Devenir prestataire » ni autres lignes',
     (await profil.getByRole('button', { name: /Paramètres du compte/ }).isVisible()) &&
       (await profil.getByText('Devenir prestataire').count()) === 0 &&
       (await profil.getByText(/Moyens de paiement|Aide & support|Parrainer un ami|Adresses enregistrées|Mentions légales/).count()) === 0 &&
       (await profil.getByRole('button', { name: 'Se déconnecter' }).isVisible()));
  ok('profil mobile : barre de titre réduite cachée en haut de page',
     (await p.locator('[data-r="barre-titre"]').evaluate((e) => getComputedStyle(e).opacity)) === '0');
  // Profil épuré, donc court : un écran plus petit permet de le faire défiler.
  await p.setViewportSize({ width: 390, height: 420 });
  await p.evaluate(() => window.scrollTo(0, 600));
  await p.waitForTimeout(400);
  ok('profil mobile : au défilement, le titre réduit apparaît dans la barre fixe',
     (await p.locator('[data-r="barre-titre"]').evaluate((e) => getComputedStyle(e).opacity)) === '1');
  await p.setViewportSize({ width: 390, height: 844 });
  await profil.getByRole('button', { name: /Paramètres du compte/ }).click();
  ok('« Paramètres du compte » ouvre la page, avec un retour vers Profil', await apparait(p.locator('[data-r="retour-compte"]')));
  await p.locator('[data-r="retour-compte"]').click();
  ok('le retour ramène au Profil', await apparait(profil));
  ok('profil mobile : pas de défilement horizontal', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  // Photo de profil : ajoutée depuis le profil, gardée en base, visible dans l'en-tête, puis retirée.
  await p.evaluate(() => window.scrollTo(0, 0));
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP4z8DwHwyBNBMDGAMA7fwH+ZfS+DQAAAAASUVORK5CYII=', 'base64');
  await profil.locator('[data-r="carte-identite"] input[type="file"]').setInputFiles({ name: 'moi.png', mimeType: 'image/png', buffer: png });
  ok('photo de profil ajoutée', await apparait(profil.locator('[data-r="carte-identite"] img')));
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.locator('[data-r="tabbar"]').getByRole('button', { name: /Accueil/ }).click();
  ok('accueil connecté : la photo de profil en haut à droite', await apparait(p.locator('[data-r="fil-avatar"] img')));
  await p.locator('[data-r="fil-avatar"]').click();
  ok('photo gardée en base : visible dans le profil après rechargement', await apparait(profil.locator('[data-r="carte-identite"] img')));
  await p.getByRole('button', { name: 'Retirer la photo' }).click();
  ok('photo retirée : les initiales reviennent', await apparait(p.locator('[data-r="carte-identite"]').getByText('AK')));
  await p.locator('[data-r="tabbar"]').getByRole('button', { name: /Favoris/ }).click();
  ok('onglet Favoris : état vide soigné', await apparait(p.getByRole('heading', { name: "Aucun favori pour l'instant" })));
  await ctx.close();
}

// L · Espace prestataire : entrée, rail, demandes, réponse, fenêtres, réalisations
{
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: 'Devenir partenaire' }).first().click();
  ok('« Devenir partenaire » demande un compte', await apparait(p.getByText(MUR)));
  await connecter(p);
  ok('après connexion : tableau de bord prestataire', await apparait(p.getByRole('heading', { name: 'Tableau de bord' })));
  ok('espace pro : ni en-tête ni pied de page du site d’annonces',
     !(await p.getByText('Urgence 24/24').isVisible().catch(() => false)) &&
       (await p.getByText('Tous droits réservés', { exact: false }).count()) === 0);
  ok('tableau de bord : consignes de l’administration', await apparait(p.getByText('Ajouter une photo ou un logo').first()));

  const rail = p.getByRole('complementary', { name: 'Espace prestataire' });
  await rail.getByRole('button', { name: /Consignes/ }).click();
  await p.getByRole('button', { name: 'Marquer exécutée' }).first().click();
  ok('consigne exécutée : passe dans « Exécutées »', await apparait(p.getByText('Consigne exécutée')));
  await rail.getByRole('button', { name: /Demandes clients/ }).click();
  await apparait(p.getByRole('heading', { name: 'Demandes de devis' }));
  await p.getByRole('button', { name: 'Acceptées', exact: true }).click();
  const cartes = await p.getByRole('button', { name: 'Voir la demande' }).count();
  ok('filtre « Acceptées » : une seule demande', cartes === 1);
  await p.getByRole('button', { name: 'Toutes', exact: true }).click();
  await p.getByRole('button', { name: 'Voir la demande' }).first().click();
  ok('détail de la demande ouvert', await apparait(p.getByRole('heading', { name: 'Awa · Plomberie' })));

  await p.getByRole('button', { name: 'Marquer la prestation terminée' }).click();
  ok('fenêtre « Marquer la prestation terminée »', await apparait(p.getByRole('dialog')));
  await p.keyboard.press('Escape');
  ok('Échap referme la fenêtre', !(await p.getByRole('dialog').isVisible().catch(() => false)));
  await p.getByRole('button', { name: 'Déclarer un paiement reçu' }).click();
  ok('déclaration de paiement : montant, moyen et date', await apparait(p.getByLabel('Moyen')));
  await p.getByRole('button', { name: 'Enregistrer ma déclaration' }).click();
  ok('déclaration confirmée par un toast', await apparait(p.getByText('Déclaration enregistrée')));

  await p.getByRole('button', { name: 'Envoyer ma réponse' }).click();
  ok('réponse vide refusée', await apparait(p.getByText('Message trop court')));
  await p.getByLabel('Message au client').fill('Je passe mardi à 9 h, le joint est à changer.');
  await p.getByRole('button', { name: 'Envoyer ma réponse' }).click();
  await apparait(p.getByRole('heading', { name: 'Demandes de devis' }));
  ok('réponse envoyée : la demande passe à « Répondue »', (await p.getByText('Répondue', { exact: true }).count()) >= 2);

  await rail.getByRole('button', { name: /Réalisations/ }).click();
  await p.getByRole('button', { name: 'Ajouter une photo' }).first().click();
  await rail.getByRole('button', { name: /Fiche professionnelle/ }).click();
  ok('photo ajoutée visible dans le profil (4 sur 5)', await apparait(p.getByText(/^4$/).first()));

  for (const [entree, titre] of [
    [/Vérification/, 'Soumettre à vérification'],
    [/Facturation/, 'Abonnement et factures'],
    [/Mise en avant/, 'Mise en avant'],
    [/Avis clients/, 'Mes avis'],
    [/Notifications/, 'Notifications'],
  ]) {
    await rail.getByRole('button', { name: entree }).click();
    ok(`rail : écran « ${titre} »`, await apparait(p.getByRole('heading', { name: titre, exact: true })));
  }
  await p.getByRole('button', { name: 'Tout marquer comme lu' }).click();
  ok('notifications lues : plus de pastille « Nouveau »', !(await p.getByText('Nouveau', { exact: true }).isVisible().catch(() => false)));
  await rail.getByRole('button', { name: "Quitter l'espace pro" }).click();
  ok('« Quitter l’espace pro » ramène au site', await apparait(p.getByText('Recherches populaires')));
  await ctx.close();
}

// M · Espace prestataire sur téléphone : par Paramètres (menu ⋮), application avec navigation basse
{
  const { ctx, p } = await neuve(390, 844);
  await p.locator('[data-r="menu-plus-ouvrir"]').click();
  await p.locator('[data-r="menu-plus"]').getByRole('menuitem', { name: 'Paramètres' }).click();
  await p.locator('[data-r="devenir-partenaire"]').click();
  await connecter(p);
  await apparait(p.getByRole('heading', { name: 'Tableau de bord' }));
  const bas = p.getByRole('navigation', { name: "Navigation de l'espace pro" });
  ok('mobile : navigation basse de l’application', await apparait(bas));
  ok('mobile : pas de barre d’onglets du site public', !(await p.locator('[data-r="tabbar"]').isVisible().catch(() => false)));
  await bas.getByRole('button', { name: /Demandes/ }).click();
  ok('mobile : onglet Demandes', await apparait(p.getByRole('heading', { name: 'Demandes de devis' })));
  await bas.getByRole('button', { name: 'Plus' }).click();
  await p.getByRole('dialog', { name: 'Autres modules' }).getByRole('button', { name: /Factures/ }).click();
  ok('mobile : « Plus » mène aux factures, affichées en cartes',
     await apparait(p.locator('[data-r="factures-cartes"]').getByText('FAC-2026-00042')));
  ok('mobile : pas de défilement horizontal', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  await ctx.close();
}

// Modes de l'accueil (Recherche / Autour de moi / Box intelligente) masqués dans le MVP
// (CONFIG.modesAccueil). La première moitié de N ne tourne que s'ils sont rebranchés.
const MODES_ACCUEIL = false;
// Bascule Liste / Carte des résultats, masquée elle aussi (CONFIG.carteResultats).
const CARTE_RESULTATS = false;

// N bis · MVP : ni bascule des modes sous la recherche, ni onglet « Carte » sur mobile
if (!MODES_ACCUEIL) {
  const { ctx, p } = await neuve();
  ok('MVP : pas de bouton « Autour de moi » ni « Box intelligente »',
     (await p.getByRole('button', { name: /Autour de moi|Box intelligente/ }).count()) === 0 &&
       (await p.locator('[data-r="modes"]').count()) === 0);
  await ctx.close();
  const mobile = await neuve(390, 844);
  ok('MVP : pas d’onglet « Carte » dans la barre mobile',
     (await mobile.p.locator('[data-r="tabbar"]').getByRole('button', { name: 'Carte' }).count()) === 0);
  await mobile.ctx.close();
}

// N · Visiteur : la Box intelligente et la carte sont réservées aux clients inscrits
{
  const { ctx, p } = await neuve();
  if (MODES_ACCUEIL) {
    await p.getByRole('button', { name: /Box intelligente/ }).click();
    ok('visiteur : la Box intelligente demande un compte', await apparait(p.getByText(MUR)));
    await p.getByRole('button', { name: 'Fermer' }).click();
    ok('visiteur : la Box reste fermée sans compte', !(await p.getByText('Ce que la Box sait faire').isVisible().catch(() => false)));
    await p.getByRole('button', { name: /Autour de moi/ }).click();
    ok('visiteur : « Autour de moi » demande un compte', await apparait(p.getByText(MUR)));
    await p.getByRole('button', { name: 'Fermer' }).click();
    // Fenêtre refermée : l'action abandonnée ne doit pas se rejouer après une connexion ultérieure.
    await p.getByRole('button', { name: 'Se connecter' }).click();
    await connecterPage(p);
    await apparait(p.getByRole('heading', { name: 'Bonjour, Aya' }));
    ok('action abandonnée non rejouée après une autre connexion',
       !(await p.getByText('Ce que la Box sait faire').isVisible().catch(() => false)) &&
         (await p.getByRole('heading', { name: 'Bonjour, Aya' }).isVisible()));
    await p.getByRole('button', { name: 'Aya Konan' }).click();
    await apparait(p.getByRole('button', { name: 'Se connecter' }));
    await p.getByRole('button', { name: 'TerraClick, retour à l\'accueil' }).click();
  }
  await p.getByPlaceholder(/Quel est votre problème/).fill('Koffi');
  await p.locator('[data-r="search-go"]').click();
  await apparait(p.getByText('Koffi Tanoh').first());
  if (CARTE_RESULTATS) {
    await p.getByRole('button', { name: /^Carte/ }).click();
    ok('visiteur : la vue carte des résultats demande un compte', await apparait(p.getByText(MUR)));
    await connecter(p);
    ok('après connexion : la carte s’ouvre', await apparait(p.locator('[data-r="map-canvas"]')));
  } else {
    ok('MVP : résultats en liste, sans bouton « Liste » ni « Carte »',
       (await p.getByRole('button', { name: /^(Liste|Carte)/ }).count()) === 0 &&
         (await p.locator('[data-r="map-canvas"]').count()) === 0 &&
         (await p.locator('[data-r="pro-card"]').count()) > 0);
  }
  await ctx.close();
}

// O · Espace client : tableau de bord, demandes, suivi, devis ciblé, profil enregistré
{
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: 'Se connecter' }).click();
  await connecterPage(p);
  ok('client : connexion ouvre le tableau de bord', await apparait(p.getByRole('heading', { name: 'Bonjour, Aya' })));
  ok('client : tableau de bord « Actions à faire »', await apparait(p.getByRole('heading', { name: 'Actions à faire' })));
  ok('client : en-tête et pied de page du site conservés',
     (await p.getByText('Tous droits réservés', { exact: false }).count()) === 1);

  // Deux demandes réelles pour ce passage : l'une que le technicien (Koffi Tanoh) accepte puis
  // termine par l'API, l'autre laissée en attente pour l'annulation.
  const refs = await p.evaluate(async (mdp) => {
    const appel = async (chemin, methode = 'GET', corps, jeton = localStorage.getItem('sy.jeton')) => {
      const r = await fetch('/api' + chemin, {
        method: methode,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer ' + jeton },
        body: corps ? JSON.stringify(corps) : undefined,
      });
      return r.json();
    };
    const villes = (await appel('/villes')).data;
    const habitat = villes.flatMap((v) => v.quartiers).find((q) => q.slug === 'habitat').id;
    const koffi = (await appel('/recommandations?secteur=plomberie&quartier=' + habitat)).data.find((t) => t.nom === 'Koffi Tanoh').id;
    const demande = { secteur: 'plomberie', probleme: "Fuite d'eau", quartier_id: habitat, quand: 'maintenant', mode: 'choisi', prestataire_id: koffi, paiement: 'especes' };
    const a = (await appel('/demandes', 'POST', demande)).data;
    const b = (await appel('/demandes', 'POST', { ...demande, probleme: 'Robinet cassé' })).data;
    const tech = (await appel('/auth/connexion', 'POST', { telephone: '07 07 07 07 07', mot_de_passe: mdp })).token;
    await appel(`/pro/demandes/${a.id}/accepter`, 'POST', { message: 'Je passe dans 30 minutes.', estimation: 20000, creneau: "Aujourd'hui, 15 h" }, tech);
    await appel(`/pro/demandes/${a.id}/terminer`, 'POST', {}, tech);
    return { terminee: a.reference, attente: b.reference };
  }, MDP);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.getByRole('button', { name: 'Mon espace' }).click();
  ok('client : la fin marquée par le technicien attend une confirmation', await apparait(p.getByText('Confirmer une fin de prestation').first()));

  const onglets = p.getByRole('navigation', { name: 'Espace client' });
  await onglets.getByRole('button', { name: /Mes demandes/ }).click();
  await apparait(p.locator('[data-r="demande-client"]').first());
  ok('client : « Mes demandes » vient de la base, avec ses statuts réels',
     (await p.locator('[data-r="demande-client"]').filter({ hasText: refs.terminee }).filter({ hasText: 'Marquée terminée' }).count()) === 1 &&
       (await p.locator('[data-r="demande-client"]').filter({ hasText: refs.attente }).filter({ hasText: 'Envoyée' }).count()) === 1);
  await p.getByRole('button', { name: 'Terminées', exact: true }).click();
  ok('client : filtre « Terminées »', (await p.getByRole('button', { name: 'Voir la demande' }).count()) >= 1);
  await p.getByRole('button', { name: 'Toutes', exact: true }).click();
  await p.locator('[data-r="demande-client"]').filter({ hasText: refs.terminee }).getByRole('button', { name: 'Voir la demande' }).click();
  ok('client : suivi réel, réponse et estimation du technicien',
     (await apparait(p.getByRole('heading', { name: "Fuite d'eau · Plomberie" }))) &&
       (await p.getByText('« Je passe dans 30 minutes. »').isVisible()) && (await p.getByText('20 000 F').first().isVisible()));
  await p.getByRole('button', { name: 'Signaler un problème' }).click();
  ok('client : fenêtre de signalement avec motif', await apparait(p.getByLabel('Motif')));
  await p.keyboard.press('Escape');
  await p.getByRole('button', { name: 'Confirmer la fin de prestation' }).click();
  await p.getByRole('dialog').getByRole('button', { name: 'Confirmer la fin de prestation' }).click();
  ok('client : fin confirmée et enregistrée, « Laisser un avis » proposé',
     (await apparait(p.getByRole('button', { name: 'Laisser un avis' }))) && (await p.locator('[data-r="statut-suivi"]').textContent()) === 'Terminée');

  await onglets.getByRole('button', { name: /Mes demandes/ }).click();
  await p.locator('[data-r="demande-client"]').filter({ hasText: refs.attente }).getByRole('button', { name: 'Voir la demande' }).click();
  await p.getByRole('button', { name: 'Annuler la demande' }).click();
  await p.getByRole('dialog').getByRole('button', { name: 'Annuler la demande' }).click();
  ok('client : demande en attente annulée', await apparait(p.locator('[data-r="statut-suivi"]').getByText('Annulée')));

  await onglets.getByRole('button', { name: /Mes demandes/ }).click();
  await p.getByRole('button', { name: 'Nouvelle demande' }).click();
  ok('client : « Nouvelle demande » ouvre l’assistant de demande', await apparait(p.getByRole('heading', { name: 'De quel service avez-vous besoin ?' })));
  await p.goBack();
  await p.goBack();

  await onglets.getByRole('button', { name: /Mon profil/ }).click();
  const email = `aya.${Date.now()}@exemple.ci`;
  await p.getByLabel('E-mail (facultatif)').fill(email);
  await p.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await apparait(p.getByText('Profil enregistré'));
  const moi = await p.evaluate(async () => {
    const r = await fetch('/api/moi', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + localStorage.getItem('sy.jeton') } });
    return (await r.json()).data;
  });
  ok('client : profil réellement enregistré par l’API', moi?.email === email);

  await onglets.getByRole('button', { name: /Mon compte/ }).click();
  ok('client : « Mon compte » garde la page existante', await apparait(p.getByText('Mes équipements')));
  await ctx.close();
}

await b.close();
console.log(R.join('\n'));
const reussies = R.filter((x) => x.startsWith('  OK')).length;
console.log('\n' + reussies + ' / ' + R.length + ' règles vérifiées');
process.exit(reussies === R.length ? 0 : 1);
