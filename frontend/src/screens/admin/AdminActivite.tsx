import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { Icon } from "../../components/Icon";
import { EspaceAdmin, GRIS, Vide, dateHeure } from "./EspaceAdmin";

/* Journal d'activité : les étapes des demandes (qui a fait quoi), les candidatures traitées
   et les signalements, du plus récent au plus ancien. */

const ICONES = { demande: "file-text", candidature: "badge-check", signalement: "flag" } as const;

export function AdminActivite() {
  const { donnees: activite, erreur } = useApi((signal) => api.admin.activite(signal), []);

  return (
    <EspaceAdmin titre="Journal d'activité" sousTitre="Les 80 derniers événements de la plateforme.">
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>Le journal n'a pas pu être chargé.</p>}
      {activite?.length === 0 && <Vide texte="Aucune activité pour l'instant." />}
      {activite && activite.length > 0 && (
        <div className="sy-card" style={{ overflow: "hidden" }}>
          {activite.map((e, i) => (
            <div key={e.id} data-r="evenement-admin" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderTop: i ? "1px solid var(--border-subtle)" : 0 }}>
              <span style={{ width: 34, height: 34, flex: "none", borderRadius: 10, background: e.type === "signalement" ? "var(--state-danger-soft)" : "var(--argile-100)", color: e.type === "signalement" ? "var(--state-danger)" : "var(--argile-800)", display: "grid", placeItems: "center" }}>
                <Icon name={ICONES[e.type]} size={16} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: "14px" }}>{e.titre}</span>
                {e.texte && <span style={{ display: "block", fontSize: "13px", color: GRIS }}>{e.texte}</span>}
              </span>
              <span style={{ flex: "none", fontSize: "12.5px", color: GRIS }}>{dateHeure(e.date)}</span>
            </div>
          ))}
        </div>
      )}
    </EspaceAdmin>
  );
}
