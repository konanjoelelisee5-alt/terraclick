import { useEffect, useState } from "react";
import { api, type RechercheApi } from "./api";

/**
 * Historique des recherches. Chaque recherche part au serveur (avec le compte s'il y en a un :
 * l'historique suit alors l'utilisateur sur tous ses appareils) et reste aussi sur l'appareil,
 * pour le visiteur. Effacer vide l'appareil et masque l'historique du compte ; l'administration
 * garde les recherches (voir RechercheController).
 */
const CLE = "tc.historique";
const CLE_APPAREIL = "tc.appareil";
const MAX = 100;

/** Identifiant aléatoire de cet appareil (« Onglets récents » distingue ainsi les appareils). */
export function appareilId(): string {
  try {
    let id = localStorage.getItem(CLE_APPAREIL);
    if (!id) {
      id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(CLE_APPAREIL, id);
    }
    return id;
  } catch {
    return "inconnu";
  }
}

/** Nom lisible de l'appareil, déduit du navigateur. */
export function nomAppareil(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? "Téléphone Android" : "Tablette Android";
  if (/Windows/.test(ua)) return "Ordinateur Windows";
  if (/Mac OS/.test(ua)) return "Mac";
  if (/Linux/.test(ua)) return "Ordinateur Linux";
  return "Autre appareil";
}

function lireLocal(): RechercheApi[] {
  try {
    const lus = JSON.parse(localStorage.getItem(CLE) ?? "[]");
    return Array.isArray(lus) ? lus : [];
  } catch {
    return [];
  }
}

function ecrireLocal(liste: RechercheApi[]) {
  try {
    localStorage.setItem(CLE, JSON.stringify(liste.slice(0, MAX)));
  } catch {
    /* stockage indisponible : l'historique local est sauté */
  }
}

/** Enregistre une recherche sur l'appareil et au serveur, sans retarder l'affichage. */
export function enregistrerRecherche(texte: string, categorie: string | null, ville: string) {
  const propre = texte.trim();
  if (!propre) return;
  const recherche = { texte: propre, categorie, ville, appareil_id: appareilId(), appareil: nomAppareil() };
  const locale: RechercheApi = { id: Date.now(), secteur: null, ...recherche, date: new Date().toISOString() };
  ecrireLocal([locale, ...lireLocal()]);
  api.enregistrerRecherche(recherche).then(
    (r) => ecrireLocal(lireLocal().map((x) => (x.id === locale.id ? { ...r, id: locale.id } : x))),
    () => {},
  );
}

/** Historique à afficher : celui du compte (tous appareils) une fois connecté, sinon celui de l'appareil. */
export function useHistorique(connecte: boolean, version = 0) {
  const [elements, setElements] = useState<RechercheApi[] | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!connecte) {
      setElements(lireLocal());
      return;
    }
    const arret = new AbortController();
    api.mesRecherches(arret.signal).then(setElements, (e) => {
      if (e?.name === "AbortError") return;
      setErreur(true);
      setElements(lireLocal());
    });
    return () => arret.abort();
  }, [connecte, version]);

  return { elements, erreur };
}

/** « Supprimer les données de navigation » : vide l'appareil et masque l'historique du compte. */
export async function effacerHistorique(connecte: boolean) {
  ecrireLocal([]);
  if (connecte) await api.effacerRecherches();
}
