import { NOTIFICATIONS_CLIENT } from "../../data/client";
import { Icon } from "../../components/Icon";
import { EspaceClient } from "./EspaceClient";
import { modifierClient, useEtatClient } from "./store";

export function ClientNotifications() {
  const { notificationsLues } = useEtatClient();

  return (
    <EspaceClient
      titre="Notifications"
      sousTitre="Réponses des prestataires, rendez-vous et avis en attente."
      actions={
        <button
          type="button"
          className="sy-btn sy-btn--ghost sy-btn--sm"
          disabled={notificationsLues}
          onClick={() => modifierClient({ notificationsLues: true })}
        >
          Tout marquer comme lu
        </button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 900 }}>
        {NOTIFICATIONS_CLIENT.map((n) => {
          const nouveau = n.nouveau && !notificationsLues;
          return (
            <div key={n.titre + n.date} className="sy-card">
              <div
                style={{
                  padding: "14px 16px",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  background: nouveau ? "var(--kola-50)" : "var(--surface-card)",
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    flex: "none",
                    borderRadius: 10,
                    background: n.fond,
                    color: n.encre,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Icon name={n.icone} size={18} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700 }}>{n.titre}</span>
                    {nouveau && <span className="sy-badge sy-badge--brand">Nouveau</span>}
                  </div>
                  <div style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--argile-700)", marginTop: 2 }}>{n.texte}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: 4 }}>{n.date}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </EspaceClient>
  );
}
