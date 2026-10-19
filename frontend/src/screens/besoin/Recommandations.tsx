import { useState } from "react";
import { secteurParCle } from "../../data/catalogue";
import { api, type PrestataireApi } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { useApp } from "../../state/app";
import { AIDE, CadreParcours, TITRE_ETAPE } from "./commun";
import { CarteTechnicien } from "./CarteTechnicien";

/**
 * « Trouver pour moi » : les 3 meilleurs techniciens pour ce besoin, le premier mis en
 * avant. Le client confirme, en choisit un autre, en demande d'autres ou passe à la
 * comparaison.
 */
export function Recommandations() {
  const { etat, go, modifierBesoin } = useApp();
  const b = etat.besoin;
  const secteur = secteurParCle(b.secteur);
  const [exclus, setExclus] = useState<number[]>([]);

  const { donnees: techniciens, erreur, chargement } = useApi(
    (signal) => api.recommandations({ secteur: b.secteur ?? "", quartier: b.quartier, exclure: exclus }, signal),
    [b.secteur, b.quartier, exclus.join(",")],
  );

  const choisir = (p: PrestataireApi) => {
    modifierBesoin({ prestataire: p, mode: "recommande" });
    go("confirmation");
  };
  const comparer = () => {
    modifierBesoin({ mode: "choisi" });
    go("results", { titre: secteur?.nom ?? "", filtre: { q: secteur?.nom ?? "" }, quartier: 0, carte: false });
  };

  return (
    <CadreParcours retour={() => go("besoin", { besoinEtape: 5 })}>
      <h1 style={TITRE_ETAPE}>{exclus.length ? "D'autres techniciens pour vous" : "Nos meilleurs techniciens pour vous"}</h1>
      <p style={AIDE}>
        Choisis près de chez vous parmi les {secteur?.metier.toLowerCase() ?? "technicien"}s vérifiés, selon leurs avis et leur réactivité.
      </p>

      {erreur && <p role="alert" style={{ ...AIDE, color: "var(--color-accent-700)" }}>{erreur}</p>}
      {chargement && !techniciens && <p role="status" style={AIDE}>Recherche des techniciens…</p>}

      {techniciens && techniciens.length === 0 && (
        <div role="status" style={{ ...AIDE, padding: 18, borderRadius: "var(--radius-lg)", background: "var(--color-surface)" }}>
          {exclus.length
            ? "Il n'y a pas d'autre technicien pour ce service pour l'instant."
            : "Aucun technicien n'est encore inscrit pour ce service près de chez vous."}
          {exclus.length > 0 && (
            <button onClick={() => setExclus([])} className="sy-btn sy-btn--ghost sy-btn--md" style={{ display: "flex", marginTop: 8 }}>
              Revoir les premières propositions
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, opacity: chargement && techniciens ? 0.55 : 1 }}>
        {techniciens?.map((p, i) => (
          <CarteTechnicien key={p.id} p={p} badge={i === 0 && !exclus.length ? "Recommandé" : undefined} mis_en_avant={i === 0}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => choisir(p)}
                className={`sy-btn sy-btn--${i === 0 ? "primary" : "outline"} sy-btn--md`}
                style={{ flex: "1 1 180px", minHeight: 46, justifyContent: "center" }}
              >
                {i === 0 ? "Confirmer ce technicien" : "Choisir celui-ci"}
              </button>
              <button
                onClick={() => go("fiche", { fiche: p.id })}
                className="sy-btn sy-btn--ghost sy-btn--md"
                style={{ flex: "1 1 120px", minHeight: 46, justifyContent: "center" }}
              >
                Voir le profil
              </button>
            </div>
          </CarteTechnicien>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 22 }}>
        {!!techniciens?.length && (
          <button
            onClick={() => setExclus((x) => [...x, ...techniciens.map((t) => t.id)])}
            className="sy-btn sy-btn--outline sy-btn--md"
            style={{ minHeight: 46, justifyContent: "center" }}
          >
            Demander d'autres techniciens
          </button>
        )}
        <button onClick={comparer} className="sy-btn sy-btn--ghost sy-btn--md" style={{ minHeight: 46, justifyContent: "center" }}>
          Comparer tous les {secteur?.metier.toLowerCase() ?? "technicien"}s moi-même
        </button>
      </div>
    </CadreParcours>
  );
}
