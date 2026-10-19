import type { ReactNode } from "react";
import type { PrestataireApi } from "../../lib/api";
import { Icon } from "../../components/Icon";
import { CARTE } from "../../components/ui";

const LIGNE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: "13.5px",
  color: "var(--color-neutral-700)",
};

/**
 * Un technicien dans le parcours de demande : qui il est, s'il est vérifié, sa note,
 * son quartier, sa réactivité et son prix indicatif. Les actions viennent de l'écran.
 */
export function CarteTechnicien(props: { p: PrestataireApi; badge?: string; mis_en_avant?: boolean; children?: ReactNode }) {
  const { p } = props;
  return (
    <article
      data-r="carte-technicien"
      style={{
        ...CARTE,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        border: props.mis_en_avant ? "1.5px solid var(--color-accent)" : CARTE.border,
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <span
          style={{
            width: 64,
            height: 64,
            flex: "none",
            borderRadius: "var(--radius-lg)",
            background: "var(--color-accent-200)",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: "20px",
            color: "var(--color-accent-800)",
          }}
        >
          {p.initiales}
        </span>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "17px" }}>{p.nom}</span>
            {p.verifie && <Icon name="badge-check" size={17} color="var(--state-success)" />}
            {props.badge && (
              <span className="sy-badge sy-badge--brand" style={{ marginLeft: "auto" }}>
                {props.badge}
              </span>
            )}
          </div>
          <span style={{ fontSize: "13.5px", color: "var(--color-accent-700)" }}>
            {p.metier}
            {p.verifie ? " vérifié" : ""}
          </span>
          <span style={LIGNE}>
            <Icon name="star" size={14} fill="var(--rating)" color="var(--rating)" />
            <strong style={{ color: "var(--color-text)" }}>{p.note.toFixed(1).replace(".", ",")}</strong>/5 · {p.nombre_avis} avis
          </span>
          {p.quartier && (
            <span style={LIGNE}>
              <Icon name="map-pin" size={14} />
              {p.quartier.nom}
            </span>
          )}
          {p.delai_reponse.affichage && (
            <span style={LIGNE}>
              <Icon name="clock" size={14} />
              Répond en {p.delai_reponse.affichage}
            </span>
          )}
          <span style={{ ...LIGNE, color: "var(--color-text)", fontWeight: 600 }}>
            {p.prix.affichage ?? "Devis après diagnostic"}
          </span>
        </div>
      </div>
      {props.children}
    </article>
  );
}
