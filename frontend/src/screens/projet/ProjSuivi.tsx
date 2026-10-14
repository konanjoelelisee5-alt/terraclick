import { etapesSequestre } from "../../data/projet";
import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { puceEtape } from "../../components/ui";

/**
 * Séquestre et réception. L'argent est bloqué à la validation de l'offre et
 * n'est versé qu'après la vérification de l'agent et la confirmation du client.
 */
export function ProjSuivi() {
  const { etat, go, poserSujetMaison } = useApp();
  const suivi = etapesSequestre(etat.sujet);

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "30px 20px 70px" }}>
      <button
        onClick={() => poserSujetMaison()}
        className="sy-btn sy-btn--ghost sy-btn--md"
        style={{ marginBottom: 10 }}
      >
        ← {etat.sujet.ref}
      </button>

      <div
        style={{
          background: "var(--color-neutral-100)",
          border: "2px solid var(--color-accent)",
          borderRadius: "calc(var(--radius-lg) * 1.15)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 26,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: "15px" }}>Montant bloqué</span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "16px",
              padding: "8px 18px",
              borderRadius: "999px",
              background: "var(--color-accent)",
              color: "var(--color-bg)",
              whiteSpace: "nowrap",
            }}
          >
            {etat.sujet.montant}
          </span>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <span className="sy-badge sy-badge--success">
            <Icon name="check" size={13} strokeWidth={2} />
            Wave
          </span>
          <span className="sy-badge sy-badge--neutral">Orange Money</span>
          <span className="sy-badge sy-badge--neutral">MTN</span>
        </div>
        <p style={{ color: "var(--color-neutral-700)", fontSize: "13.5px", margin: 0 }}>
          Payé depuis Wave · ni vous ni le prestataire n'y touchez avant votre confirmation.
        </p>
      </div>

      <h2 style={{ fontSize: "24px", margin: "0 0 16px" }}>Suivi</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {suivi.map((x) => (
          <div
            key={x.nom}
            style={{
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              ...(x.etat === "bloque" ? { opacity: 0.6 } : {}),
            }}
          >
            <span style={puceEtape(x.etat)}>
              {x.n === "check" ? <Icon name="check" size={15} strokeWidth={2.25} /> : x.n}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px" }}>{x.nom}</div>
              <div style={{ color: "var(--color-neutral-700)", fontSize: "13px" }}>{x.info}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "calc(var(--radius-lg) * 1.15)",
          padding: 16,
          margin: "16px 0 26px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <span style={{ fontSize: "14px" }}>Contrôle de l'agent : {etat.sujet.checklist}</span>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {etat.sujet.preuves.map((p) => (
            <span key={p} className="sy-badge sy-badge--neutral">
              {p}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          border: "2px solid var(--color-accent)",
          background: "var(--color-neutral-100)",
          borderRadius: "calc(var(--radius-lg) * 1.15)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <h3 style={{ margin: 0 }}>À la remise</h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            padding: "12px 14px",
          }}
        >
          <span style={{ color: "var(--color-neutral-700)", fontSize: "13.5px", flex: 1 }}>
            Votre signature sur l'écran de l'agent
          </span>
          <span style={{ width: 88, height: 30, borderRadius: "var(--radius-md)", background: "var(--color-neutral-200)" }} />
        </div>
        <div data-r="chat-actions" style={{ display: "flex", gap: 10 }}>
          <button onClick={() => go("recu")} className="sy-btn sy-btn--primary sy-btn--md" style={{ flex: 1 }}>
            J'ai bien reçu
          </button>
          <button onClick={() => go("projLitige")} className="sy-btn sy-btn--outline sy-btn--md" style={{ flex: 1 }}>
            Signaler un écart
          </button>
        </div>
        <p style={{ color: "var(--color-neutral-700)", fontSize: "13px", margin: 0 }}>
          Un écart ouvre d'abord une négociation avec le prestataire ; l'argent reste bloqué.
        </p>
      </div>
    </main>
  );
}
