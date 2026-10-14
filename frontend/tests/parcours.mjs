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

// B · Numéro inconnu : création du profil en deux champs
{
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: "S'inscrire" }).click();
  await p.waitForTimeout(200);
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

// I · Les erreurs du serveur s'affichent, un nouveau compte garde son nom et sa session
{
  const { ctx, p } = await neuve();
  await p.getByRole('button', { name: "S'inscrire" }).click();
  await p.getByLabel('Votre numéro de téléphone').fill('09 12 34 56 78');
  await p.getByRole('button', { name: 'Recevoir mon code' }).click();
  ok('numéro refusé par le serveur : le motif s’affiche', await apparait(p.getByText(/pas un numéro ivoirien valide/)));

  const numero = '07' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
  await p.getByLabel('Votre numéro de téléphone').fill(numero);
  await p.getByRole('button', { name: 'Recevoir mon code' }).click();
  await p.getByText(/appuyer pour remplir/).click();
  await apparait(p.getByText('Comment on vous appelle ?'));
  await p.getByLabel('Prénom et nom').fill('Awa Test');
  await p.getByRole('button', { name: 'Kokrenou' }).click();
  await p.getByRole('button', { name: 'Terminer' }).click();
  ok('profil enregistré : le nom apparaît dans l’en-tête', await apparait(p.getByText('Awa Test').first()));
  await p.reload({ waitUntil: 'domcontentloaded' });
  ok('la session survit au rechargement de la page', await apparait(p.getByText('Awa Test').first()));
  await ctx.close();
}

await b.close();
console.log(R.join('\n'));
const reussies = R.filter((x) => x.startsWith('  OK')).length;
console.log('\n' + reussies + ' / ' + R.length + ' règles vérifiées');
process.exit(reussies === R.length ? 0 : 1);
