import { useApp } from "../state/app";
import { Icon } from "../components/Icon";

const LIGNES = [
  { cle: "Prestation", val: "Ordinateur 16 Go · Tech Ivoire" },
  { cle: "Date de réception", val: "mercredi 12 août 2026" },
  { cle: "Vérifié par", val: "Agent Traoré · checklist complète" },
  { cle: "Moyen de paiement", val: "Wave · 07 58 42 19 03" },
];

/** Reçu du séquestre libéré. Il ouvre la seule voie vers le dépôt d'un avis. */
export function Recu() {
  const { go, exigerCompte } = useApp();

  return (
    <main style={{ maxWidth: 620, margin: "0 auto", padding: "30px 20px 70px" }}>
      <button
        onClick={() => exigerCompte(() => go("compte"))}
        className="sy-btn sy-btn--ghost sy-btn--md"
        style={{ marginBottom: 12 }}
      >
        ← Mon espace
      </button>

      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "calc(var(--radius-lg) * 1.15)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "26px 26px 22px", background: "var(--kola-50)", display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              width: 48,
              height: 48,
              flex: "none",
              borderRadius: "999px",
              background: "var(--state-success)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="check" size={24} strokeWidth={2.25} />
          </span>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "24px", letterSpacing: "-0.02em" }}>
              Séquestre libéré
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              Le prestataire a été payé. Reçu REC-2841.
            </div>
          </div>
        </div>

        <div style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 14 }}>
          {LIGNES.map((l) => (
            <div key={l.cle} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: "15px" }}>
              <span style={{ color: "var(--text-muted)" }}>{l.cle}</span>
              <span style={{ textAlign: "right" }}>{l.val}</span>
            </div>
          ))}

          <div
            style={{
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: 14,
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "baseline",
            }}
          >
            <span style={{ fontSize: "15px", color: "var(--text-muted)" }}>Montant versé</span>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "28px", letterSpacing: "-0.02em" }}>
              340 000 F
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
            <button onClick={() => go("avis")} className="sy-btn sy-btn--primary sy-btn--md">
              Noter le prestataire
            </button>
            <button className="sy-btn sy-btn--outline sy-btn--md" style={{ gap: 8 }}>
              <Icon name="download" size={16} />
              Télécharger le reçu
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
