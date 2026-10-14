import { ETAPES_PROJET } from "../../../data/projet";
import { useApp } from "../../../state/app";
import { Icon } from "../../../components/Icon";
import { badgeEtape, carteEtape, puceEtape } from "../../../components/ui";

/** Vue d'ensemble : les huit étapes verrouillées et le séquestre de l'étape en cours. */
export function OngletVue() {
  const { go } = useApp();

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <div
          style={{
            flex: 1,
            height: 9,
            borderRadius: "999px",
            background: "var(--color-neutral-200)",
            overflow: "hidden",
          }}
        >
          <div style={{ width: "38%", height: "100%", background: "var(--color-accent)" }} />
        </div>
        <span style={{ color: "var(--color-neutral-700)", fontSize: "13.5px", whiteSpace: "nowrap" }}>
          3 / 8 étapes
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ETAPES_PROJET.map((e) => (
          <div key={e.n} style={carteEtape(e.etat)}>
            <span style={puceEtape(e.etat)}>{e.n}</span>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "18px" }}>{e.nom}</span>
                <span style={badgeEtape(e.etat)}>
                  {e.etat === "fait" ? "Terminé" : e.etat === "encours" ? "En cours" : "Bloquée"}
                </span>
              </div>
              <p style={{ color: "var(--color-neutral-700)", fontSize: "13.5px", margin: 0 }}>{e.info}</p>

              {e.etat === "encours" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 2 }}>
                  <div data-r="chat-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button onClick={() => go("projOffres")} className="sy-btn sy-btn--primary sy-btn--md">
                      Comparer les offres
                    </button>
                    <button onClick={() => go("projSuivi")} className="sy-btn sy-btn--outline sy-btn--md">
                      Voir le séquestre
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      paddingTop: 12,
                      borderTop: "1px solid var(--color-divider)",
                    }}
                  >
                    <span style={{ color: "var(--color-neutral-700)", fontSize: "13px", flex: 1 }}>
                      Argent bloqué pour cette étape
                    </span>
                    <span className="sy-badge sy-badge--brand">
                      <Icon name="lock" size={13} strokeWidth={2} />1 200 000 F en séquestre
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p style={{ color: "var(--color-neutral-700)", fontSize: "13.5px", marginTop: 16 }}>
        Une étape ne s'ouvre que si la précédente est validée par vous et par l'agent.
      </p>
    </>
  );
}
