import { DEPANNAGE, URGENCES } from "../data/catalogue";
import { useApp } from "../state/app";
import { Icon } from "../components/Icon";
import { CARTE } from "../components/ui";

/** Urgence 24/24 : un appui, un appel. Pas de recherche, pas de formulaire. */
export function Urgence() {
  const { go, ville } = useApp();

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "30px 20px 70px" }}>
      <button onClick={() => go("home")} className="sy-btn sy-btn--ghost sy-btn--md" style={{ marginBottom: 12 }}>
        ← Retour
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "20px 26px",
          borderRadius: "calc(var(--radius-lg) * 1.15)",
          background: "var(--color-accent-900)",
          color: "var(--color-neutral-100)",
          marginBottom: 20,
        }}
      >
        <Icon name="siren" size={26} strokeWidth={2.75} />
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "24px" }}>Urgence · 24/24</div>
          <div style={{ fontSize: "13.5px", opacity: 0.8 }}>Un appui, un appel. Pas de recherche, pas de formulaire.</div>
        </div>
        <span
          className="sy-badge sy-badge--solid"
          style={{ marginLeft: "auto", background: "var(--color-accent-400)", color: "var(--color-accent-900)" }}
        >
          {ville}
        </span>
      </div>

      <div data-grid="421" style={{ marginBottom: 32 }}>
        {URGENCES.map((u) => (
          <button
            key={u.nom}
            style={{
              ...CARTE,
              cursor: "pointer",
              textAlign: "left",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              font: "inherit",
              color: "inherit",
            }}
          >
            <span
              style={{
                width: 46,
                height: 46,
                borderRadius: "999px",
                background: "var(--color-accent-200)",
                display: "grid",
                placeItems: "center",
                color: "var(--color-accent-800)",
              }}
            >
              <Icon name={u.icon} size={23} strokeWidth={2.75} />
            </span>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "18px" }}>{u.nom}</span>
            <span style={{ fontSize: "14px", color: "var(--color-accent-700)" }}>{u.num}</span>
          </button>
        ))}
      </div>

      <h2 style={{ fontSize: "26px", margin: "0 0 14px" }}>Dépannage 24/24 près de vous</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {DEPANNAGE.map((d) => (
          <div key={d.nom} style={{ ...CARTE, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                width: 46,
                height: 46,
                flex: "none",
                borderRadius: "999px",
                background: "var(--color-accent-2-200)",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-heading)",
                color: "var(--color-accent-2-800)",
              }}
            >
              {d.ini}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px" }}>{d.nom}</div>
              <div style={{ color: "var(--color-neutral-700)", fontSize: "13px" }}>{d.info}</div>
            </div>
            <button className="sy-btn sy-btn--primary sy-btn--md" style={{ gap: 7 }}>
              <Icon name="phone" size={16} strokeWidth={2.75} />
              Appeler
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
