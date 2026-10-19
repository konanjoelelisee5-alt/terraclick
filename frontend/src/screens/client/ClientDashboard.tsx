import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { MONO, TITRE_CARTE, badge } from "../pro/EspacePro";
import { useEstMobile } from "../../lib/useEstMobile";
import { ProfilMobile } from "./ProfilMobile";
import { EspaceClient } from "./EspaceClient";
import { useEtatClient } from "./store";

const LIGNE: React.CSSProperties = {
  border: "1px solid var(--border-subtle)",
  background: "var(--surface-card)",
  borderRadius: 12,
  padding: "12px 14px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 12,
  textAlign: "left",
  flexWrap: "wrap",
  font: "inherit",
  color: "inherit",
};

/** Ce qui attend une action du client, déduit de l'état de ses demandes. */
const ACTIONS: Record<string, { icone: string; titre: string; bouton: string; fond: string; encre: string }> = {
  "Marquée terminée": {
    icone: "clipboard-check",
    titre: "Confirmer une fin de prestation",
    bouton: "Confirmer",
    fond: "var(--state-warning-soft)",
    encre: "var(--state-warning)",
  },
  "Réponse reçue": {
    icone: "reply",
    titre: "Répondre à une estimation",
    bouton: "Voir la réponse",
    fond: "var(--kola-100)",
    encre: "var(--kola-700)",
  },
  Terminée: { icone: "star", titre: "Laisser un avis", bouton: "Noter", fond: "var(--argile-100)", encre: "var(--argile-700)" },
};

export function ClientDashboard() {
  const { etat, go } = useApp();
  const { demandes } = useEtatClient();
  const prenom = etat.auth?.prenom.split(" ")[0] ?? "";
  const aFaire = demandes.filter((d) => ACTIONS[d.statut]);

  // Sur téléphone : l'écran Profil (grand titre, carte d'identité, menu), sans onglets.
  const estMobile = useEstMobile();
  if (estMobile) return <ProfilMobile />;

  const RACCOURCIS = [
    { icone: "search", libelle: "Rechercher un prestataire", action: () => go("home") },
    { icone: "file-text", libelle: "Demander un devis", action: () => go("clientDevis") },
    { icone: "inbox", libelle: "Mes demandes", action: () => go("clientDemandes") },
    { icone: "user", libelle: "Mon profil", action: () => go("clientProfil") },
  ];

  return (
    <EspaceClient titre={`Bonjour, ${prenom}`} sousTitre="Voici ce qui attend une action de votre part.">
      <div className="sy-card">
        <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={TITRE_CARTE}>Actions à faire</h2>
          {aFaire.length === 0 && (
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>Rien à faire pour le moment.</p>
          )}
          {aFaire.map((d) => {
            const a = ACTIONS[d.statut];
            const cible = d.statut === "Terminée" ? "avis" : "clientSuivi";
            return (
              <button key={d.ref} type="button" onClick={() => go(cible)} style={LIGNE}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    flex: "none",
                    borderRadius: 10,
                    background: a.fond,
                    color: a.encre,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Icon name={a.icone} size={18} />
                </span>
                <span style={{ minWidth: 160, flex: 1 }}>
                  <span style={{ display: "block", fontSize: "15px", fontWeight: 700 }}>{a.titre}</span>
                  <span style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginTop: 2 }}>
                    {d.prestataire} · {d.estimation !== "—" ? d.estimation : d.date}
                  </span>
                </span>
                <span style={{ ...MONO, fontSize: "12px", color: "var(--kola-700)", flex: "none" }}>{d.ref}</span>
                <span className="sy-btn sy-btn--outline sy-btn--sm" style={{ flex: "none" }}>
                  {a.bouton}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))" }}>
        {RACCOURCIS.map((r) => (
          <button
            key={r.libelle}
            type="button"
            onClick={r.action}
            className="sy-card sy-card--interactive"
            style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, textAlign: "left", font: "inherit", color: "inherit" }}
          >
            <Icon name={r.icone} size={22} color="var(--kola-600)" />
            <span style={{ fontSize: "15px", fontWeight: 700 }}>{r.libelle}</span>
          </button>
        ))}
      </div>

      <div className="sy-card">
        <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <h2 style={TITRE_CARTE}>Demandes récentes</h2>
            <button type="button" className="sy-btn sy-btn--ghost sy-btn--sm" onClick={() => go("clientDemandes")}>
              Tout voir
            </button>
          </div>
          {demandes.slice(0, 4).map((d) => (
            <button key={d.ref} type="button" onClick={() => go("clientSuivi")} style={LIGNE}>
              <span style={{ minWidth: 160, flex: 1 }}>
                <span style={{ display: "block", fontSize: "14px", fontWeight: 700 }}>{d.prestataire}</span>
                <span style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginTop: 2 }}>
                  {d.portee} · {d.date}
                </span>
              </span>
              <span style={{ ...MONO, fontSize: "12px", color: "var(--kola-700)", flex: "none" }}>{d.ref}</span>
              <span className={badge(d.ton)} style={{ flex: "none" }}>
                {d.statut}
              </span>
            </button>
          ))}
        </div>
      </div>
    </EspaceClient>
  );
}
