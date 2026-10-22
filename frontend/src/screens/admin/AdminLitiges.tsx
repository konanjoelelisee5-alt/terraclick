import { useEffect, useState } from "react";
import { api, messageErreur, type DemandeAdmin, type LitigeAdmin } from "../../lib/api";
import { Icon } from "../../components/Icon";
import { EspaceAdmin, Filtres, GRIS, dateHeure } from "./EspaceAdmin";
import { Personne, Section, Stats, Statut, Tableau, chiffre } from "./Gabarit";
import { DetailDemande } from "./AdminDemandes";

/* Litiges : toutes les demandes où le client ou le prestataire a déclaré un problème (retard,
   travail mal fait, prestation non terminée, paiement non effectué…). Le détail réunit les deux
   déclarations et leurs preuves, les contacts des deux parties, l'historique et la décision
   finale (remboursement, nouvelle intervention, avertissement, suspension, blocage). */

const MOTIFS = [
  { cle: "", nom: "Tous les motifs" },
  { cle: "retard", nom: "Retard" },
  { cle: "travail", nom: "Mauvais travail" },
  { cle: "non_termine", nom: "Non terminée" },
  { cle: "paiement", nom: "Paiement non effectué" },
  { cle: "absent", nom: "Prestataire absent" },
  { cle: "prix", nom: "Prix" },
  { cle: "autre", nom: "Autre" },
];

export function AdminLitiges() {
  const [etat, setEtat] = useState<"ouverts" | "traites" | "tous">("ouverts");
  const [motif, setMotif] = useState("");
  const [liste, setListe] = useState<LitigeAdmin[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouverte, setOuverte] = useState<DemandeAdmin | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const arret = new AbortController();
    setListe(null);
    api.admin.litiges({ etat, motif: motif || undefined }, arret.signal).then(setListe, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e)));
    return () => arret.abort();
  }, [etat, motif, version]);

  const ouvrir = async (id: number) => {
    try {
      setOuverte(await api.admin.demande(id));
    } catch (e) {
      setErreur(messageErreur(e));
    }
  };

  if (ouverte)
    return (
      <DetailDemande
        d={ouverte}
        retour="Tous les litiges"
        onMaj={setOuverte}
        onRetour={() => {
          setOuverte(null);
          setVersion((v) => v + 1);
        }}
      />
    );

  return (
    <EspaceAdmin titre="Litiges" sousTitre="Problèmes déclarés par les clients et par les prestataires, du plus récent au plus ancien.">
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}
      <Stats
        items={[
          { libelle: "Dans la liste", valeur: chiffre(liste?.length ?? 0), icone: "scale" },
          { libelle: "À trancher", valeur: chiffre((liste ?? []).filter((l) => l.ouverts).length), icone: "clock", badge: (liste ?? []).some((l) => l.ouverts) ? { texte: "Ouverts", ton: "warning" } : undefined },
          { libelle: "Avec preuves", valeur: chiffre((liste ?? []).filter((l) => l.preuves).length), icone: "camera" },
          { libelle: "Récidives", valeur: chiffre((liste ?? []).filter((l) => l.recidive).length), icone: "alert-triangle", badge: (liste ?? []).some((l) => l.recidive) ? { texte: "À surveiller", ton: "danger" } : undefined },
        ]}
      />
      <Section
        titre={etat === "ouverts" ? "Litiges à trancher" : etat === "traites" ? "Litiges tranchés" : "Tous les litiges"}
        actions={
          <Filtres
            options={[
              { cle: "ouverts" as const, nom: "À trancher" },
              { cle: "traites" as const, nom: "Tranchés" },
              { cle: "tous" as const, nom: "Tous" },
            ]}
            valeur={etat}
            onChange={setEtat}
          />
        }
      >
        <div style={{ marginBottom: 10 }}>
          <Filtres options={MOTIFS} valeur={motif} onChange={setMotif} />
        </div>
        <Tableau
          lignes={liste ?? []}
          cle={(l) => l.id}
          ligneR="litige-admin"
          onLigne={(l) => ouvrir(l.id)}
          vide={liste ? (etat === "ouverts" ? "Aucun litige à trancher." : "Aucun litige ici.") : undefined}
          min={820}
          colonnes={[
            {
              titre: "Motifs",
              rendu: (l) => (
                <span style={{ display: "block", maxWidth: 300 }}>
                  {l.motifs.map((m) => (
                    <span key={m.libelle} style={{ display: "block" }}>
                      <strong style={{ fontWeight: 600 }}>{m.libelle}</strong>
                      <span style={{ fontSize: "12.5px", color: GRIS }}> · {m.role === "client" ? "client" : "prestataire"}</span>
                    </span>
                  ))}
                  {l.decision && <span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>Décision : {l.decision}</span>}
                </span>
              ),
            },
            { titre: "Demande", rendu: (l) => <span>{l.reference}<span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>{l.secteur}</span></span> },
            { titre: "Client", rendu: (l) => <Personne nom={l.client ?? "Client"} /> },
            { titre: "Prestataire", rendu: (l) => (l.prestataire ? <Personne nom={l.prestataire} detail={l.recidive ? <span style={{ color: "var(--state-danger)", fontWeight: 600 }}>Récidive</span> : undefined} /> : "—") },
            { titre: "Preuves", rendu: (l) => (l.preuves ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="camera" size={14} />{l.preuves}</span> : "—") },
            { titre: "Depuis", rendu: (l) => <span style={{ whiteSpace: "nowrap", color: GRIS }}>{l.depuis ? dateHeure(l.depuis) : ""}</span> },
            { titre: "État", droite: true, rendu: (l) => (l.ouverts ? <Statut ton="warning">À trancher</Statut> : <Statut ton="success">Tranché</Statut>) },
          ]}
        />
      </Section>
    </EspaceAdmin>
  );
}
