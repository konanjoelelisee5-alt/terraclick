import { useApp } from "../state/app";
import { Icon } from "../components/Icon";

const POINTS_RECHERCHE = [
  "Professionnels vérifiés",
  "Recherche par ville ou quartier",
  "Notes et avis clients",
  "Demande de devis",
];

const POINTS_PROJET = [
  "Comparaison de devis",
  "Suivi des travaux avec photos",
  "Planning et validations",
  "Documents, garanties et SAV",
];

function Points({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {items.map((p) => (
        <div key={p} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="check" size={17} color="var(--state-success)" />
          <span style={{ fontSize: "14.5px" }}>{p}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Page « Construction & travaux » : les deux façons d'aborder un chantier.
 * L'intervention ponctuelle passe par la recherche ; le projet complet passe
 * par l'assistant et son suivi — c'est la voie mise en avant.
 */
export function Construction() {
  const { go, rechercher, exigerCompte } = useApp();

  return (
    <main data-r="container" style={{ paddingTop: 34, paddingBottom: 70 }}>
      <button onClick={() => go("home")} className="sy-btn sy-btn--ghost sy-btn--md" style={{ marginBottom: 14 }}>
        ← Accueil
      </button>
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 800,
          letterSpacing: "-0.025em",
          fontSize: "clamp(28px,5vw,42px)",
          lineHeight: 1.05,
          margin: "0 0 10px",
        }}
      >
        Construction &amp; travaux
      </h1>
      <p style={{ fontSize: "16.5px", lineHeight: 1.55, margin: "0 0 32px", maxWidth: "64ch", color: "var(--text-muted)" }}>
        Trouvez un professionnel pour une intervention ponctuelle ou faites-vous accompagner dans votre projet de
        construction.
      </p>

      <div data-r="promo" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "stretch" }}>
        <div className="sy-card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 16 }}>
          <span
            style={{
              width: 52,
              height: 52,
              borderRadius: "var(--radius-md)",
              background: "var(--kola-50)",
              color: "var(--kola-600)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="search" size={26} />
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: "24px",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            Trouver un professionnel
          </span>
          <p style={{ fontSize: "14.5px", lineHeight: 1.55, margin: 0, color: "var(--text-muted)" }}>
            Trouvez rapidement un maçon, plombier, électricien, menuisier, carreleur, peintre, vitrier, quincaillerie,
            cimenterie, architecte ou entreprise de construction près de chez vous.
          </p>
          <Points items={POINTS_RECHERCHE} />
          <button
            onClick={() => rechercher("Construction & travaux", { categorie: "entreprises-de-construction" })}
            className="sy-btn sy-btn--outline sy-btn--md"
            style={{ marginTop: "auto", justifyContent: "center", minHeight: 48 }}
          >
            Rechercher un professionnel
          </button>
        </div>

        <div
          style={{
            position: "relative",
            background: "var(--surface-card)",
            border: "1.5px solid var(--color-accent)",
            borderRadius: "calc(var(--radius-lg) * 1.15)",
            boxShadow: "var(--shadow-md)",
            padding: 26,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -13,
              left: 26,
              fontSize: "12px",
              fontWeight: 700,
              padding: "5px 14px",
              borderRadius: "999px",
              background: "var(--color-accent)",
              color: "#fff",
            }}
          >
            Recommandé
          </span>
          <span
            style={{
              width: 52,
              height: 52,
              borderRadius: "var(--radius-md)",
              background: "var(--kola-50)",
              color: "var(--kola-600)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="hard-hat" size={26} />
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: "24px",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            Créer un projet avec suivi
          </span>
          <p style={{ fontSize: "14.5px", lineHeight: 1.55, margin: 0, color: "var(--text-muted)" }}>
            Comparez les entreprises et artisans, signez un contrat, effectuez des paiements par étapes et suivez votre
            chantier jusqu'à la réception finale.
          </p>
          <Points items={POINTS_PROJET} />
          <button
            onClick={() => exigerCompte(() => go("assistant", { assistStep: 1 }))}
            className="sy-btn sy-btn--primary sy-btn--md"
            style={{ marginTop: "auto", justifyContent: "center", minHeight: 48, fontSize: "16px" }}
          >
            Commencer mon projet
          </button>
        </div>
      </div>
    </main>
  );
}
