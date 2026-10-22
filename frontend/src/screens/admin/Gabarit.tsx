import type { CSSProperties, ReactNode } from "react";
import { Icon } from "../../components/Icon";

/* Gabarit des espaces de gestion (équipe et prestataires), tiré des tableaux de bord de
   référence : fond doux, cartes blanches arrondies sans bordure, une rangée d'indicateurs en
   haut de chaque page, des sections titrées avec leurs contrôles à droite (« Suivi  +3 nouvelles
   … Chercher · Statut »), des tableaux aérés, des pastilles de statut avec icône. Chaque écran
   compose ces pièces plutôt que de dessiner les siennes. */

export const GRIS_GABARIT = "var(--argile-700)";

export type Ton = "success" | "danger" | "warning" | "info" | "neutral" | "brand";

/** Une rangée d'indicateurs : libellé, valeur en chiffres, pastille d'écart, phrase. */
export function Stats({ items, colonnes }: { items: { libelle: string; valeur: ReactNode; detail?: ReactNode; badge?: { texte: string; ton: Ton }; icone?: string }[]; colonnes?: number }) {
  return (
    <div data-r="stats-page" className="gabarit-stats" style={{ "--colonnes": colonnes ?? items.length } as CSSProperties}>
      {items.map((s) => (
        <div key={s.libelle} data-r="stat-page" className="gabarit-carte" style={{ gap: 10 }}>
          <span style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "14px", fontWeight: 600, color: GRIS_GABARIT }}>
              {s.icone && <Icon name={s.icone} size={16} />}
              {s.libelle}
            </span>
            {s.badge && <span className={`sy-badge sy-badge--${s.badge.ton}`}>{s.badge.texte}</span>}
          </span>
          <span className="gabarit-valeur">{s.valeur}</span>
          {s.detail && <span style={{ fontSize: "12.5px", color: GRIS_GABARIT }}>{s.detail}</span>}
        </div>
      ))}
    </div>
  );
}

/** Une section : titre (et pastille), contrôles à droite, contenu dans une carte blanche. */
export function Section({ titre, badge, actions, children, nue, r }: { titre: ReactNode; badge?: ReactNode; actions?: ReactNode; children: ReactNode; nue?: boolean; r?: string }) {
  return (
    <section data-r={r} aria-label={typeof titre === "string" ? titre : undefined} style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "19px", letterSpacing: "-0.02em" }}>{titre}</h2>
        {badge}
        {actions && <span style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>{actions}</span>}
      </div>
      {nue ? children : <div className="gabarit-carte">{children}</div>}
    </section>
  );
}

/** Pastille « +3 nouvelles » à côté d'un titre de section. */
export function Nouveau({ n, texte }: { n: number; texte: string }) {
  if (!n) return null;
  return <span className="sy-badge sy-badge--success">{`+${n} ${texte}`}</span>;
}

export type Colonne<T> = { titre: string; rendu: (l: T) => ReactNode; droite?: boolean; largeur?: number | string };

/** Tableau aéré : en-têtes gris, lignes séparées d'un filet, ligne cliquable au besoin. */
export function Tableau<T>({ colonnes, lignes, cle, onLigne, ligneR, vide, min = 640 }: { colonnes: Colonne<T>[]; lignes: T[]; cle: (l: T) => string | number; onLigne?: (l: T) => void; ligneR?: string; vide?: string; min?: number }) {
  if (!lignes.length && vide) return <p role="status" style={{ margin: 0, padding: "18px 2px", color: GRIS_GABARIT, fontSize: "14px" }}>{vide}</p>;
  return (
    <div style={{ overflowX: "auto", margin: "-4px -2px" }}>
      <table className="gabarit-tableau" style={{ minWidth: min }}>
        <thead>
          <tr>
            {colonnes.map((c) => (
              <th key={c.titre} style={{ textAlign: c.droite ? "right" : "left", width: c.largeur }}>
                {c.titre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => (
            <tr key={cle(l)} data-r={ligneR} onClick={onLigne ? () => onLigne(l) : undefined} className={onLigne ? "gabarit-cliquable" : undefined}>
              {colonnes.map((c) => (
                <td key={c.titre} style={{ textAlign: c.droite ? "right" : "left" }}>
                  {c.rendu(l)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ICONES_TON: Record<Ton, string> = { success: "circle-check", danger: "alert-triangle", warning: "clock", info: "circle-dashed", neutral: "circle-dashed", brand: "star" };

/** Pastille de statut, toujours avec son icône : la couleur n'est jamais seule à parler. */
export function Statut({ ton, children }: { ton: Ton; children: ReactNode }) {
  return (
    <span className={`sy-badge sy-badge--${ton}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
      <Icon name={ICONES_TON[ton]} size={12} />
      {children}
    </span>
  );
}

/** Pastille d'initiales, devant un nom. */
export function Avatar({ nom, taille = 34 }: { nom: string | null | undefined; taille?: number }) {
  const initiales = (nom ?? "?")
    .split(/\s+/)
    .map((m) => m[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span aria-hidden style={{ width: taille, height: taille, flex: "none", borderRadius: 999, background: "var(--argile-100)", display: "inline-grid", placeItems: "center", fontWeight: 800, fontSize: taille > 36 ? "13px" : "11.5px" }}>
      {initiales}
    </span>
  );
}

/** Nom avec avatar et une ligne de précision, pour la première colonne d'un tableau. */
export function Personne({ nom, detail }: { nom: ReactNode; detail?: ReactNode }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <Avatar nom={typeof nom === "string" ? nom : null} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontWeight: 600 }}>{nom}</span>
        {detail && <span style={{ display: "block", fontSize: "12.5px", color: GRIS_GABARIT }}>{detail}</span>}
      </span>
    </span>
  );
}

export const chiffre = (n: number) => n.toLocaleString("fr-FR");
