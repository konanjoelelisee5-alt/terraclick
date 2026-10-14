import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { CARTE, OVERLINE } from "../../components/ui";

/**
 * Écart signalé. Négociation de 48 h avec le prestataire d'abord ; sans accord,
 * le support tranche sur la base du rapport de l'agent. L'argent reste bloqué
 * pendant tout le processus.
 */
export function ProjLitige() {
  const { etat, go } = useApp();
  const maison = etat.sujet.type === "etape";

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "30px 20px 70px" }}>
      <button onClick={() => go("projSuivi")} className="sy-btn sy-btn--ghost sy-btn--md" style={{ marginBottom: 10 }}>
        ← {etat.sujet.ref}
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          padding: "18px 22px",
          borderRadius: "calc(var(--radius-lg) * 1.15)",
          background: "var(--color-accent-900)",
          color: "var(--color-neutral-100)",
          marginBottom: 22,
        }}
      >
        <div style={{ fontFamily: "var(--font-heading)", fontSize: "22px" }}>Écart signalé</div>
        <span
          style={{ marginLeft: "auto", fontSize: "13.5px", display: "inline-flex", alignItems: "center", gap: 7 }}
        >
          <Icon name="lock" size={15} />
          {etat.sujet.montant} toujours bloqués
        </span>
      </div>

      <div style={{ ...CARTE, padding: 20, display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
        <span style={OVERLINE}>Ce que vous avez commandé</span>
        <span style={{ fontSize: "15px" }}>
          {maison
            ? `Fondation béton dosé 350, ferraillage complet · ${etat.sujet.montant}`
            : `PC 16 Go · état neuf · ${etat.sujet.montant}`}
        </span>
        <span style={{ ...OVERLINE, paddingTop: 10, borderTop: "1px solid var(--color-divider)" }}>
          Ce que l'agent a constaté
        </span>
        <span style={{ fontSize: "15px" }}>
          {maison ? "Dosage plus faible, ferraillage incomplet" : "PC 8 Go · reconditionné"}
        </span>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <span className="sy-badge sy-badge--neutral">Photos agent</span>
          <span className="sy-badge sy-badge--neutral">Vidéo</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span
          style={{
            width: 30,
            height: 30,
            flex: "none",
            borderRadius: "999px",
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            display: "grid",
            placeItems: "center",
            fontSize: "13px",
          }}
        >
          1
        </span>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "18px" }}>Négociation · 48 h</span>
        <span className="sy-badge sy-badge--brand" style={{ marginLeft: "auto" }}>
          En cours
        </span>
      </div>

      <div
        style={{
          border: "2px solid var(--color-accent)",
          background: "var(--color-neutral-100)",
          borderRadius: "calc(var(--radius-lg) * 1.15)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 22,
        }}
      >
        <span style={{ color: "var(--color-neutral-700)", fontSize: "13.5px" }}>Propositions du prestataire</span>
        <button className="sy-btn sy-btn--outline sy-btn--md" style={{ justifyContent: "center" }}>
          {maison ? "Reprise du ferraillage à ses frais" : "Échange contre un 16 Go"}
        </button>
        <button className="sy-btn sy-btn--outline sy-btn--md" style={{ justifyContent: "center" }}>
          {maison ? "Remise de 180 000 F" : "Remise de 90 000 F"}
        </button>
        <button className="sy-btn sy-btn--primary sy-btn--md" style={{ justifyContent: "center" }}>
          Annuler et me rembourser
        </button>
        <p style={{ color: "var(--color-neutral-700)", fontSize: "13px", margin: 0 }}>
          Ouvrez la messagerie pour discuter avant d'accepter.
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: 0.6 }}>
        <span
          style={{
            width: 30,
            height: 30,
            flex: "none",
            borderRadius: "999px",
            background: "var(--color-surface)",
            display: "grid",
            placeItems: "center",
            fontSize: "13px",
            color: "var(--color-neutral-700)",
          }}
        >
          2
        </span>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "18px" }}>Arbitrage Servis Yakro</span>
        <span style={{ color: "var(--color-neutral-700)", marginLeft: "auto", fontSize: "13px" }}>si pas d'accord</span>
      </div>
      <p style={{ color: "var(--color-neutral-700)", fontSize: "13.5px", marginTop: 14 }}>
        Sans accord sous 48 h, le support tranche sur la base du rapport de l'agent.
      </p>
    </main>
  );
}
