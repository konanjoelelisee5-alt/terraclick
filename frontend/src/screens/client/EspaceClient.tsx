import type { ReactNode } from "react";
import { useNotifications } from "../../lib/pressing";
import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import type { Ecran } from "../../state/types";
import { useDemandesClient } from "./store";

/* Espace client, intégré au site public (en-tête et pied de page conservés) :
   une rangée d'onglets commune à ses écrans, page « Mon compte » comprise. */

const ONGLETS: { ecran: Ecran; libelle: string }[] = [
  { ecran: "clientDashboard", libelle: "Tableau de bord" },
  { ecran: "clientDemandes", libelle: "Mes demandes" },
  { ecran: "clientNotifications", libelle: "Notifications" },
  { ecran: "clientProfil", libelle: "Mon profil" },
  { ecran: "compte", libelle: "Mon compte" },
];

/** Écrans de détail rattachés à un onglet. */
const RATTACHEMENT: Partial<Record<Ecran, Ecran>> = { clientSuivi: "clientDemandes", clientDevis: "clientDemandes" };

export function OngletsClient() {
  const { etat, go } = useApp();
  const { demandes } = useDemandesClient(etat.auth?.tel ?? null);
  const { nonLues } = useNotifications(!!etat.auth);
  const courant = RATTACHEMENT[etat.screen] ?? etat.screen;
  const comptes: Partial<Record<Ecran, number>> = {
    clientDemandes: demandes.filter((d) => ["Rendez-vous", "Réponses reçues"].includes(d.groupe)).length,
    clientNotifications: nonLues,
  };

  // Ordinateur : les onglets. Téléphone (app.css) : à leur place, un retour vers l'écran Compte,
  // qui regroupe leur contenu en sections et en menu.
  return (
    <>
      <nav aria-label="Espace client" data-r="steprail" className="sy-tabs" style={{ overflowX: "auto", gap: 24 }}>
        {ONGLETS.map((o) => (
          <button
            key={o.ecran}
            type="button"
            onClick={() => go(o.ecran)}
            aria-current={courant === o.ecran ? "page" : undefined}
            className={`sy-tab${courant === o.ecran ? " sy-tab--active" : ""}`}
            style={{ flex: "none", whiteSpace: "nowrap", minHeight: 44 }}
          >
            {o.libelle}
            {comptes[o.ecran] ? <span className="sy-tab__count">{comptes[o.ecran]}</span> : null}
          </button>
        ))}
      </nav>
      {etat.screen !== "clientDashboard" && (
        <button
          data-r="retour-compte"
          type="button"
          onClick={() => go("clientDashboard")}
          style={{ display: "none", alignItems: "center", gap: 4, alignSelf: "flex-start", minHeight: 44, padding: 0, background: "none", border: 0, cursor: "pointer", font: "inherit", fontSize: "15px", fontWeight: 600, color: "var(--color-accent-700)" }}
        >
          <Icon name="chevron-left" size={18} />
          Profil
        </button>
      )}
    </>
  );
}

export function EspaceClient({ titre, sousTitre, actions, children }: {
  titre: string;
  sousTitre?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { etat, exigerCompte, go } = useApp();

  // Après une déconnexion sur place, l'espace n'a plus de titulaire.
  if (!etat.auth) {
    return (
      <main data-r="container" style={{ paddingTop: 40, paddingBottom: 70 }}>
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
            <h1 style={{ margin: 0, fontSize: "24px" }}>Espace client</h1>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>Connectez-vous pour suivre vos demandes.</p>
            <button
              type="button"
              className="sy-btn sy-btn--primary sy-btn--md"
              onClick={() => exigerCompte(() => go(etat.screen))}
            >
              Se connecter
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main data-r="container" style={{ paddingTop: 26, paddingBottom: 70, display: "flex", flexDirection: "column", gap: 18 }}>
      <OngletsClient />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: "clamp(24px,3.6vw,30px)" }}>{titre}</h1>
          {sousTitre && <p style={{ margin: 0, fontSize: "15px", color: "var(--argile-700)" }}>{sousTitre}</p>}
        </div>
        {actions}
      </div>
      {children}
    </main>
  );
}
