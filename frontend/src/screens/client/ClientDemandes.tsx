import { useState } from "react";
import { useApp } from "../../state/app";
import { FILTRES_DEMANDES_CLIENT } from "../../data/client";
import { Icon } from "../../components/Icon";
import { MONO, badge } from "../pro/EspacePro";
import { EspaceClient } from "./EspaceClient";
import { useEtatClient } from "./store";

export function ClientDemandes() {
  const { go } = useApp();
  const { demandes } = useEtatClient();
  const [filtre, setFiltre] = useState("Toutes");
  const visibles = filtre === "Toutes" ? demandes : demandes.filter((d) => d.groupe === filtre);

  return (
    <EspaceClient
      titre="Mes demandes"
      sousTitre="Vos demandes de devis et leur avancement."
      actions={
        <button type="button" className="sy-btn sy-btn--primary sy-btn--md" style={{ gap: 8 }} onClick={() => go("clientDevis")}>
          <Icon name="file-text" size={16} />
          Nouvelle demande
        </button>
      }
    >
      <div data-r="steprail" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
        {FILTRES_DEMANDES_CLIENT.map((f) => (
          <button
            key={f}
            type="button"
            className={`sy-tag${f === filtre ? " sy-tag--selected" : ""}`}
            aria-pressed={f === filtre}
            onClick={() => setFiltre(f)}
            style={{ flex: "none" }}
          >
            {f}
          </button>
        ))}
      </div>

      {visibles.length === 0 && (
        <div className="sy-card">
          <div className="sy-card__body">
            <p style={{ margin: 0, fontSize: "15px" }}>Aucune demande dans cette catégorie.</p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))" }}>
        {visibles.map((d) => (
          <div key={d.ref} className="sy-card">
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span style={{ ...MONO, fontSize: "12px", color: "var(--kola-700)" }}>{d.ref}</span>
                <span className={badge(d.ton)}>{d.statut}</span>
              </div>
              <span style={{ fontSize: "15px", fontWeight: 700 }}>{d.prestataire}</span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                {d.portee} · {d.date}
              </span>
              <div>
                <span className="sy-badge sy-badge--neutral">Estimation {d.estimation}</span>
              </div>
              <div style={{ fontSize: "13px", color: "var(--argile-700)" }}>
                <strong>Prochaine action :</strong> {d.prochaine}
              </div>
            </div>
            <div
              style={{
                padding: "10px 16px",
                borderTop: "1px solid var(--border-subtle)",
                background: "var(--argile-25)",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button type="button" className="sy-btn sy-btn--primary sy-btn--sm" onClick={() => go("clientSuivi")}>
                Voir la demande
              </button>
            </div>
          </div>
        ))}
      </div>
    </EspaceClient>
  );
}
