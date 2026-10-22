import { useEffect, useState } from "react";
import { api, messageErreur, type DemandeAdmin, type LitigeAdmin } from "../../lib/api";
import { Icon } from "../../components/Icon";
import { EspaceAdmin, Filtres, GRIS, Vide, dateHeure } from "./EspaceAdmin";
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
      <Filtres
        options={[
          { cle: "ouverts" as const, nom: "À trancher" },
          { cle: "traites" as const, nom: "Tranchés" },
          { cle: "tous" as const, nom: "Tous" },
        ]}
        valeur={etat}
        onChange={setEtat}
      />
      <Filtres options={MOTIFS} valeur={motif} onChange={setMotif} />
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}
      {liste?.length === 0 && <Vide texte={etat === "ouverts" ? "Aucun litige à trancher." : "Aucun litige ici."} />}
      {liste && liste.length > 0 && (
        <div className="sy-card" style={{ overflow: "hidden" }}>
          {liste.map((l, i) => (
            <button
              key={l.id}
              data-r="litige-admin"
              onClick={() => ouvrir(l.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: 0, borderTop: i ? "1px solid var(--border-subtle)" : 0, background: "none", font: "inherit", color: "inherit", textAlign: "left", cursor: "pointer" }}
            >
              <span style={{ width: 38, height: 38, flex: "none", borderRadius: 999, background: l.ouverts ? "var(--state-danger-soft)" : "var(--argile-100)", color: l.ouverts ? "var(--state-danger)" : GRIS, display: "grid", placeItems: "center" }}>
                <Icon name="scale" size={18} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 700, fontSize: "14.5px" }}>
                  {l.motifs.map((m) => `${m.libelle} (${m.role === "client" ? "client" : "prestataire"})`).join(" · ")}
                </span>
                <span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>
                  {[l.reference, l.secteur, `${l.client ?? "Client"} / ${l.prestataire ?? "—"}`, l.depuis ? dateHeure(l.depuis) : null, l.preuves ? `${l.preuves} photo${l.preuves > 1 ? "s" : ""}` : null].filter(Boolean).join(" · ")}
                </span>
                {l.decision && <span style={{ display: "block", fontSize: "12.5px", marginTop: 2 }}>Décision : {l.decision}</span>}
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flex: "none" }}>
                <span className={`sy-badge sy-badge--${l.ouverts ? "warning" : "neutral"}`}>{l.ouverts ? "À trancher" : "Tranché"}</span>
                {l.recidive && <span className="sy-badge sy-badge--danger">Récidive</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </EspaceAdmin>
  );
}
