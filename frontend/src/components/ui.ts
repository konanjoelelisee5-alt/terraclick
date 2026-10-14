import type { CSSProperties } from "react";
import type { EtatEtape } from "../data/projet";
import type { TonStatut } from "../data/projet";

/* Styles récurrents de l'application, repris du prototype haute fidélité.
   Ils s'appuient sur les jetons du design system et sur les alias --color-*
   posés par l'habillage courant. */

/** Pastille de filtre : sélectionnée en accent plein, sinon contour discret. */
export function pill(actif: boolean): CSSProperties {
  return {
    cursor: "pointer",
    borderRadius: "999px",
    padding: "7px 16px",
    font: "inherit",
    fontSize: "13.5px",
    border: actif ? "1px solid var(--color-accent)" : "1px solid var(--color-divider)",
    background: actif ? "var(--color-accent)" : "var(--color-neutral-100)",
    color: actif ? "var(--color-bg)" : "inherit",
  };
}

/** Onglet segmenté (Liste / Carte). */
export function tab(actif: boolean): CSSProperties {
  return {
    cursor: "pointer",
    border: 0,
    borderRadius: "999px",
    padding: "7px 18px",
    font: "inherit",
    fontSize: "13.5px",
    background: actif ? "var(--color-accent)" : "transparent",
    color: actif ? "var(--color-bg)" : "inherit",
  };
}

/** Onglet segmenté avec icône (les trois modes de l'accueil). */
export function tabIcon(actif: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    whiteSpace: "nowrap",
    cursor: "pointer",
    border: 0,
    borderRadius: "999px",
    padding: "8px 16px",
    font: "inherit",
    fontSize: "13.5px",
    background: actif ? "var(--color-accent)" : "transparent",
    color: actif ? "var(--color-bg)" : "var(--color-neutral-800)",
  };
}

/** Choix de canal ou de moyen (SMS, WhatsApp, signature…). */
export function canal(actif: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textAlign: "left",
    cursor: "pointer",
    font: "inherit",
    color: "inherit",
    padding: "12px 14px",
    borderRadius: "var(--radius-md)",
    width: "100%",
    border: actif ? "1.5px solid var(--color-accent)" : "1px solid var(--border-subtle)",
    background: actif ? "var(--kola-50)" : "var(--surface-card)",
  };
}

/** Choix de l'assistant de projet : cible tactile d'au moins 44 px. */
export function chip(actif: boolean): CSSProperties {
  return {
    cursor: "pointer",
    font: "inherit",
    fontSize: "14px",
    textAlign: "left",
    padding: "10px 16px",
    borderRadius: "999px",
    minHeight: "44px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    border: actif ? "1.5px solid var(--color-accent)" : "1px solid var(--border-subtle)",
    background: actif ? "var(--kola-50)" : "var(--surface-card)",
    color: actif ? "var(--kola-600)" : "var(--text-body)",
    fontWeight: actif ? 600 : 400,
  };
}

const JETON_ETAT: Record<string, string> = {
  Terminée: "--state-success",
  Payé: "--state-success",
  Validé: "--state-success",
  Livré: "--state-success",
  Résolu: "--state-success",
  "En cours": "--state-info",
  "À valider": "--state-warning",
  "En attente": "--state-warning",
  "En retard": "--state-danger",
  Bloquée: "--state-danger",
  Ouvert: "--state-warning",
};

/**
 * Pastille d'état, colorée par les jetons sémantiques du design system.
 * Un état non cartographié — « À venir » par exemple — dégrade vers le neutre
 * plutôt que d'emprunter la couleur d'un statut réel.
 */
export function badgeEtat(etat: string): CSSProperties {
  const jeton = JETON_ETAT[etat];
  return {
    fontSize: "12px",
    fontWeight: 600,
    padding: "4px 11px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
    background: jeton ? `var(${jeton}-soft)` : "var(--color-surface)",
    color: jeton ? `var(${jeton})` : "var(--text-muted)",
  };
}

const TONS: Record<TonStatut, CSSProperties> = {
  brand: { background: "var(--kola-50)", color: "var(--kola-600)" },
  success: { background: "var(--state-success-soft)", color: "var(--state-success)" },
  warning: { background: "var(--state-warning-soft)", color: "var(--state-warning)" },
  info: { background: "var(--state-info-soft)", color: "var(--state-info)" },
  neutral: { background: "var(--color-surface)", color: "var(--text-muted)" },
};

/** Statut d'un projet dans « Mes projets ». */
export function statutProjet(ton: TonStatut): CSSProperties {
  return {
    fontSize: "12.5px",
    fontWeight: 600,
    padding: "5px 12px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
    ...TONS[ton],
  };
}

/** Pastille numérotée d'une étape de suivi. */
export function puceEtape(etat: EtatEtape): CSSProperties {
  const fond =
    etat === "fait"
      ? { background: "var(--color-accent-200)", color: "var(--color-accent-800)" }
      : etat === "encours"
        ? { background: "var(--color-accent)", color: "var(--color-bg)" }
        : { background: "var(--color-surface)", color: "var(--color-neutral-700)" };
  return {
    width: "30px",
    height: "30px",
    flex: "none",
    borderRadius: "999px",
    display: "grid",
    placeItems: "center",
    fontSize: "13px",
    ...fond,
  };
}

/** Carte d'étape : l'étape en cours est cerclée d'accent, les suivantes sont estompées. */
export function carteEtape(etat: EtatEtape): CSSProperties {
  return {
    border: `1px solid ${etat === "encours" ? "var(--color-accent)" : "var(--color-divider)"}`,
    background: "var(--color-neutral-100)",
    borderRadius: "calc(var(--radius-lg) * 1.15)",
    padding: "16px 18px",
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    ...(etat === "bloque" ? { opacity: 0.6 } : {}),
  };
}

/** Badge d'état d'une étape du tableau de bord. */
export function badgeEtape(etat: EtatEtape): CSSProperties {
  const fond =
    etat === "encours"
      ? { background: "var(--color-accent)", color: "var(--color-bg)" }
      : etat === "fait"
        ? { background: "var(--color-accent-2-200)", color: "var(--color-accent-2-800)" }
        : { background: "var(--color-surface)", color: "var(--color-neutral-700)" };
  return {
    marginLeft: "auto",
    flex: "none",
    fontSize: "12px",
    padding: "4px 12px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
    ...fond,
  };
}

/** Carte de contenu du prototype : fond, filet et rayon légèrement majoré. */
export const CARTE: CSSProperties = {
  border: "1px solid var(--color-divider)",
  background: "var(--color-neutral-100)",
  borderRadius: "calc(var(--radius-lg) * 1.15)",
};

/** Filet supérieur : 11 px, capitales, lettrage ouvert, toujours en accent. */
export const OVERLINE: CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--color-accent-700)",
};

/** Titre de section interne. */
export const TITRE_SECTION: CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontWeight: 800,
  fontSize: "19px",
};
