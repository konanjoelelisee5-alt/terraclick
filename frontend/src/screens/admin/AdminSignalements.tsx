import { useEffect, useState } from "react";
import { api, messageErreur, type SignalementAdmin } from "../../lib/api";
import { peut } from "../../lib/acces";
import { useApp } from "../../state/app";
import { Dialogue } from "../../components/Dialogue";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspaceAdmin, Filtres, GRIS, dateHeure } from "./EspaceAdmin";
import { Nouveau, Personne, Section, Stats, Statut, Tableau, chiffre } from "./Gabarit";

/* Signalements des clients (retard, vêtement manquant, technicien pas venu…) : l'équipe joint
   le client et le prestataire, puis marque le signalement traité en notant ce qui a été fait. */

export function AdminSignalements() {
  const toast = useToast();
  const [statut, setStatut] = useState<SignalementAdmin["statut"]>("ouvert");
  const [liste, setListe] = useState<SignalementAdmin[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [traite, setTraite] = useState<SignalementAdmin | null>(null);
  const [reponse, setReponse] = useState("");
  const { etat } = useApp();
  const peutTraiter = peut(etat.auth, "signalements.traiter");
  const [comptes, setComptes] = useState({ ouvert: 0, traite: 0 });

  // Les deux comptes, pour les indicateurs, quel que soit l'onglet.
  useEffect(() => {
    const arret = new AbortController();
    Promise.all([api.admin.signalements("ouvert", arret.signal), api.admin.signalements("traite", arret.signal)]).then(
      ([o, t]) => setComptes({ ouvert: o.length, traite: t.length }),
      () => {},
    );
    return () => arret.abort();
  }, [liste]);

  useEffect(() => {
    const arret = new AbortController();
    setListe(null);
    api.admin.signalements(statut, arret.signal).then(setListe, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e)));
    return () => arret.abort();
  }, [statut]);

  const tel = (n: string) => `tel:+225${n.replace(/\D/g, "")}`;

  return (
    <EspaceAdmin titre="Signalements" sousTitre="Ce que les clients ont signalé sur une demande ou une commande.">
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}
      <Stats
        items={[
          { libelle: "À traiter", valeur: chiffre(comptes.ouvert), icone: "flag", badge: comptes.ouvert ? { texte: "En attente", ton: "warning" } : undefined },
          { libelle: "Traités", valeur: chiffre(comptes.traite), icone: "circle-check" },
          { libelle: "Avec un message", valeur: chiffre((liste ?? []).filter((x) => x.message).length), icone: "message-square", detail: "Dans la liste affichée" },
        ]}
      />
      <Section
        titre={statut === "ouvert" ? "Signalements à traiter" : "Signalements traités"}
        badge={<Nouveau n={statut === "ouvert" ? comptes.ouvert : 0} texte="à traiter" />}
        actions={<Filtres options={[{ cle: "ouvert" as const, nom: "À traiter" }, { cle: "traite" as const, nom: "Traités" }]} valeur={statut} onChange={setStatut} />}
      >
        <Tableau
          lignes={liste ?? []}
          cle={(x) => x.id}
          ligneR="signalement-admin"
          vide={liste ? (statut === "ouvert" ? "Aucun signalement à traiter." : "Aucun signalement traité.") : undefined}
          min={820}
          colonnes={[
            {
              titre: "Motif",
              rendu: (x) => (
                <span style={{ display: "block", maxWidth: 280 }}>
                  <strong style={{ fontWeight: 600 }}>{x.motif_libelle}</strong>
                  {x.message && <span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>« {x.message} »</span>}
                  {x.reponse && <span style={{ display: "block", fontSize: "12.5px" }}>Réponse : {x.reponse}</span>}
                </span>
              ),
            },
            { titre: "Demande", rendu: (x) => (x.demande ? <span>{x.demande.reference}<span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>{x.demande.secteur} · {x.demande.statut_libelle}</span></span> : "—") },
            { titre: "Client", rendu: (x) => <Personne nom={x.client.nom ?? "Client"} detail={x.client.telephone} /> },
            { titre: "Prestataire", rendu: (x) => (x.prestataire ? <Personne nom={x.prestataire.nom} detail={x.prestataire.telephone} /> : "—") },
            { titre: "Date", rendu: (x) => <span style={{ whiteSpace: "nowrap", color: GRIS }}>{dateHeure(x.date)}</span> },
            {
              titre: "Actions",
              droite: true,
              rendu: (x) =>
                x.statut === "ouvert" ? (
                  <span style={{ display: "inline-flex", gap: 6 }}>
                    {x.client.telephone && (
                      <a href={tel(x.client.telephone)} className="sy-iconbtn sy-iconbtn--sm sy-iconbtn--outline" aria-label={`Appeler le client ${x.client.nom ?? ""}`}>
                        <Icon name="phone" size={15} />
                      </a>
                    )}
                    {peutTraiter && (
                      <button data-r="traiter-signalement" onClick={() => setTraite(x)} className="sy-btn sy-btn--primary sy-btn--sm">
                        Marquer traité
                      </button>
                    )}
                  </span>
                ) : (
                  <Statut ton="success">Traité</Statut>
                ),
            },
          ]}
        />
      </Section>
      {traite && (
        <Dialogue
          titre="Marquer le signalement traité"
          description={`${traite.motif_libelle}${traite.demande ? ` · ${traite.demande.reference}` : ""}. Notez ce qui a été fait.`}
          icone="circle-check"
          fond="var(--state-success-soft)"
          encre="var(--state-success)"
          confirmer="Enregistrer"
          onFermer={() => setTraite(null)}
          onConfirmer={async () => {
            try {
              await api.admin.traiterSignalement(traite.id, reponse.trim());
              setListe((l) => l?.filter((x) => x.id !== traite.id) ?? null);
              setTraite(null);
              setReponse("");
              toast("Signalement traité", "Il passe dans « Traités ».");
            } catch (e) {
              toast("Action impossible", messageErreur(e), "danger");
            }
          }}
        >
          <textarea className="sy-textarea" aria-label="Ce qui a été fait" value={reponse} onChange={(e) => setReponse(e.target.value)} placeholder="Ex. technicien rappelé, il repasse demain sans frais." style={{ borderRadius: 14 }} />
        </Dialogue>
      )}
    </EspaceAdmin>
  );
}
