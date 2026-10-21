import { useState } from "react";
import { useApp } from "../../state/app";
import { FILTRES_DEMANDES_CLIENT } from "../../data/client";
import { Icon } from "../../components/Icon";
import { MONO, badge } from "../pro/EspacePro";
import { EspaceClient } from "./EspaceClient";
import { chargerDemandes, modifierClient, useDemandesClient } from "./store";

export function ClientDemandes() {
  const { etat, go, demarrerBesoin } = useApp();
  const compte = etat.auth?.tel ?? null;
  const { demandes, chargement, erreur } = useDemandesClient(compte);
  const [filtre, setFiltre] = useState("Toutes");
  const visibles = filtre === "Toutes" ? demandes : demandes.filter((d) => d.groupe === filtre);

  const ouvrir = (id?: number) => {
    modifierClient({ suivie: id ?? null });
    go("clientSuivi");
  };

  return (
    <EspaceClient
      titre="Mes demandes"
      sousTitre="Vos demandes d'intervention et leur avancement."
      actions={
        <button type="button" className="sy-btn sy-btn--primary sy-btn--md" style={{ gap: 8 }} onClick={() => demarrerBesoin()}>
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

      {chargement && demandes.length === 0 && <p style={{ margin: 0, color: "var(--text-muted)" }}>Chargement de vos demandes…</p>}
      {erreur && (
        <div role="alert" className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: "15px", flex: 1 }}>Vos demandes n'ont pas pu être chargées.</p>
            <button type="button" className="sy-btn sy-btn--outline sy-btn--sm" onClick={() => compte && chargerDemandes(compte)}>
              Réessayer
            </button>
          </div>
        </div>
      )}

      {!chargement && !erreur && visibles.length === 0 && (
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
            <p style={{ margin: 0, fontSize: "15px" }}>
              {demandes.length === 0 ? "Vous n'avez encore envoyé aucune demande." : "Aucune demande dans cette catégorie."}
            </p>
            {demandes.length === 0 && (
              <button type="button" className="sy-btn sy-btn--primary sy-btn--md" onClick={() => demarrerBesoin()}>
                Décrire mon besoin
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))" }}>
        {visibles.map((d) => (
          <div key={d.ref} data-r="demande-client" className="sy-card">
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
                <strong>Prochaine étape :</strong> {d.prochaine}
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
              <button type="button" className="sy-btn sy-btn--primary sy-btn--sm" onClick={() => ouvrir(d.id)}>
                Voir la demande
              </button>
            </div>
          </div>
        ))}
      </div>
    </EspaceClient>
  );
}
