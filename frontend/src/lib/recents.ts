/**
 * Secteurs cherchés récemment sur cet appareil, du plus récent au plus ancien : ils passent
 * en tête des raccourcis de l'accueil. Simple confort local ; rien n'est envoyé au serveur.
 */
const CLE = "tc.secteurs-recents";

export function secteursRecents(): string[] {
  try {
    const lus = JSON.parse(localStorage.getItem(CLE) ?? "[]");
    return Array.isArray(lus) ? lus.filter((c): c is string => typeof c === "string") : [];
  } catch {
    return [];
  }
}

export function retenirSecteurs(cles: string[]) {
  if (!cles.length) return;
  try {
    const suite = [...cles, ...secteursRecents().filter((c) => !cles.includes(c))].slice(0, 10);
    localStorage.setItem(CLE, JSON.stringify(suite));
  } catch {
    /* stockage indisponible (navigation privée) : on s'en passe */
  }
}
