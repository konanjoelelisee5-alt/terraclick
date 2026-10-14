import { CRITERES_COMPARAISON, LOTS_ARTISANS, OFFRES_CLE } from "../../../data/chantier";
import { PROS } from "../../../data/catalogue";
import { useApp } from "../../../state/app";
import { Rating } from "../../../components/Rating";
import { TITRE_SECTION, pill } from "../../../components/ui";

const CELLULE_TETE: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  padding: "8px 0",
  borderBottom: "1px solid var(--border-subtle)",
};

/**
 * Propositions reçues : entreprises clé en main d'un côté, artisans par lot de
 * l'autre, et le tableau qui compare les deux approches sur huit critères.
 */
export function OngletPropositions() {
  const { etat, set, go, ouvrirChat, exigerCompte } = useApp();
  const cle = etat.sousProp === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => set({ sousProp: 0 })} style={pill(cle)}>
          Entreprises clé en main
        </button>
        <button onClick={() => set({ sousProp: 1 })} style={pill(!cle)}>
          Artisans séparés
        </button>
      </div>

      {cle &&
        OFFRES_CLE.map((o) => (
          <div key={o.nom} className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <span
                style={{
                  width: 46,
                  height: 46,
                  flex: "none",
                  borderRadius: "var(--radius-md)",
                  background: "var(--kola-50)",
                  color: "var(--kola-600)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: "15px",
                }}
              >
                {o.ini}
              </span>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "19px" }}>{o.nom}</div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: 2 }}>{o.zone}</div>
              </div>
              <span className="sy-badge sy-badge--success">Profil vérifié</span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <span className="sy-badge sy-badge--brand">{o.prix}</span>
              <span className="sy-badge sy-badge--neutral">Délai {o.delai}</span>
              <Rating value={Number(o.note.replace(",", "."))} count={o.avis} />
              <span className="sy-badge sy-badge--neutral">{o.paiement}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: "14px", lineHeight: 1.5 }}>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Inclus :</span> {o.inclus}
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Exclu :</span> {o.exclus}
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Garantie :</span> {o.garantie}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => exigerCompte(() => go("contrat", { contratStep: 1, sujetPv: false }))}
                className="sy-btn sy-btn--primary sy-btn--md"
              >
                Voir le devis
              </button>
              <button onClick={() => ouvrirChat(PROS[0])} className="sy-btn sy-btn--outline sy-btn--md">
                Poser une question
              </button>
              <button className="sy-btn sy-btn--ghost sy-btn--md">Ajouter à la comparaison</button>
            </div>
          </div>
        ))}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!cle &&
          LOTS_ARTISANS.map((a) => (
            <div key={a.nom} className="sy-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--kola-600)",
                  }}
                >
                  {a.metier}
                </span>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "18px" }}>{a.nom}</span>
                <span className="sy-badge sy-badge--brand" style={{ marginLeft: "auto" }}>
                  {a.prix}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <Rating value={Number(a.note.replace(",", "."))} count={a.avis} />
                <span className="sy-badge sy-badge--neutral">{a.zone}</span>
                <span className="sy-badge sy-badge--success">{a.dispo}</span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => go("fiche", { fiche: null })}
                  className="sy-btn sy-btn--outline sy-btn--md"
                >
                  Voir le profil
                </button>
                <button className="sy-btn sy-btn--primary sy-btn--md">Ajouter à mon équipe</button>
                <button className="sy-btn sy-btn--ghost sy-btn--md">Ajouter à la comparaison</button>
              </div>
            </div>
          ))}

        <div className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <span style={TITRE_SECTION}>Comparer les offres sélectionnées</span>
          <div style={{ overflowX: "auto" }}>
            <div data-r="comp" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", gap: 0 }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                Critère
              </span>
              <span style={CELLULE_TETE}>Clé en main</span>
              <span style={CELLULE_TETE}>Artisans séparés</span>
              {CRITERES_COMPARAISON.map((c) => (
                <div key={c.cle} style={{ display: "contents" }}>
                  <span
                    style={{
                      fontSize: "13.5px",
                      color: "var(--text-muted)",
                      padding: "10px 8px 10px 0",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    {c.cle}
                  </span>
                  <span
                    style={{
                      fontSize: "13.5px",
                      padding: "10px 8px 10px 0",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    {c.a}
                  </span>
                  <span style={{ fontSize: "13.5px", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    {c.b}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
