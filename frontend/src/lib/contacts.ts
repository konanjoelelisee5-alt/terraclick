import type { PrestationApi } from "./api";

/**
 * Prises de contact avec un technicien (appel, WhatsApp, message). Quand le client revient
 * dans l'application, elle lui demande s'il a conclu : si oui, la relation devient un onglet.
 * Le contexte de la dernière recherche (texte, prestation reconnue) accompagne le contact.
 */
export type Canal = "appel" | "whatsapp" | "message";

export type ContactEnAttente = {
  prestataire: { id: number; nom: string };
  canal: Canal;
  recherche: string | null;
  prestation: { slug: string; nom: string } | null;
  /** Horodatage du contact (ms). */
  le: number;
};

const CLE = "tc.contact-en-attente";

let contexte: { recherche: string | null; prestation: PrestationApi | null } = { recherche: null, prestation: null };

/** Retient la recherche en cours, pour l'associer au technicien qui sera contacté. */
export function retenirContexteRecherche(recherche: string | null, prestation: PrestationApi | null) {
  contexte = { recherche, prestation };
}

/** Note un contact : la question « Avez-vous conclu ? » viendra au retour du client. */
export function noterContact(prestataire: { id?: number; nom: string }, canal: Canal) {
  if (!prestataire.id) return;
  const contact: ContactEnAttente = {
    prestataire: { id: prestataire.id, nom: prestataire.nom },
    canal,
    recherche: contexte.recherche,
    prestation: contexte.prestation ? { slug: contexte.prestation.slug, nom: contexte.prestation.nom } : null,
    le: Date.now(),
  };
  try {
    localStorage.setItem(CLE, JSON.stringify(contact));
  } catch {
    /* stockage indisponible : la question ne sera pas posée */
  }
  window.dispatchEvent(new Event("tc-contact"));
}

export function contactEnAttente(): ContactEnAttente | null {
  try {
    const lu = JSON.parse(localStorage.getItem(CLE) ?? "null");
    return lu && typeof lu.prestataire?.id === "number" ? lu : null;
  } catch {
    return null;
  }
}

export function oublierContact() {
  try {
    localStorage.removeItem(CLE);
  } catch {
    /* rien à faire */
  }
}

/** Lien WhatsApp vers un numéro ivoirien (« 07 58 42 19 03 » → wa.me/2250758421903). */
export const lienWhatsApp = (telephone: string) => `https://wa.me/225${telephone.replace(/\D/g, "")}`;
