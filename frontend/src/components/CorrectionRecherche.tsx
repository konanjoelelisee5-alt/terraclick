import { useApp } from "../state/app";

/* « Résultats pour plombier — Rechercher plutôt plonbier », comme Google et Chrome : la
   recherche contenait une faute de frappe, l'API l'a corrigée et les résultats affichés sont
   ceux du mot voulu. Le client peut revenir à sa saisie telle quelle. */

export function CorrectionRecherche({ correction, style }: { correction: { originale: string; corrigee: string }; style?: React.CSSProperties }) {
  const { rechercher } = useApp();

  return (
    <div data-r="correction-recherche" role="status" style={{ fontSize: "15px", lineHeight: 1.5, ...style }}>
      <span style={{ display: "block" }}>
        Résultats pour{" "}
        <strong>
          <em style={{ color: "var(--color-accent-700)" }}>{correction.corrigee}</em>
        </strong>
      </span>
      <span style={{ display: "block", fontSize: "14px", color: "#5C5248" }}>
        Rechercher plutôt{" "}
        <button
          data-r="rechercher-plutot"
          onClick={() => rechercher(correction.originale, { q: correction.originale, exact: true })}
          style={{ padding: 0, border: 0, background: "none", font: "inherit", color: "var(--color-accent-700)", textDecoration: "underline", cursor: "pointer" }}
        >
          {correction.originale}
        </button>
      </span>
    </div>
  );
}
