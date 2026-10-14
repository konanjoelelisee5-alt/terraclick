import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { CARTE } from "../../components/ui";

/** Choix du mode d'accompagnement : le client fait, ou nous faisons pour lui. */
export function ProjMode() {
  const { etat, go } = useApp();

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "36px 20px 70px" }}>
      <button onClick={() => go("home")} className="sy-btn sy-btn--ghost sy-btn--md" style={{ marginBottom: 12 }}>
        ← Retour
      </button>
      <h1 style={{ fontSize: "clamp(28px,5vw,38px)", margin: "0 0 6px" }}>Comment souhaitez-vous avancer ?</h1>
      <p style={{ color: "var(--color-neutral-700)", fontSize: "15.5px", margin: "0 0 24px" }}>
        Projet : {etat.sujet.titre}
      </p>

      <div data-r="promo" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ ...CARTE, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: "999px",
                background: "var(--color-surface)",
                display: "grid",
                placeItems: "center",
                color: "var(--color-neutral-800)",
              }}
            >
              <Icon name="list-checks" size={21} strokeWidth={2.75} />
            </span>
            <h3 style={{ margin: 0 }}>Mode guidé</h3>
            <span className="sy-badge sy-badge--neutral" style={{ marginLeft: "auto" }}>
              Gratuit
            </span>
          </div>
          <p style={{ color: "var(--color-neutral-700)", fontSize: "14px", margin: 0 }}>
            Nous vous montrons les étapes une par une. Vous gérez la partie technique vous-même, nous indiquons quoi
            faire et qui appeler.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            <span className="sy-badge sy-badge--neutral">Checklist</span>
            <span className="sy-badge sy-badge--neutral">Documents à fournir</span>
            <span className="sy-badge sy-badge--neutral">Prestataires suggérés</span>
          </div>
          <button
            onClick={() => go("projQuest", { mode: "guide" })}
            className="sy-btn sy-btn--outline sy-btn--md"
            style={{ alignSelf: "flex-start", marginTop: "auto" }}
          >
            Choisir le mode guidé
          </button>
        </div>

        <div
          style={{
            border: "2px solid var(--color-accent)",
            background: "var(--color-neutral-100)",
            borderRadius: "calc(var(--radius-lg) * 1.15)",
            padding: 22,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: "999px",
                background: "var(--color-accent-200)",
                display: "grid",
                placeItems: "center",
                color: "var(--color-accent-800)",
              }}
            >
              <Icon name="hand-helping" size={21} strokeWidth={2.75} />
            </span>
            <h3 style={{ margin: 0 }}>Clé en main</h3>
            <span className="sy-badge sy-badge--brand" style={{ marginLeft: "auto" }}>
              Recommandé
            </span>
          </div>
          <p style={{ color: "var(--color-neutral-700)", fontSize: "14px", margin: 0 }}>
            Nous faisons le travail pour vous. Vous ajoutez les informations manquantes et validez les offres.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            <span className="sy-badge sy-badge--neutral">Prestataires sélectionnés</span>
            <span className="sy-badge sy-badge--neutral">Offres à comparer</span>
            <span className="sy-badge sy-badge--neutral">Agent vérificateur</span>
          </div>
          <button
            onClick={() => go("projQuest", { mode: "cle" })}
            className="sy-btn sy-btn--primary sy-btn--md"
            style={{ alignSelf: "flex-start", marginTop: "auto" }}
          >
            Choisir clé en main
          </button>
        </div>
      </div>

      <p style={{ color: "var(--color-neutral-700)", fontSize: "13.5px", marginTop: 16 }}>
        Le mode est modifiable à tout moment depuis le projet.
      </p>
    </main>
  );
}
