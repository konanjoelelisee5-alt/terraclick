import { useApp } from "../state/app";
import { api } from "../lib/api";
import { CONFIG } from "../lib/config";
import { useApi } from "../lib/useApi";
import { Icon } from "./Icon";
import { OVERLINE } from "./ui";

/**
 * Méga-menu des départements ouverts par l'API, déployé depuis la barre de recherche.
 * Survol à gauche, sous-catégories réelles à droite. Avec le module Construction,
 * la colonne Construction porte en pied l'entrée vers le projet suivi — le point
 * d'entrée du module BTP, atteignable au doigt à toutes les largeurs.
 */
export function MegaMenu() {
  const { etat, set, rechercher, exigerCompte, go } = useApp();
  const { donnees: departements, erreur } = useApi(() => api.departements(), []);
  if (!etat.deptsOpen) return null;

  const deptActif = departements?.[etat.deptHover] ?? departements?.[0];
  // L'API ne renvoie que les départements ouverts : un seul pendant le MVP.
  const plusieurs = (departements?.length ?? 0) > 1;

  if (!departements || !deptActif) {
    return (
      <div
        data-r="megamenu"
        role="status"
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          top: "calc(100% + 10px)",
          width: "min(940px, calc(100vw - 32px))",
          zIndex: 15,
          padding: "28px 24px",
          background: "var(--color-neutral-100)",
          border: "1px solid var(--color-divider)",
          borderRadius: "calc(var(--radius-lg) * 1.15)",
          boxShadow: "var(--shadow-lg)",
          fontSize: "14px",
          color: "var(--color-neutral-700)",
        }}
      >
        {erreur ?? "Chargement des départements…"}
      </div>
    );
  }

  return (
    <div
      data-r="megamenu"
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        top: "calc(100% + 10px)",
        width: "min(940px, calc(100vw - 32px))",
        maxWidth: "none",
        zIndex: 15,
        background: "var(--color-neutral-100)",
        border: "1px solid var(--color-divider)",
        borderRadius: "calc(var(--radius-lg) * 1.15)",
        boxShadow: "var(--shadow-lg)",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* Un seul département ouvert (MVP) : la colonne de choix n'a plus d'objet. */}
      {plusieurs && (
        <div
          style={{
            width: 264,
            flex: "none",
            padding: 10,
            borderRight: "1px solid var(--color-divider)",
            background: "var(--color-surface)",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            maxHeight: "min(620px, 76vh)",
            overflow: "auto",
          }}
        >
          {departements.map(({ nom, slug, icone: icon }, i) => {
            const survole = i === etat.deptHover;
            return (
              <button
                key={slug}
                onMouseEnter={() => set({ deptHover: i })}
                onFocus={() => set({ deptHover: i })}
                onClick={() => rechercher(nom, { departement: slug })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "left",
                  cursor: "pointer",
                  border: 0,
                  font: "inherit",
                  fontSize: "13.5px",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  whiteSpace: "nowrap",
                  background: survole ? "var(--color-accent-200)" : "transparent",
                  color: survole ? "var(--color-accent-900)" : "inherit",
                }}
              >
                <Icon name={icon} size={17} strokeWidth={2.75} />
                {nom}
              </button>
            );
          })}
        </div>
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          maxHeight: "min(620px, 76vh)",
          overflow: "auto",
        }}
      >
        {/* Un seul département (MVP) : ni son nom ni « Tout voir », seules ses rubriques restent. */}
        {plusieurs && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "19px" }}>{deptActif.nom}</span>
            <button
              onClick={() => rechercher(deptActif.nom, { departement: deptActif.slug })}
              className="sy-btn sy-btn--ghost sy-btn--md"
              style={{ marginLeft: "auto", fontSize: "13px" }}
            >
              Tout voir
            </button>
          </div>
        )}

        <div data-grid="421" style={{ gap: "18px 22px" }}>
          {deptActif.rubriques.map(({ nom: titre, categories }) => (
            <div key={titre} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={OVERLINE}>{titre}</span>
              {categories.map(({ nom, slug }) => (
                <button
                  key={slug}
                  onClick={() => rechercher(nom, { categorie: slug })}
                  style={{
                    textAlign: "left",
                    background: "none",
                    border: 0,
                    padding: 0,
                    cursor: "pointer",
                    font: "inherit",
                    fontSize: "13.5px",
                    color: "var(--color-neutral-800)",
                  }}
                >
                  {nom}
                </button>
              ))}

              {CONFIG.moduleConstruction && titre === "Construction" && (
                <div
                  style={{
                    marginTop: 6,
                    paddingTop: 12,
                    borderTop: "1px solid var(--border-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 700,
                      fontSize: "14.5px",
                      color: "var(--text-strong)",
                    }}
                  >
                    Projet de construction ?
                  </span>
                  <span style={{ fontSize: "12.5px", lineHeight: 1.45, color: "var(--text-muted)" }}>
                    Comparez les offres et suivez votre chantier, du devis à la remise des clés.
                  </span>
                  <button
                    onClick={() => exigerCompte(() => go("assistant", { assistStep: 1 }))}
                    className="sy-btn sy-btn--primary sy-btn--md"
                    style={{ alignSelf: "flex-start", fontSize: "13px" }}
                  >
                    Créer un projet suivi
                  </button>
                  <button
                    onClick={() => go("construction")}
                    className="sy-btn sy-btn--ghost sy-btn--md"
                    style={{ alignSelf: "flex-start", fontSize: "13px" }}
                  >
                    Voir Construction &amp; travaux
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
