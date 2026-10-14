import { FILTRES_PROJET, MES_PROJETS, sujetMaison } from "../data/projet";
import { useApp } from "../state/app";
import { Icon } from "../components/Icon";
import { statutProjet } from "../components/ui";

/** Liste des projets suivis, filtrable sur les sept statuts du parcours. */
export function MesProjets() {
  const { etat, set, go, exigerCompte } = useApp();

  const selection = FILTRES_PROJET[etat.filtreProjet];
  const visibles = selection === "Tous" ? MES_PROJETS : MES_PROJETS.filter((p) => p.statut === selection);
  const nouveauProjet = () => exigerCompte(() => go("assistant", { assistStep: 1 }));

  return (
    <main data-r="container" style={{ paddingTop: 30, paddingBottom: 70 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              fontSize: "clamp(26px,4.5vw,36px)",
              margin: "0 0 4px",
            }}
          >
            Mes projets
          </h1>
          <p style={{ fontSize: "14.5px", margin: 0, color: "var(--text-muted)" }}>
            {visibles.length} {visibles.length > 1 ? "projets" : "projet"} · Yamoussoukro
          </p>
        </div>
        <button onClick={nouveauProjet} className="sy-btn sy-btn--primary sy-btn--md" style={{ minHeight: 46 }}>
          Nouveau projet suivi
        </button>
      </div>

      <div data-r="steprail" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 20 }}>
        {FILTRES_PROJET.map((nom, i) => {
          const actif = i === etat.filtreProjet;
          return (
            <button
              key={nom}
              onClick={() => set({ filtreProjet: i })}
              style={{
                cursor: "pointer",
                font: "inherit",
                fontSize: "13.5px",
                padding: "8px 16px",
                borderRadius: "999px",
                whiteSpace: "nowrap",
                minHeight: 40,
                border: actif ? "1.5px solid var(--color-accent)" : "1px solid var(--border-subtle)",
                background: actif ? "var(--kola-50)" : "var(--surface-card)",
                color: actif ? "var(--kola-600)" : "var(--text-muted)",
                fontWeight: actif ? 600 : 400,
              }}
            >
              {nom}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visibles.map((p) => (
          <div key={p.titre} className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <span
                style={{
                  width: 42,
                  height: 42,
                  flex: "none",
                  borderRadius: "var(--radius-md)",
                  background: "var(--kola-50)",
                  color: "var(--kola-600)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="hard-hat" size={21} />
              </span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "18px", lineHeight: 1.25 }}>
                  {p.titre}
                </div>
                <div
                  style={{
                    fontSize: "12.5px",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                    marginTop: 3,
                  }}
                >
                  {p.ref}
                </div>
              </div>
              <span style={statutProjet(p.ton)}>{p.statut}</span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Icon name="wallet" size={16} color="var(--text-muted)" />
                <span style={{ fontSize: "14px" }}>{p.budget}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Icon name="calendar" size={16} color="var(--text-muted)" />
                <span style={{ fontSize: "14px" }}>{p.delai}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Icon name="file-text" size={16} color="var(--text-muted)" />
                <span style={{ fontSize: "14px" }}>{p.devis}</span>
              </div>
            </div>

            <button
              onClick={() =>
                go("projDash", {
                  sujet: { ...sujetMaison(), titre: p.titre, ref: p.ref, montant: p.budget },
                  onglet: 0,
                })
              }
              className="sy-btn sy-btn--outline sy-btn--md"
              style={{ alignSelf: "flex-start", minHeight: 44 }}
            >
              Voir le projet
            </button>
          </div>
        ))}
      </div>

      {visibles.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "52px 20px",
            background: "var(--color-surface)",
            borderRadius: "calc(var(--radius-lg) * 1.15)",
          }}
        >
          <h3 style={{ margin: "0 0 6px", fontSize: "19px" }}>Aucun projet dans cet état</h3>
          <p style={{ fontSize: "14.5px", margin: "0 0 16px", color: "var(--text-muted)" }}>
            Changez de filtre, ou lancez un nouveau projet suivi.
          </p>
          <button onClick={nouveauProjet} className="sy-btn sy-btn--primary sy-btn--md">
            Nouveau projet suivi
          </button>
        </div>
      )}
    </main>
  );
}
