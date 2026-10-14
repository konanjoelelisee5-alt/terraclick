import { questionsSujet } from "../../data/projet";
import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { pill } from "../../components/ui";

/** Questionnaire court : les questions changent selon la sous-catégorie. */
export function ProjQuest() {
  const { etat, set, go } = useApp();
  const maison = etat.sujet.type === "etape";
  const questions = questionsSujet(etat.sujet);

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "36px 20px 70px" }}>
      <button onClick={() => go("home")} className="sy-btn sy-btn--ghost sy-btn--md" style={{ marginBottom: 12 }}>
        ← Retour
      </button>
      <h1 style={{ fontSize: "clamp(26px,4.5vw,34px)", margin: "0 0 14px" }}>{etat.sujet.questTitre}</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            style={{
              flex: 1,
              height: 7,
              borderRadius: "999px",
              background: n <= 2 ? "var(--color-accent)" : "var(--color-neutral-300)",
            }}
          />
        ))}
      </div>
      <p style={{ color: "var(--color-neutral-700)", fontSize: "13.5px", margin: "0 0 20px" }}>
        Question 2 sur 4 · les questions changent selon la sous-catégorie
      </p>

      <div
        style={{
          background: "var(--color-neutral-100)",
          border: "1px solid var(--color-divider)",
          borderRadius: "calc(var(--radius-lg) * 1.15)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {questions.map((q, qi) => (
          <div key={q.titre} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <h3 style={{ margin: 0, fontSize: "19px" }}>{q.titre}</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {q.choix.map((nom, i) => (
                <button
                  key={nom}
                  onClick={() => {
                    const rep = etat.rep.slice();
                    rep[qi] = i;
                    set({ rep });
                  }}
                  style={pill(i === (etat.rep[qi] ?? q.sel))}
                >
                  {nom}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="sy-field">
          <label className="sy-field__label" htmlFor="q-budget">
            {maison ? "Budget global du projet (FCFA)" : "Budget (FCFA)"}
          </label>
          <input
            id="q-budget"
            className="sy-input"
            placeholder={maison ? "12 000 000 – 18 000 000" : "250 000 – 400 000"}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            padding: 14,
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              flex: "none",
              borderRadius: "999px",
              background: "var(--color-accent-200)",
              display: "grid",
              placeItems: "center",
              color: "var(--color-accent-800)",
            }}
          >
            <Icon name="message-circle" size={17} strokeWidth={2.75} />
          </span>
          <p style={{ color: "var(--color-neutral-700)", fontSize: "13.5px", margin: 0 }}>
            {maison
              ? "Vous pouvez aussi répondre par messagerie : « maison 3 pièces à Habitat, terrain déjà acheté, budget 15 millions ». Nous remplissons le formulaire pour vous."
              : "Vous pouvez aussi répondre par messagerie : « un PC pour du montage vidéo, budget 400 000 ». Nous remplissons le formulaire pour vous."}
          </p>
        </div>

        <div data-r="devis-nav" style={{ display: "flex", gap: 10 }}>
          <button onClick={() => go("projMode")} className="sy-btn sy-btn--outline sy-btn--md">
            Précédent
          </button>
          <button onClick={() => go("projOffres")} className="sy-btn sy-btn--primary sy-btn--md" style={{ flex: 1 }}>
            {maison ? "Voir les étapes et les prestataires" : "Voir les équipements qui correspondent"}
          </button>
        </div>
      </div>
    </main>
  );
}
