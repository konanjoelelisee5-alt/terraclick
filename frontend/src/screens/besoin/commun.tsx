import type { ReactNode } from "react";
import { secteurParCle } from "../../data/catalogue";
import { Icon } from "../../components/Icon";
import type { Besoin, Quand } from "../../state/types";

export const QUANDS: { valeur: Quand; libelle: string; detail: string }[] = [
  { valeur: "maintenant", libelle: "Maintenant", detail: "Urgence : un technicien au plus vite" },
  { valeur: "aujourdhui", libelle: "Aujourd'hui", detail: "Dans la journée" },
  { valeur: "demain", libelle: "Demain", detail: "À l'heure qui vous arrange" },
  { valeur: "date", libelle: "Choisir une date", detail: "Pour une intervention programmée" },
];

export function libelleQuand(b: Besoin): string | null {
  if (b.quand === "date") return b.date ? new Date(`${b.date}T12:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : null;
  return QUANDS.find((q) => q.valeur === b.quand)?.libelle ?? null;
}

/** « Plomberie · Fuite d'eau · Habitat · Maintenant » */
export function resumeBesoin(b: Besoin, quartier?: string | null): string {
  const probleme = b.probleme === "Autre" ? b.precision.trim() || "Autre" : b.probleme;
  return [secteurParCle(b.secteur)?.nom, probleme, quartier, libelleQuand(b)].filter(Boolean).join(" · ");
}

/** Une urgence ou une simple panne : TerraClick propose d'abord de trouver pour le client. */
export function estUrgent(b: Besoin): boolean {
  if (b.quand === "maintenant") return true;
  if (b.quand === "date") return false;
  return !/installation|pose|sur mesure|placard|blindage/i.test(b.probleme ?? "");
}

export const TITRE_ETAPE: React.CSSProperties = {
  fontSize: "clamp(22px,4vw,28px)",
  lineHeight: 1.2,
  margin: "0 0 6px",
};

export const AIDE: React.CSSProperties = { margin: "0 0 18px", fontSize: "14.5px", color: "var(--color-neutral-700)" };

export const BOUTON_RETOUR: React.CSSProperties = {
  width: 44,
  height: 44,
  flex: "none",
  display: "grid",
  placeItems: "center",
  borderRadius: "999px",
  border: "1px solid var(--color-divider)",
  background: "var(--color-neutral-100)",
  color: "inherit",
  cursor: "pointer",
};

/** Cadre commun des écrans du parcours : retour, fil d'étapes, contenu, barre d'action. */
export function CadreParcours(props: {
  retour: () => void;
  /** Ex. « Étape 2 sur 4 ». */
  etape?: string;
  /** De 0 à 1 ; absent = pas de barre de progression. */
  progression?: number;
  children: ReactNode;
  /** Bouton(s) principaux, collés en bas sur téléphone. */
  actions?: ReactNode;
}) {
  return (
    <main data-r="container" data-parcours="" style={{ maxWidth: 720, paddingTop: 22, paddingBottom: 120 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <button onClick={props.retour} aria-label="Retour" style={BOUTON_RETOUR}>
          <Icon name="arrow-left" size={20} strokeWidth={2.25} />
        </button>
        {props.etape && <span style={{ fontSize: "13.5px", color: "var(--color-neutral-700)" }}>{props.etape}</span>}
      </div>
      {props.progression !== undefined && (
        <div aria-hidden="true" style={{ height: 5, borderRadius: 999, background: "var(--color-neutral-300)", marginBottom: 24, overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.round(props.progression * 100)}%`,
              height: "100%",
              background: "var(--color-accent)",
              transition: "width var(--dur-base, .25s)",
            }}
          />
        </div>
      )}
      {props.children}
      {props.actions && (
        <div data-r="parcours-actions" style={{ display: "flex", gap: 10, marginTop: 26 }}>
          {props.actions}
        </div>
      )}
    </main>
  );
}

/** Carte de choix (problème, moment, paiement) : grande cible tactile, état coché visible. */
export function Choix(props: { actif: boolean; onClick: () => void; titre: string; detail?: string; icone?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={props.actif}
      onClick={props.onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        minHeight: 56,
        padding: "12px 16px",
        textAlign: "left",
        font: "inherit",
        color: "inherit",
        cursor: "pointer",
        borderRadius: "var(--radius-lg)",
        border: `1.5px solid ${props.actif ? "var(--color-accent)" : "var(--color-divider)"}`,
        background: props.actif ? "var(--color-accent-100)" : "var(--color-neutral-100)",
      }}
    >
      {props.icone && <Icon name={props.icone} size={20} color="var(--color-accent-700)" />}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontWeight: 600, fontSize: "15px" }}>{props.titre}</span>
        {props.detail && <span style={{ display: "block", fontSize: "13px", color: "var(--color-neutral-700)" }}>{props.detail}</span>}
      </span>
      <span
        aria-hidden="true"
        style={{
          width: 20,
          height: 20,
          flex: "none",
          borderRadius: 999,
          border: `2px solid ${props.actif ? "var(--color-accent)" : "var(--color-neutral-400, #b9b1a8)"}`,
          display: "grid",
          placeItems: "center",
        }}
      >
        {props.actif && <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--color-accent)" }} />}
      </span>
    </button>
  );
}
