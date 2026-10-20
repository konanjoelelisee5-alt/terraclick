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
const apparait = (loc, ms = 5000) => loc.waitFor({ state: 'visible', timeout: ms }).then(() => true, () => false);

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
async function connecter(p, tel = '07 58 42 19 03') {
  await p.getByLabel('Votre numéro de téléphone').fill(tel);
  await p.getByRole('button', { name: 'Recevoir mon code' }).click();
  await p.getByText(/appuyer pour remplir/).click();
  // La feuille se referme (numéro connu) ou passe au profil (numéro inconnu).
  await apparait(p.getByText('Entrez le code'), 100);
  await p.getByText('Entrez le code').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(150);
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
  ok('le mur monte au moment d’agir', await p.getByText('Votre numéro, et c\'est parti').isVisible());
  await connecter(p);
  ok('numéro connu : connexion immédiate, pas d’étape profil',
     !(await p.getByText('Comment on vous appelle ?').isVisible().catch(() => false)));
  ok('l’action interrompue reprend (le chat s’ouvre)',
     await apparait(p.getByPlaceholder('Écrivez votre message…')));
  await ctx.close();
}

// B · Numéro inconnu dans la feuille basse (le mur) : création du profil en deux champs
{
  const { ctx, p } = await neuve();
  await p.getByPlaceholder(/Quel est votre problème/).fill('Koffi');
  await p.locator('[data-r="search-go"]').click();
  await p.getByRole('button', { name: 'Chat', exact: true }).first().click();
  await apparait(p.getByText('Votre numéro, et c\'est parti'));
  await p.getByLabel('Votre numéro de téléphone').fill('07 11 22 33 44');
  await p.getByRole('button', { name: 'Recevoir mon code' }).click();
  await p.getByText(/appuyer pour remplir/).click();
  ok('numéro inconnu : le profil est demandé', await apparait(p.getByText('Comment on vous appelle ?')));
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

// G bis · MVP : seuls les cinq secteurs sont ouverts, le module Construction est masqué
if (!MODULE_CONSTRUCTION) {
  const { ctx, p } = await neuve();
  ok('MVP : pas d’entrée « Construction » ni « Mes projets »',
     (await p.getByRole('button', { name: 'Construction', exact: true }).count()) === 0 &&
       (await p.getByRole('button', { name: 'Mes projets', exact: true }).count()) === 0);
  ok('MVP : les cinq secteurs sur l’accueil',
     (await Promise.all(['Plomberie', 'Électricité', 'Climatisation', 'Serrurerie', 'Menuiserie']
       .map((s) => p.getByRole('button', { name: s, exact: true }).isVisible()))).every(Boolean));
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
  ok('phrase libre : l’assistant s’ouvre sur la plomberie',
     await apparait(p.getByRole('heading', { name: 'Quel est le problème ?' })) &&
       (await p.getByText('Plomberie · Étape 1 sur 4').isVisible()));
  await p.goto('http://localhost:4173/'); await p.waitForTimeout(300);
  // Visiteur : le rechargement rouvre la connexion ; on revient à l'accueil.
  await p.getByRole('button', { name: "Retour à l'accueil", exact: true }).click();
  await p.getByPlaceholder(/Quel est votre problème/).fill("grosse fuite d'eau dans la cuisine");
  await p.locator('[data-r="search-go"]').click();
  await apparait(p.getByRole('heading', { name: 'Quel est le problème ?' }));
  ok('problème nommé : « Fuite d’eau » est présélectionné',
     (await p.getByRole('radio', { name: "Fuite d'eau" }).getAttribute('aria-checked')) === 'true');
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
  ok('aucune inscription demandée avant la confirmation', !(await p.getByText('Votre numéro, et c\'est parti').isVisible().catch(() => false)));
  await p.getByRole('radio', { name: /Mobile Money/ }).click();
  await p.getByRole('button', { name: 'Confirmer ma demande' }).click();
  ok('confirmer demande un compte', await apparait(p.getByText('Votre numéro, et c\'est parti')));
  await connecter(p);
  ok('demande envoyée par l’API, avec sa référence',
     await apparait(p.getByRole('heading', { name: 'Demande envoyée' }), 8000) && (await p.getByText(/Référence DEM-\d{4}-\d{5}/).isVisible()));
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

// I · Page Connexion : erreurs du serveur, compte connu, numéro inconnu renvoyé vers l'inscription
{
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: 'Se connecter' }).click();
  ok('« Se connecter » ouvre la page Connexion', await apparait(p.getByRole('tab', { name: 'Connexion', selected: true })));
  await p.getByLabel('Numéro de téléphone', { exact: true }).fill('09 12 34 56 78');
  await p.getByRole('button', { name: 'Recevoir mon code' }).click();
  ok('numéro refusé par le serveur : le motif s’affiche', await apparait(p.getByText(/pas un numéro ivoirien valide/)));

  await p.getByLabel('Numéro de téléphone', { exact: true }).fill('07 58 42 19 03');
  await p.getByRole('radio', { name: /WhatsApp/ }).click();
  await p.getByRole('button', { name: 'Recevoir mon code' }).click();
  ok('code demandé par WhatsApp : le canal est rappelé', await apparait(p.getByText(/Code reçu par WhatsApp/)));
  await p.getByText(/appuyer pour remplir/).click();
  ok('compte connu : connexion puis espace client', await apparait(p.getByText('Aya Konan').first()));
  await ctx.close();

  const second = await neuve();
  await second.p.getByRole('button', { name: 'Se connecter' }).click();
  await second.p.getByLabel('Numéro de téléphone', { exact: true }).fill(numeroNeuf());
  await second.p.getByRole('button', { name: 'Recevoir mon code' }).click();
  await second.p.getByText(/appuyer pour remplir/).click();
  ok('numéro inconnu : renvoyé vers l’inscription, numéro déjà vérifié',
     await apparait(second.p.getByText(/vérifié\. Il ne reste qu'à compléter votre profil/)));
  await second.p.getByLabel('Nom complet').fill('Kouassi Test');
  await second.p.locator('.sy-choice').click();
  await second.p.getByRole('button', { name: 'Terminer mon inscription' }).click();
  ok('profil complété sans nouveau code', await apparait(second.p.getByText('Kouassi Test').first()));
  await second.ctx.close();
}

// J · Page Inscription : formulaire, code, puis compte avec e-mail et ville ; session gardée
{
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: "S'inscrire" }).click();
  ok('« S’inscrire » ouvre la page Inscription', await apparait(p.getByRole('tab', { name: 'Inscription', selected: true })));
  await p.getByLabel('Nom complet').fill('Awa Test');
  await p.getByRole('button', { name: 'Créer mon compte' }).click();
  ok('conditions non acceptées : inscription bloquée', await apparait(p.getByText(/Acceptez les conditions/)));

  const numero = numeroNeuf();
  await p.getByLabel('E-mail (facultatif)').fill(`awa.${numero}@exemple.ci`);
  await p.getByLabel('Numéro de téléphone', { exact: true }).fill(numero);
  await p.getByLabel('Quartier').selectOption({ label: 'Kokrenou' });
  await p.locator('.sy-choice').click();
  await p.getByRole('button', { name: 'Créer mon compte' }).click();
  await p.getByText(/appuyer pour remplir/).click();
  ok('compte créé : le nom apparaît dans l’en-tête', await apparait(p.getByText('Awa Test').first()));
  const moi = await p.evaluate(async () => {
    const r = await fetch('/api/moi', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + localStorage.getItem('sy.jeton') } });
    return (await r.json()).data;
  });
  ok('e-mail, ville et quartier enregistrés',
     moi?.email === `awa.${numero}@exemple.ci` && moi?.ville?.nom === 'Yamoussoukro' && moi?.quartier?.nom === 'Kokrenou');
  await p.reload({ waitUntil: 'domcontentloaded' });
  ok('la session survit au rechargement de la page', await apparait(p.getByText('Awa Test').first()));
  await ctx.close();
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
  ok('formulaire plein écran : ni en-tête ni barre du bas',
     (await p.locator('header').count()) === 0 && (await p.locator('[data-r="tabbar"]').count()) === 0);
  await p.getByRole('tab', { name: 'Inscription' }).click();
  ok('bascule vers l’inscription', await apparait(p.getByRole('button', { name: /Créer mon compte/ })));
  await p.getByRole('button', { name: "Retour à l'accueil", exact: true }).click();
  ok('flèche retour : accueil en visiteur', await apparait(p.locator('[data-r="accueil-mobile"]')));
  await ctx.close();
}

