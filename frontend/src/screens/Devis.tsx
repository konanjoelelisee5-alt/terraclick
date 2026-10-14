import { CATS, DELAIS } from "../data/catalogue";
import { useApp } from "../state/app";
import { Icon } from "../components/Icon";
import { pill } from "../components/ui";

/** Demande de devis en trois étapes : le problème, le lieu, le budget. */
export function Devis() {
  const { etat, set, go } = useApp();
  const { step } = etat;

  const labelSuivant =
    step === 3 ? "Envoyer ma demande" : step === 2 ? "Suivant : le budget" : "Suivant : le lieu";

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "36px 20px 70px" }}>
      <button onClick={() => go("home")} className="sy-btn sy-btn--ghost sy-btn--md" style={{ marginBottom: 12 }}>
        ← Retour
      </button>
      <h1 style={{ fontSize: "clamp(28px,5vw,38px)", margin: "0 0 6px" }}>Décrivez votre besoin</h1>
      <p style={{ color: "var(--color-neutral-700)", fontSize: "15.5px", margin: "0 0 24px" }}>
        Trois étapes. Les prestataires vérifiés du quartier vous répondent avec un prix.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              flex: 1,
              height: 7,
              borderRadius: "999px",
              background: step >= n ? "var(--color-accent)" : "var(--color-neutral-300)",
            }}
          />
        ))}
      </div>

      <div
        style={{
          background: "var(--color-neutral-100)",
          border: "1px solid var(--color-divider)",
          borderRadius: "calc(var(--radius-lg) * 1.15)",
          padding: 26,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ margin: 0 }}>1 · Quel est le problème ?</h3>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="devis-besoin">
                Votre besoin
              </label>
              <textarea
                id="devis-besoin"
                className="sy-textarea"
                placeholder="Ex. la douche fuit depuis hier, l'eau coule dans le couloir"
                style={{ borderRadius: "var(--radius-md)" }}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATS.map((nom, i) => (
                <button key={nom} onClick={() => set({ cat: i })} style={pill(i === etat.cat)}>
                  {nom}
                </button>
              ))}
            </div>
            <button className="sy-btn sy-btn--outline sy-btn--md" style={{ alignSelf: "flex-start", gap: 7 }}>
              <Icon name="camera" size={16} strokeWidth={2.75} />
              Ajouter une photo
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ margin: 0 }}>2 · Où et quand ?</h3>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="devis-quartier">
                Quartier
              </label>
              <input id="devis-quartier" className="sy-input" placeholder="Habitat, Kokrenou, Assabou…" />
            </div>
            <div className="sy-field">
              <span className="sy-field__label">Quand</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {DELAIS.map((nom, i) => (
                  <button key={nom} onClick={() => set({ quand: i })} style={pill(i === etat.quand)}>
                    {nom}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ margin: 0 }}>3 · Votre budget</h3>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="devis-budget">
                Fourchette indicative (FCFA)
              </label>
              <input id="devis-budget" className="sy-input" placeholder="Ex. 10 000 – 25 000" />
            </div>
            <p style={{ color: "var(--color-neutral-700)", fontSize: "14px", margin: 0 }}>
              Nous envoyons votre demande aux prestataires vérifiés du quartier. Leurs prix arrivent dans votre
              messagerie.
            </p>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
            <span
              style={{
                width: 54,
                height: 54,
                borderRadius: "999px",
                background: "var(--color-accent-2-200)",
                display: "grid",
                placeItems: "center",
                color: "var(--color-accent-2-800)",
              }}
            >
              <Icon name="check" size={26} strokeWidth={2.75} />
            </span>
            <h3 style={{ margin: 0 }}>Demande envoyée à 7 pros</h3>
            <p style={{ color: "var(--color-neutral-700)", fontSize: "14.5px", margin: 0 }}>
              Vous recevrez leurs propositions dans la messagerie, en général sous 30 minutes.
            </p>
            <button onClick={() => go("home")} className="sy-btn sy-btn--primary sy-btn--md">
              Retour à l'accueil
            </button>
          </div>
        )}

        {step < 4 && (
          <div data-r="devis-nav" style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => set({ step: Math.max(1, step - 1) })}
              className="sy-btn sy-btn--outline sy-btn--md"
            >
              Précédent
            </button>
            <button
              onClick={() => set({ step: Math.min(4, step + 1) })}
              className="sy-btn sy-btn--primary sy-btn--md"
              style={{ flex: 1 }}
            >
              {labelSuivant}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
