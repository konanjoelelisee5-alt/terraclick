import { useApp } from "../state/app";
import { Icon } from "../components/Icon";

/** Confirmation de publication : la référence et le délai de réponse annoncé. */
export function Publie() {
  const { go, rechercher, exigerCompte } = useApp();

  return (
    <main style={{ maxWidth: 620, margin: "0 auto", padding: "44px 20px 80px", textAlign: "center" }}>
      <span
        style={{
          width: 64,
          height: 64,
          margin: "0 auto 18px",
          borderRadius: "999px",
          background: "var(--state-success)",
          color: "#fff",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon name="check" size={32} strokeWidth={2.25} />
      </span>
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 800,
          letterSpacing: "-0.025em",
          fontSize: "clamp(26px,4.5vw,36px)",
          margin: "0 0 10px",
        }}
      >
        Votre projet est publié
      </h1>
      <p style={{ fontSize: "15.5px", lineHeight: 1.55, margin: "0 0 8px", color: "var(--text-muted)" }}>
        Référence <span style={{ fontFamily: "var(--font-mono)" }}>PROJ-2026-00458</span>
      </p>
      <p style={{ fontSize: "15px", lineHeight: 1.55, margin: "0 0 26px", color: "var(--text-muted)" }}>
        Les premières propositions arrivent en général sous 24 à 48 heures. Vous serez prévenu par SMS et dans
        l'application.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => exigerCompte(() => go("mesProjets"))}
          className="sy-btn sy-btn--primary sy-btn--md"
          style={{ minHeight: 48 }}
        >
          Voir mon projet
        </button>
        <button
          onClick={() => rechercher("Construction & travaux", { categorie: "entreprises-de-construction" })}
          className="sy-btn sy-btn--outline sy-btn--md"
          style={{ minHeight: 48 }}
        >
          Retourner à la recherche
        </button>
      </div>
    </main>
  );
}