// K bis · Accueil mobile : logo seulement dans l'en-tête, deux actions, 4 onglets, rien qui déborde
{
  const { ctx, p } = await neuve(390, 844);
  await p.waitForTimeout(500);
  const accueil = p.locator('[data-r="accueil-mobile"]');
  ok('accueil mobile : accroche et pas de second logo',
     (await accueil.getByRole('heading', { name: 'Trouvez le bon technicien' }).isVisible()) &&
       (await accueil.locator('[data-r="hero-marque"]').count()) === 0);
  ok('accueil mobile : pas de menu des catégories dans la recherche', (await p.locator('[data-r="search-depts"]').count()) === 0);
  ok('accueil mobile : « Urgence » et « Programmer » côte à côte',
     await p.evaluate(() => {
       const [u, g] = [...document.querySelectorAll('[data-r="accueil-mobile"] button')].filter((b) => /^(Urgence|Programmer)$/.test(b.textContent.trim()));
       return !!u && !!g && Math.abs(u.getBoundingClientRect().top - g.getBoundingClientRect().top) < 2;
     }));
  const onglets = await p.locator('[data-r="tabbar"] button').allTextContents();
  ok('barre du bas : Accueil, Favoris, Réservations, Messages, Profil', onglets.join('|') === 'Accueil|Favoris|Réservations|Messages|Profil');
  ok('accueil mobile : pas de défilement horizontal', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  await ctx.close();
}

// K ter · Profil sur téléphone : grand titre sans logo ni ville, carte d'identité, menu, titre réduit au défilement
{
  const { ctx, p } = await neuve(390, 844);
  await p.locator('[data-r="tabbar"]').getByRole('button', { name: /Profil/ }).click();
  await p.getByLabel('Numéro de téléphone', { exact: true }).fill('07 58 42 19 03');
  await p.getByRole('button', { name: 'Recevoir mon code' }).click();
  await p.getByText(/appuyer pour remplir/).click();
  const profil = p.locator('[data-r="profil-mobile"]');
  ok('profil mobile : écran Profil après connexion', await apparait(profil));
  ok('profil mobile : grand titre, ni logo, ni ville, ni onglets horizontaux',
     (await profil.getByRole('heading', { level: 1, name: 'Profil' }).isVisible()) &&
       (await p.locator('header').count()) === 0 &&
       !(await p.getByRole('navigation', { name: 'Espace client' }).isVisible().catch(() => false)));
  ok('profil mobile : carte d’identité avec le nom et « Vérifié »',
     (await profil.locator('[data-r="carte-identite"]').getByText('Aya Konan').isVisible()) &&
       (await profil.locator('[data-r="carte-identite"]').getByText('Vérifié').isVisible()));
  ok('profil mobile : barre de titre réduite cachée en haut de page',
     (await p.locator('[data-r="barre-titre"]').evaluate((e) => getComputedStyle(e).opacity)) === '0');
  await p.evaluate(() => window.scrollTo(0, 600));
  await p.waitForTimeout(400);
  ok('profil mobile : au défilement, le titre réduit apparaît dans la barre fixe',
     (await p.locator('[data-r="barre-titre"]').evaluate((e) => getComputedStyle(e).opacity)) === '1');
  await profil.getByRole('button', { name: /Paramètres du compte/ }).click();
  ok('« Paramètres du compte » ouvre la page, avec un retour vers Profil', await apparait(p.locator('[data-r="retour-compte"]')));
  await p.locator('[data-r="retour-compte"]').click();
  ok('le retour ramène au Profil', await apparait(profil));
  ok('profil mobile : pas de défilement horizontal', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  await p.locator('[data-r="tabbar"]').getByRole('button', { name: /Favoris/ }).click();
  ok('onglet Favoris : état vide soigné', await apparait(p.getByRole('heading', { name: "Aucun favori pour l'instant" })));
  await ctx.close();
}

// L · Espace prestataire : entrée, rail, demandes, réponse, fenêtres, réalisations
{
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: 'Devenir partenaire' }).first().click();
  ok('« Devenir partenaire » demande un compte', await apparait(p.getByText('Votre numéro, et c\'est parti')));
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

// M · Espace prestataire sur téléphone : application avec navigation basse
{
  const { ctx, p } = await neuve(390, 844);
  await p.getByRole('button', { name: 'Devenir partenaire' }).first().click();
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
    ok('visiteur : la Box intelligente demande un compte', await apparait(p.getByText('Votre numéro, et c\'est parti')));
    await p.getByRole('button', { name: 'Fermer' }).click();
    ok('visiteur : la Box reste fermée sans compte', !(await p.getByText('Ce que la Box sait faire').isVisible().catch(() => false)));
    await p.getByRole('button', { name: /Autour de moi/ }).click();
    ok('visiteur : « Autour de moi » demande un compte', await apparait(p.getByText('Votre numéro, et c\'est parti')));
    await p.getByRole('button', { name: 'Fermer' }).click();
    // Fenêtre refermée : l'action abandonnée ne doit pas se rejouer après une connexion ultérieure.
    await p.getByRole('button', { name: 'Se connecter' }).click();
    await p.getByLabel('Numéro de téléphone', { exact: true }).fill('07 58 42 19 03');
    await p.getByRole('button', { name: 'Recevoir mon code' }).click();
    await p.getByText(/appuyer pour remplir/).click();
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
    ok('visiteur : la vue carte des résultats demande un compte', await apparait(p.getByText('Votre numéro, et c\'est parti')));
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
  await p.getByLabel('Numéro de téléphone', { exact: true }).fill('07 58 42 19 03');
  await p.getByRole('button', { name: 'Recevoir mon code' }).click();
  await p.getByText(/appuyer pour remplir/).click();
  ok('client : connexion ouvre le tableau de bord', await apparait(p.getByRole('heading', { name: 'Bonjour, Aya' })));
  ok('client : actions à faire', await apparait(p.getByText('Confirmer une fin de prestation')));
  ok('client : en-tête et pied de page du site conservés',
     (await p.getByText('Tous droits réservés', { exact: false }).count()) === 1);

  const onglets = p.getByRole('navigation', { name: 'Espace client' });
  await onglets.getByRole('button', { name: /Mes demandes/ }).click();
  await p.getByRole('button', { name: 'Terminées', exact: true }).click();
  ok('client : filtre « Terminées »', (await p.getByRole('button', { name: 'Voir la demande' }).count()) === 1);
  await p.getByRole('button', { name: 'Toutes', exact: true }).click();
  await p.getByRole('button', { name: 'Voir la demande' }).first().click();
  ok('client : suivi de la demande', await apparait(p.getByRole('heading', { name: /Fuite sous l'évier/ })));
  await p.getByRole('button', { name: 'Signaler un problème' }).click();
  ok('client : fenêtre de signalement avec motif', await apparait(p.getByLabel('Motif')));
  await p.keyboard.press('Escape');
  await p.getByRole('button', { name: 'Confirmer la fin de prestation' }).click();
  await p.getByRole('dialog').getByRole('button', { name: 'Confirmer la fin de prestation' }).click();
  ok('client : fin confirmée, « Laisser un avis » proposé', await apparait(p.getByRole('button', { name: 'Laisser un avis' })));

  await onglets.getByRole('button', { name: /Mes demandes/ }).click();
  await p.getByRole('button', { name: 'Nouvelle demande' }).click();
  await apparait(p.getByRole('heading', { name: 'Demander un devis' }));
  await p.getByLabel('Prestataire').selectOption({ label: 'Élec Yakro · Électricien' });
  await p.getByLabel('Décrivez votre besoin').fill('Le disjoncteur saute dès que la clim démarre.');
  await p.getByRole('button', { name: 'Envoyer ma demande' }).click();
  ok('client : demande envoyée à Élec Yakro, visible en tête', await apparait(p.getByText('Demande envoyée')) &&
     (await p.locator('.sy-card').filter({ hasText: 'Élec Yakro' }).filter({ hasText: 'En attente' }).count()) >= 1);

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
