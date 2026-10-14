import { useState } from "react";
import { useApp } from "../../state/app";
import { FILTRES_DEMANDES } from "../../data/pro";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspacePro, MONO, badge } from "./EspacePro";
import { useEtatPro } from "./store";

export function ProDemandes() {
  const { go } = useApp();
  const toast = useToast();
  const { demandes } = useEtatPro();
  const [filtre, setFiltre] = useState("Toutes");
  const visibles = filtre === "Toutes" ? demandes : demandes.filter((d) => d.groupe === filtre);

  return (
    <EspacePro titre="Demandes de devis" sousTitre="Les clients de vos quartiers d'intervention vous écrivent ici.">
      <div data-r="steprail" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
        {FILTRES_DEMANDES.map((f) => (
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
        <div className="sy-card sy-weave" style={{ backgroundColor: "var(--argile-50)" }}>
          <div className="sy-card__body">
            <p style={{ margin: 0, fontSize: "15px" }}>Aucune demande dans cette catégorie pour le moment.</p>
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
              <span style={{ fontSize: "15px", fontWeight: 700 }}>
                {d.client} · {d.categorie}
              </span>
              <span style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--argile-700)" }}>{d.besoin}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <span className="sy-badge sy-badge--neutral">{d.quartier}</span>
                <span className="sy-badge sy-badge--neutral">{d.date}</span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8,
                padding: "10px 16px",
                borderTop: "1px solid var(--border-subtle)",
                background: "var(--argile-25)",
              }}
            >
              <button
                type="button"
                className="sy-iconbtn sy-iconbtn--md sy-iconbtn--outline"
                aria-label={`Appeler ${d.client}`}
                onClick={() => toast(`Appeler ${d.client}`, "Le numéro du client s'affichera ici une fois l'appel branché.", "info")}
              >
                <Icon name="phone" size={16} />
              </button>
              <button type="button" className="sy-btn sy-btn--primary sy-btn--sm" onClick={() => go("proDemande")}>
                Voir la demande
              </button>
            </div>
          </div>
        ))}
      </div>
    </EspacePro>
  );
}
