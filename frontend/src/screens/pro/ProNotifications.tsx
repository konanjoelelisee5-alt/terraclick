import { NOTIFICATIONS_PRO } from "../../data/pro";
import { Icon } from "../../components/Icon";
import { EspacePro } from "./EspacePro";
import { modifierPro, useEtatPro } from "./store";

export function ProNotifications() {
  const { notificationsLues } = useEtatPro();

  return (
    <EspacePro titre="Notifications" sousTitre="Demandes, vérification, abonnement et factures.">
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="sy-btn sy-btn--ghost sy-btn--sm"
          disabled={notificationsLues}
          onClick={() => modifierPro({ notificationsLues: true })}
        >
          Tout marquer comme lu
        </button>
      </div>
      {NOTIFICATIONS_PRO.map((n) => {
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
    </EspacePro>
  );
}
