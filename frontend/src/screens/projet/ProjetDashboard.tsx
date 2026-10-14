import { ONGLETS_PROJET } from "../../data/chantier";
import { useApp } from "../../state/app";
import { OngletVue } from "./onglets/Vue";
import { OngletPropositions } from "./onglets/Propositions";
import { OngletSuiviChantier } from "./onglets/SuiviChantier";
import { OngletPreReception } from "./onglets/PreReception";
import {
  OngletDocuments,
  OngletEntretien,
  OngletEquipements,
  OngletMateriaux,
  OngletMessages,
  OngletPaiements,
  OngletSav,
} from "./onglets/Divers";

/** Page projet : onze onglets balayables, du suivi de chantier au SAV. */
export function ProjetDashboard() {
  const { etat, set, exigerCompte, go } = useApp();
  const o = etat.onglet;

  const contenu = [
    <OngletVue key="vue" />,
    <OngletPropositions key="prop" />,
    <OngletSuiviChantier key="suivi" />,
    <OngletPreReception key="recep" />,
    <OngletPaiements key="paie" />,
    <OngletMateriaux key="mat" />,
    <OngletEquipements key="equip" />,
    <OngletMessages key="msg" />,
    <OngletDocuments key="doc" />,
    <OngletSav key="sav" />,
    <OngletEntretien key="entr" />,
  ][o];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "30px 20px 70px" }}>
      <button
        onClick={() => exigerCompte(() => go("mesProjets"))}
        className="sy-btn sy-btn--ghost sy-btn--md"
        style={{ marginBottom: 14 }}
      >
        ← Mes projets
      </button>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", margin: "0 0 6px", color: "var(--text-muted)" }}>
        {etat.sujet.ref}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
        <h1 style={{ fontSize: "clamp(26px,4.5vw,34px)", margin: 0 }}>{etat.sujet.titre}</h1>
        <span className="sy-badge sy-badge--success" style={{ marginLeft: "auto" }}>
          {etat.mode === "guide" ? "Mode guidé" : "Clé en main"}
        </span>
      </div>

      <div
        data-r="steprail"
        style={{
          display: "flex",
          gap: 22,
          overflowX: "auto",
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: 22,
        }}
      >
        {ONGLETS_PROJET.map((nom, i) => {
          const actif = i === o;
          return (
            <button
              key={nom}
              onClick={() => set({ onglet: i })}
              aria-current={actif ? "true" : undefined}
              style={{
                cursor: "pointer",
                font: "inherit",
                fontSize: "14px",
                padding: "10px 4px",
                background: "none",
                border: 0,
                borderBottom: "2px solid",
                whiteSpace: "nowrap",
                minHeight: 44,
                borderColor: actif ? "var(--color-accent)" : "transparent",
                color: actif ? "var(--kola-600)" : "var(--text-muted)",
                fontWeight: actif ? 700 : 400,
              }}
            >
              {nom}
            </button>
          );
        })}
      </div>

      {contenu}
    </main>
  );
}
