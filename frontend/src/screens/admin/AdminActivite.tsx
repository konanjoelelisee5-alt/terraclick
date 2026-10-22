import { useState } from "react";
import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { Icon } from "../../components/Icon";
import { EspaceAdmin, Filtres, GRIS, dateHeure } from "./EspaceAdmin";
import { Section, Stats, Tableau, chiffre } from "./Gabarit";

/* Journal d'activité : les étapes des demandes (qui a fait quoi), les candidatures traitées
   et les signalements, du plus récent au plus ancien — compté par type, filtrable. */

const ICONES = { demande: "file-text", candidature: "badge-check", signalement: "flag" } as const;
const NOMS = { demande: "Demandes", candidature: "Candidatures", signalement: "Signalements" } as const;

export function AdminActivite() {
  const { donnees: activite, erreur } = useApi((signal) => api.admin.activite(signal), []);
  const [type, setType] = useState<"" | keyof typeof ICONES>("");
  const liste = (activite ?? []).filter((e) => !type || e.type === type);
  const compte = (t: keyof typeof ICONES) => (activite ?? []).filter((e) => e.type === t).length;

  return (
    <EspaceAdmin titre="Journal d'activité" sousTitre="Les 80 derniers événements de la plateforme.">
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>Le journal n'a pas pu être chargé.</p>}
      <Stats
        items={[
          { libelle: "Événements", valeur: chiffre(activite?.length ?? 0), icone: "history" },
          ...(Object.keys(ICONES) as (keyof typeof ICONES)[]).map((t) => ({ libelle: NOMS[t], valeur: chiffre(compte(t)), icone: ICONES[t] })),
        ]}
      />
      <Section
        titre="Derniers événements"
        actions={
          <Filtres
            options={[{ cle: "" as const, nom: "Tous" }, ...(Object.keys(ICONES) as (keyof typeof ICONES)[]).map((t) => ({ cle: t, nom: NOMS[t] }))]}
            valeur={type}
            onChange={setType}
          />
        }
      >
        <Tableau
          lignes={liste}
          cle={(e) => e.id}
          ligneR="evenement-admin"
          vide="Aucune activité pour l'instant."
          min={560}
          colonnes={[
            {
              titre: "Événement",
              rendu: (e) => (
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 32, height: 32, flex: "none", borderRadius: 999, background: e.type === "signalement" ? "var(--state-danger-soft)" : "var(--argile-100)", color: e.type === "signalement" ? "var(--state-danger)" : "var(--argile-800)", display: "grid", placeItems: "center" }}>
                    <Icon name={ICONES[e.type]} size={15} />
                  </span>
                  <strong style={{ fontWeight: 600 }}>{e.titre}</strong>
                </span>
              ),
            },
            { titre: "Détail", rendu: (e) => <span style={{ color: GRIS }}>{e.texte}</span> },
            { titre: "Date", droite: true, rendu: (e) => <span style={{ whiteSpace: "nowrap", color: GRIS }}>{dateHeure(e.date)}</span> },
          ]}
        />
      </Section>
    </EspaceAdmin>
  );
}
