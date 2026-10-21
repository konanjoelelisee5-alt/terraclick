import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { useApp } from "../../state/app";
import { francs } from "../client/store";
import { AIDE, PACK, TITRE_ETAPE } from "./commun";

const GRIS = "#5C5248";

const BOUTON: React.CSSProperties = {
  width: 40,
  height: 40,
  flex: "none",
  display: "grid",
  placeItems: "center",
  borderRadius: 999,
  border: "1.5px solid var(--color-divider)",
  background: "var(--color-neutral-100)",
  color: "var(--color-text)",
  cursor: "pointer",
};

/**
 * Pressing, première étape de la demande : le client compose son pack, article par article,
 * avec le prix indicatif par pièce et le total qui se met à jour. Seuls les articles et leur
 * nombre partent à l'API, qui recalcule les prix depuis son catalogue.
 */
export function PackPressing() {
  const { etat, modifierBesoin } = useApp();
  const pack = etat.besoin.pack;
  const { donnees: articles, erreur } = useApi(() => api.articlesPressing(), []);

  const quantite = (cle: string) => pack.find((a) => a.cle === cle)?.quantite ?? 0;
  const changer = (cle: string, delta: number) => {
    const suivant = Math.max(0, Math.min(200, quantite(cle) + delta));
    const reste = pack.filter((a) => a.cle !== cle);
    const nouveau = suivant ? [...reste, { cle, quantite: suivant }] : reste;
    modifierBesoin({ pack: nouveau, probleme: nouveau.length ? PACK : null });
  };

  const pieces = pack.reduce((n, a) => n + a.quantite, 0);
  const total = pack.reduce((n, a) => n + a.quantite * (articles?.find((x) => x.cle === a.cle)?.prix ?? 0), 0);

  return (
    <>
      <h1 style={TITRE_ETAPE}>Composez votre pack</h1>
      <p style={AIDE}>Ajoutez les vêtements et le linge à confier au pressing. Prix indicatifs par pièce, confirmés par le pressing.</p>
      {erreur && <p role="alert" style={{ color: "var(--state-danger)" }}>La liste des articles n'a pas pu être chargée.</p>}
      <div data-r="pack-pressing" style={{ display: "flex", flexDirection: "column" }}>
        {articles?.map((a) => {
          const n = quantite(a.cle);
          return (
            <div key={a.cle} data-r="article-pack" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: "15.5px", fontWeight: n ? 700 : 500 }}>{a.nom}</span>
                <span style={{ display: "block", fontSize: "13px", color: GRIS }}>{a.prix_affichage} la pièce</span>
              </span>
              <button type="button" onClick={() => changer(a.cle, -1)} disabled={!n} aria-label={`Retirer : ${a.nom}`} style={{ ...BOUTON, opacity: n ? 1 : 0.4 }}>
                <span aria-hidden="true" style={{ fontSize: "20px", lineHeight: 1 }}>−</span>
              </button>
              <span aria-label={`${n} ${a.nom}`} style={{ width: 28, textAlign: "center", fontWeight: 700, fontSize: "16px" }}>
                {n}
              </span>
              <button
                type="button"
                onClick={() => changer(a.cle, 1)}
                aria-label={`Ajouter : ${a.nom}`}
                style={{ ...BOUTON, borderColor: "var(--color-accent)", background: n ? "var(--color-accent)" : "var(--color-neutral-100)", color: n ? "#fff" : "var(--color-accent-700)" }}
              >
                <span aria-hidden="true" style={{ fontSize: "20px", lineHeight: 1 }}>+</span>
              </button>
            </div>
          );
        })}
      </div>
      <div
        data-r="total-pack"
        role="status"
        style={{ position: "sticky", bottom: 0, marginTop: 14, padding: "12px 16px", borderRadius: 16, background: "var(--color-accent-100)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
      >
        <span style={{ fontSize: "15px" }}>
          {pieces} pièce{pieces > 1 ? "s" : ""}
        </span>
        <span style={{ fontSize: "17px", fontWeight: 800 }}>Total estimé : {francs(total)}</span>
      </div>
    </>
  );
}
