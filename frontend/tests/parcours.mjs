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
  await p.getByPlaceholder(/Que cherchez-vous/).fill('Plombier');
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
  await p.getByRole('button', { name: 'Demander un devis' }).first().click();
  await apparait(p.getByText('Votre numéro, et c\'est parti'));
  await p.getByLabel('Votre numéro de téléphone').fill('07 11 22 33 44');
  await p.getByRole('button', { name: 'Recevoir mon code' }).click();
  await p.getByText(/appuyer pour remplir/).click();
  ok('numéro inconnu : le profil est demandé', await apparait(p.getByText('Comment on vous appelle ?')));
  await ctx.close();
}

// C · L'assistant bloque « Continuer » tant que l'étape n'est pas renseignée
{
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
{
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
{
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
{
  const { ctx, p } = await neuve();
  await p.getByPlaceholder(/Que cherchez-vous/).fill('Maçon');
  await p.locator('[data-r="search-go"]').click();
  await p.waitForTimeout(350);
  ok('recherche BTP : bloc « Accompagnement BTP »', await p.getByText('Accompagnement BTP').isVisible());
  ok('recherche BTP : bandeau générique masqué',
     !(await p.getByText('Suivi avancé disponible pour ce besoin').isVisible().catch(() => false)));
  await p.getByRole('button', { name: /Retour à l'accueil/ }).click();
  await p.waitForTimeout(250);
  await p.getByPlaceholder(/Que cherchez-vous/).fill('Coiffure');
  await p.locator('[data-r="search-go"]').click();
  await p.waitForTimeout(350);
  ok('hors BTP : bandeau de suivi avancé proposé (jamais imposé)',
     await p.getByText('Suivi avancé disponible pour ce besoin').isVisible());
  await ctx.close();
}

// G · Le retour navigateur fonctionne
{
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: 'Construction' }).click();
  await p.waitForTimeout(300);
  await p.goBack();
  await p.waitForTimeout(400);
  ok('le bouton Précédent du navigateur revient à l’accueil',
     await p.getByText('Recherches populaires').isVisible());
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
  ok('« Se connecter » ouvre la page Connexion', await apparait(p.getByRole('heading', { name: 'Connexion' })));
  await p.getByLabel('Téléphone', { exact: true }).fill('09 12 34 56 78');
  await p.getByRole('button', { name: 'Recevoir mon code' }).click();
  ok('numéro refusé par le serveur : le motif s’affiche', await apparait(p.getByText(/pas un numéro ivoirien valide/)));

  await p.getByLabel('Téléphone', { exact: true }).fill('07 58 42 19 03');
  await p.getByRole('radio', { name: /WhatsApp/ }).click();
  await p.getByRole('button', { name: 'Recevoir mon code' }).click();
  ok('code demandé par WhatsApp : le canal est rappelé', await apparait(p.getByText(/Code envoyé par WhatsApp/)));
  await p.getByText(/appuyer pour remplir/).click();
  ok('compte connu : connexion puis espace client', await apparait(p.getByText('Aya Konan').first()));
  await ctx.close();

  const second = await neuve();
  await second.p.getByRole('button', { name: 'Se connecter' }).click();
  await second.p.getByLabel('Téléphone', { exact: true }).fill(numeroNeuf());
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
  ok('« S’inscrire » ouvre la page Inscription', await apparait(p.getByRole('heading', { name: 'Créer un compte' })));
  await p.getByLabel('Nom complet').fill('Awa Test');
  await p.getByRole('button', { name: 'Créer mon compte' }).click();
  ok('conditions non acceptées : inscription bloquée', await apparait(p.getByText(/Acceptez les conditions/)));

  const numero = numeroNeuf();
  await p.getByLabel('E-mail (facultatif)').fill(`awa.${numero}@exemple.ci`);
  await p.getByLabel('Téléphone', { exact: true }).fill(numero);
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

// K · Sur téléphone, l'onglet « Compte » mène à la page de connexion
{
  const { ctx, p } = await neuve(390, 844);
  await p.locator('[data-r="tabbar"]').getByRole('button', { name: /Compte/ }).click();
  ok('mobile : l’onglet Compte ouvre la page Connexion', await apparait(p.getByRole('heading', { name: 'Connexion' })));
  ok('mobile : pas de défilement horizontal', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  await ctx.close();
}

// L · Espace prestataire : entrée, rail, demandes, réponse, fenêtres, réalisations
{
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: 'Devenir partenaire' }).first().click();
  ok('« Devenir partenaire » demande un compte', await apparait(p.getByText('Votre numéro, et c\'est parti')));
  await connecter(p);
  ok('après connexion : tableau de bord prestataire', await apparait(p.getByRole('heading', { name: 'Bonjour, Koffi Tanoh' })));

  const rail = p.getByRole('complementary', { name: 'Espace prestataire' });
  await rail.getByRole('button', { name: /Demandes de devis/ }).click();
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

  await rail.getByRole('button', { name: /Mes réalisations/ }).click();
  await p.getByRole('button', { name: 'Ajouter une photo' }).first().click();
  await rail.getByRole('button', { name: /Mon profil/ }).click();
  ok('photo ajoutée visible dans le profil (4 sur 5)', await apparait(p.getByText(/^4$/).first()));

  for (const [entree, titre] of [
    [/Vérification/, 'Soumettre à vérification'],
    [/Abonnement et factures/, 'Abonnement et factures'],
    [/Mise en avant/, 'Mise en avant'],
    [/Mes avis/, 'Mes avis'],
    [/Notifications/, 'Notifications'],
  ]) {
    await rail.getByRole('button', { name: entree }).click();
    ok(`rail : écran « ${titre} »`, await apparait(p.getByRole('heading', { name: titre, exact: true })));
  }
  await p.getByRole('button', { name: 'Tout marquer comme lu' }).click();
  ok('notifications lues : plus de pastille « Nouveau »', !(await p.getByText('Nouveau', { exact: true }).isVisible().catch(() => false)));
  await ctx.close();
}

// M · Espace prestataire sur téléphone : rail en onglets, factures en cartes, pas de débordement
{
  const { ctx, p } = await neuve(390, 844);
  await p.getByRole('button', { name: 'Devenir partenaire' }).first().click();
  await connecter(p);
  await apparait(p.getByRole('heading', { name: 'Bonjour, Koffi Tanoh' }));
  await p.getByRole('complementary', { name: 'Espace prestataire' }).getByRole('button', { name: /Abonnement/ }).click();
  ok('mobile : factures affichées en cartes', await apparait(p.locator('[data-r="factures-cartes"]').getByText('FAC-2026-00042')));
  ok('mobile : pas de défilement horizontal', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  await ctx.close();
}

await b.close();
console.log(R.join('\n'));
const reussies = R.filter((x) => x.startsWith('  OK')).length;
console.log('\n' + reussies + ' / ' + R.length + ' règles vérifiées');
process.exit(reussies === R.length ? 0 : 1);
