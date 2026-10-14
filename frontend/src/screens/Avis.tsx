import { CRITERES_AVIS } from "../data/compte";
import { useApp } from "../state/app";
import { Icon } from "../components/Icon";

/**
 * Dépôt d'avis, enchaîné depuis le reçu : il est donc impossible de noter un
 * prestataire sans avoir confirmé la réception.
 */
export function Avis() {
  const { etat, set, go, exigerCompte } = useApp();

  const noter = (cle: "ponct" | "qual" | "prix", n: number) => set({ notes: { ...etat.notes, [cle]: n } });

  return (
    <main style={{ maxWidth: 620, margin: "0 auto", padding: "30px 20px 70px" }}>
      <button onClick={() => go("recu")} className="sy-btn sy-btn--ghost sy-btn--md" style={{ marginBottom: 12 }}>
        ← Reçu
      </button>
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 800,
          letterSpacing: "-0.025em",
          fontSize: "clamp(26px,4.5vw,34px)",
          margin: "0 0 6px",
        }}
      >
        Comment ça s'est passé ?
      </h1>
      <p style={{ fontSize: "15px", margin: "0 0 22px", color: "var(--text-muted)" }}>
        Votre avis n'est publié qu'après réception confirmée. Il aide le quartier à choisir.
      </p>

      <div className="sy-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 48,
              height: 48,
              flex: "none",
              borderRadius: "999px",
              background: "var(--kola-50)",
              color: "var(--kola-600)",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: "16px",
            }}
          >
            TI
          </span>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "18px" }}>Tech Ivoire</div>
            <div style={{ fontSize: "13.5px", color: "var(--text-muted)" }}>Ordinateur 16 Go · 340 000 F</div>
          </div>
        </div>

        {CRITERES_AVIS.map((c) => (
          <div key={c.cle} style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: "15px", minWidth: 150 }}>{c.titre}</span>
            <span style={{ display: "flex", gap: 2 }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const acquise = (etat.notes[c.cle] || 0) >= n;
                return (
                  <button
                    key={n}
                    onClick={() => noter(c.cle, n)}
                    aria-label={`${c.titre} : ${n} sur 5`}
                    style={{
                      background: "none",
                      border: 0,
                      padding: 2,
                      cursor: "pointer",
                      lineHeight: 0,
                      color: acquise ? "var(--soleil-500)" : "var(--border-subtle)",
                    }}
                  >
                    <Icon name="star" size={28} fill={acquise ? "currentColor" : "none"} />
                  </button>
                );
              })}
            </span>
          </div>
        ))}

        <div className="sy-field">
          <label className="sy-field__label" htmlFor="avis-texte">
            Votre commentaire
          </label>
          <textarea
            id="avis-texte"
            className="sy-textarea"
            value={etat.avisTexte}
            onChange={(e) => set({ avisTexte: e.target.value })}
            placeholder="Ce qui s'est bien passé, ce qui pourrait être mieux…"
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="sy-btn sy-btn--outline sy-btn--md" style={{ gap: 8 }}>
            <Icon name="camera" size={16} />
            Ajouter une photo du travail
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() =>
              exigerCompte(() => go("compte", { notes: { ponct: 0, qual: 0, prix: 0 }, avisTexte: "" }))
            }
            className="sy-btn sy-btn--primary sy-btn--md"
            style={{ flex: 1, justifyContent: "center", minHeight: 48 }}
          >
            Publier mon avis
          </button>
          <button
            onClick={() => exigerCompte(() => go("compte"))}
            className="sy-btn sy-btn--ghost sy-btn--md"
          >
            Plus tard
          </button>
        </div>
      </div>
    </main>
  );
}
