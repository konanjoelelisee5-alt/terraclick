import { LOTS_RECEPTION, RESERVES } from "../../../data/chantier";
import { useApp } from "../../../state/app";
import { Icon } from "../../../components/Icon";
import { ImageSlot } from "../../../components/ImageSlot";

const TITRE: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontWeight: 800,
  fontSize: "20px",
  margin: 0,
};

const COMPTEUR: React.CSSProperties = {
  flex: "none",
  whiteSpace: "nowrap",
  fontSize: "13.5px",
  color: "var(--text-muted)",
};

/** Gravité d'une réserve : seule la bloquante retient le dernier jalon. */
function styleGravite(gravite: string): React.CSSProperties {
  return {
    fontSize: "12px",
    fontWeight: 600,
    padding: "4px 11px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
    background: gravite === "Bloquante" ? "var(--state-danger-soft)" : "var(--color-surface)",
    color: gravite === "Bloquante" ? "var(--state-danger)" : "var(--text-muted)",
  };
}

/**
 * Pré-réception : la checklist par lot, les réserves photographiées et le
 * procès-verbal. Le dernier jalon de 5 % reste bloqué jusqu'à la levée des
 * réserves bloquantes.
 */
export function OngletPreReception() {
  const { go } = useApp();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "14px 16px",
          borderRadius: "var(--radius-md)",
          background: "var(--kola-50)",
        }}
      >
        <Icon name="clipboard-check" size={18} color="var(--kola-600)" style={{ marginTop: 1 }} />
        <span style={{ fontSize: "14px", lineHeight: 1.5 }}>
          Visite de pré-réception du mardi 14 avril, en présence de l'agent et de l'entreprise. Cochez ce qui est
          conforme, photographiez ce qui ne l'est pas.
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h2 style={TITRE}>Checklist par lot</h2>
          <span style={COMPTEUR}>35 points sur 38 conformes</span>
        </div>
        {LOTS_RECEPTION.map((l) => (
          <div
            key={l.lot}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              flexWrap: "wrap",
            }}
          >
            <Icon
              name={l.ok ? "check" : "alert-triangle"}
              size={19}
              color={l.ok ? "var(--state-success)" : "var(--state-warning)"}
            />
            <span style={{ flex: 1, minWidth: 160 }}>
              <span style={{ display: "block", fontSize: "15px", fontWeight: 600 }}>{l.lot}</span>
              <span style={{ display: "block", fontSize: "13px", color: "var(--text-muted)" }}>{l.detail}</span>
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{l.faits}</span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                padding: "4px 11px",
                borderRadius: "999px",
                whiteSpace: "nowrap",
                background: l.ok ? "var(--state-success-soft)" : "var(--state-warning-soft)",
                color: l.ok ? "var(--state-success)" : "var(--state-warning)",
              }}
            >
              {l.ok ? "Conforme" : "Réserve"}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h2 style={TITRE}>Réserves</h2>
          <span style={COMPTEUR}>3 réserves, dont 1 bloquante</span>
        </div>
        {RESERVES.map((r) => (
          <div key={r.ref} className="sy-card" style={{ padding: 18, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div style={{ width: 120, height: 96, flex: "none" }}>
              <ImageSlot placeholder="Photo de la réserve" radius={12} />
            </div>
            <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", color: "var(--text-muted)" }}>
                  {r.ref}
                </span>
                <span style={styleGravite(r.gravite)}>{r.gravite}</span>
              </div>
              <span style={{ fontSize: "15.5px", fontWeight: 600, lineHeight: 1.35 }}>{r.titre}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span className="sy-badge sy-badge--neutral">{r.lot}</span>
                <span className="sy-badge sy-badge--neutral">{r.resp}</span>
                <span className="sy-badge sy-badge--neutral">À lever {r.delai}</span>
              </div>
            </div>
          </div>
        ))}
        <button className="sy-btn sy-btn--outline sy-btn--md" style={{ alignSelf: "flex-start", gap: 8 }}>
          <Icon name="camera" size={16} />
          Ajouter une réserve
        </button>
      </div>

      <div className="sy-card sy-weave" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "19px" }}>
          Procès-verbal de réserves
        </span>
        <p style={{ fontSize: "14px", lineHeight: 1.55, margin: 0, color: "var(--text-muted)" }}>
          Le PV reprend la checklist, les trois réserves et leurs délais de levée. Il est signé par vous, l'entreprise
          et l'agent. Le dernier jalon de 5 % reste bloqué jusqu'à la levée des réserves bloquantes.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <span className="sy-badge sy-badge--neutral">PV-2026-00458</span>
          <span className="sy-badge sy-badge--brand">1 925 000 F encore bloqués</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => go("contrat", { contratStep: 3, sujetPv: true, signCode: "", signe: false })}
            className="sy-btn sy-btn--primary sy-btn--md"
          >
            Signer le PV de réserves
          </button>
          <button className="sy-btn sy-btn--outline sy-btn--md" style={{ gap: 8 }}>
            <Icon name="download" size={16} />
            Télécharger en PDF
          </button>
        </div>
      </div>
    </div>
  );
}
