import { NOTIFICATIONS } from "../data/compte";
import { useApp } from "../state/app";
import { Icon } from "./Icon";

/* Panneau des notifications. Chaque ligne indique par quel canal l'information
   est partie — l'utilisateur règle ces canaux dans son espace. */
export function Notifications() {
  const { etat, set, exigerCompte, go } = useApp();
  if (!etat.notifOpen) return null;

  const fermer = () => set({ notifOpen: false });

  return (
    <div
      onClick={fermer}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 55,
        background: "rgba(26,22,19,.35)",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "flex-start",
        padding: "78px 20px 20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Notifications"
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-card)",
          boxShadow: "0 12px 40px rgba(26,22,19,.2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 18px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "18px" }}>Notifications</span>
          <button
            onClick={fermer}
            aria-label="Fermer"
            style={{
              marginLeft: "auto",
              background: "none",
              border: 0,
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 2,
              lineHeight: 0,
            }}
          >
            <Icon name="x" size={19} />
          </button>
        </div>

        {NOTIFICATIONS.map((n) => (
          <button
            key={n.titre}
            onClick={fermer}
            style={{
              width: "100%",
              boxSizing: "border-box",
              display: "flex",
              gap: 12,
              padding: "14px 16px",
              border: 0,
              borderBottom: "1px solid var(--border-subtle)",
              cursor: "pointer",
              font: "inherit",
              color: "inherit",
              textAlign: "left",
              background: n.neuf ? "var(--kola-50)" : "transparent",
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                flex: "none",
                borderRadius: "999px",
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                color: "var(--kola-600)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name={n.icon} size={18} />
            </span>
            <span style={{ flex: 1, minWidth: 0, textAlign: "left", display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text-strong)" }}>{n.titre}</span>
              <span style={{ fontSize: "13px", lineHeight: 1.4, color: "var(--text-muted)" }}>{n.texte}</span>
              <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                {n.quand} · {n.canal}
              </span>
            </span>
          </button>
        ))}

        <button
          onClick={() => {
            fermer();
            exigerCompte(() => go("compte"));
          }}
          style={{
            width: "100%",
            padding: 13,
            background: "none",
            border: 0,
            cursor: "pointer",
            font: "inherit",
            fontSize: "13.5px",
            color: "var(--kola-600)",
          }}
        >
          Régler mes canaux de notification
        </button>
      </div>
    </div>
  );
}
