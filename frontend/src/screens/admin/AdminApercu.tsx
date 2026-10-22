import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { useApp } from "../../state/app";
import type { Ecran } from "../../state/types";
import { Icon } from "../../components/Icon";
import { EspaceAdmin, GRIS, TITRE_CARTE, dateCourte, dateHeure } from "./EspaceAdmin";

/* Vue d'ensemble : ce qui attend l'équipe (candidatures, signalements, demandes restées sans
   réponse), les chiffres des 30 derniers jours, les demandes par service, la dernière activité. */

type Tuile = { libelle: string; valeur: number | undefined; icone: string; fond: string; encre: string; ecran: Ecran; patch?: Record<string, unknown> };

export function AdminApercu() {
  const { go } = useApp();
  const { donnees: a } = useApi((signal) => api.admin.apercu(signal), []);
  const { donnees: activite } = useApi((signal) => api.admin.activite(signal), []);

  const urgentes: Tuile[] = [
    { libelle: "Candidatures à vérifier", valeur: a?.a_traiter.candidatures, icone: "badge-check", fond: "var(--kola-100)", encre: "var(--kola-700)", ecran: "adminCandidatures" },
    { libelle: "Signalements ouverts", valeur: a?.a_traiter.signalements, icone: "flag", fond: "var(--state-danger-soft)", encre: "var(--state-danger)", ecran: "adminSignalements" },
    { libelle: "Demandes sans réponse depuis 2 h", valeur: a?.a_traiter.demandes_sans_reponse, icone: "clock", fond: "var(--state-warning-soft)", encre: "var(--state-warning)", ecran: "adminDemandes" },
  ];
  const chiffres: Tuile[] = [
    { libelle: "Utilisateurs", valeur: a?.chiffres.utilisateurs, icone: "users", fond: "var(--argile-100)", encre: "var(--argile-800)", ecran: "adminUtilisateurs" },
    { libelle: "Prestataires actifs", valeur: a?.chiffres.prestataires_actifs, icone: "briefcase", fond: "var(--argile-100)", encre: "var(--argile-800)", ecran: "adminPrestataires" },
    { libelle: "Demandes (30 j)", valeur: a?.chiffres.demandes_30j, icone: "file-text", fond: "var(--argile-100)", encre: "var(--argile-800)", ecran: "adminDemandes" },
    { libelle: "Commandes pressing (30 j)", valeur: a?.chiffres.commandes_pressing_30j, icone: "shirt", fond: "var(--argile-100)", encre: "var(--argile-800)", ecran: "adminDemandes" },
    { libelle: "Dépannages accomplis (30 j)", valeur: a?.chiffres.depannages_accomplis_30j, icone: "circle-check", fond: "var(--state-success-soft)", encre: "var(--state-success)", ecran: "adminDemandes" },
    { libelle: "Avis publiés (30 j)", valeur: a?.chiffres.avis_30j, icone: "star", fond: "var(--argile-100)", encre: "var(--argile-800)", ecran: "adminPrestataires" },
  ];
  const max = Math.max(1, ...(a?.demandes_par_secteur.map((s) => s.nombre) ?? []));

  const grille = (tuiles: Tuile[], r: string) => (
    <div data-r={r} style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))" }}>
      {tuiles.map((t) => (
        <button key={t.libelle} className="sy-card" onClick={() => go(t.ecran)} style={{ padding: 0, cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit" }}>
          <span style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 40, height: 40, flex: "none", borderRadius: 11, background: t.fond, color: t.encre, display: "grid", placeItems: "center" }}>
              <Icon name={t.icone} size={19} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span data-r="valeur-tuile" style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "24px", lineHeight: 1 }}>{t.valeur ?? "…"}</span>
              <span style={{ display: "block", fontSize: "13px", color: GRIS, marginTop: 4 }}>{t.libelle}</span>
            </span>
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <EspaceAdmin titre="Vue d'ensemble" sousTitre={a ? `30 derniers jours, du ${dateCourte(a.periode.depuis)} au ${dateCourte(a.periode.jusqu_au)}.` : undefined}>
      <h2 style={{ ...TITRE_CARTE, marginTop: 4 }}>À traiter</h2>
      {grille(urgentes, "admin-a-traiter")}
      <h2 style={{ ...TITRE_CARTE, marginTop: 8 }}>Chiffres</h2>
      {grille(chiffres, "admin-chiffres")}

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))" }}>
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={TITRE_CARTE}>Demandes par service</h3>
            {a?.demandes_par_secteur.map((s) => (
              <div key={s.cle} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: "14px" }}>
                  <span>{s.nom}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{s.nombre}</span>
                </span>
                <span style={{ height: 8, borderRadius: 4, background: "var(--argile-100)", overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", width: `${(s.nombre / max) * 100}%`, background: "var(--kola-500)" }} />
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
              <h3 style={TITRE_CARTE}>Dernière activité</h3>
              <button onClick={() => go("adminActivite")} className="sy-btn sy-btn--ghost sy-btn--sm">
                Tout voir
              </button>
            </div>
            {activite?.slice(0, 6).map((e) => (
              <div key={e.id} style={{ padding: "8px 0", borderTop: "1px solid var(--border-subtle)" }}>
                <span style={{ display: "block", fontSize: "14px", fontWeight: 600 }}>{e.titre}</span>
                <span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>
                  {[e.texte, dateHeure(e.date)].filter(Boolean).join(" · ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </EspaceAdmin>
  );
}
