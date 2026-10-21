import { useEffect, useState } from "react";
import { useApp } from "../../state/app";
import { MOTIFS_SIGNALEMENT } from "../../data/client";
import { MOYENS_PAIEMENT_DIRECT } from "../../data/pro";
import { api, messageErreur, type DemandeApi } from "../../lib/api";
import { Dialogue } from "../../components/Dialogue";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { MONO, Note, OVERLINE, TITRE_CARTE, badge } from "../pro/EspacePro";
import { EspaceClient } from "./EspaceClient";
import { chargerDemandes, francs, modifierClient, useEtatClient, versDemandeClient } from "./store";

const CASE: React.CSSProperties = { background: "var(--argile-50)", borderRadius: 12, padding: "12px 14px" };

/** Étapes attendues d'une intervention ; celles déjà franchies viennent du journal de la demande. */
const ETAPES: { statut: DemandeApi["statut"]; libelle: string }[] = [
  { statut: "envoyee", libelle: "Demande envoyée" },
  { statut: "acceptee", libelle: "Acceptée par le technicien" },
  { statut: "en_cours", libelle: "Intervention en cours" },
  { statut: "terminee", libelle: "Marquée terminée par le technicien" },
  { statut: "confirmee", libelle: "Fin confirmée par vous" },
];

const dateCourte = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/** Suivi d'une demande : étapes, réponse du technicien, et l'action attendue du client. */
export function ClientSuivi() {
  const { etat, go } = useApp();
  const toast = useToast();
  const { suivie } = useEtatClient();
  const [d, setD] = useState<DemandeApi | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fenetre, setFenetre] = useState<"confirmer" | "annuler" | "signaler" | "paiement" | null>(null);
  const [motif, setMotif] = useState(MOTIFS_SIGNALEMENT[0]);
  const [motifAnnulation, setMotifAnnulation] = useState("");
  const [moyen, setMoyen] = useState(MOYENS_PAIEMENT_DIRECT[1]);

  useEffect(() => {
    if (!suivie) return;
    const arret = new AbortController();
    setErreur(null);
    api.demande(suivie, arret.signal).then(setD, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e)));
    return () => arret.abort();
  }, [suivie]);

  if (!suivie) {
    return (
      <EspaceClient titre="Suivi de la demande">
        <p style={{ margin: 0 }}>Choisissez une demande dans « Mes demandes ».</p>
        <button type="button" className="sy-btn sy-btn--primary sy-btn--md" style={{ alignSelf: "flex-start" }} onClick={() => go("clientDemandes")}>
          Mes demandes
        </button>
      </EspaceClient>
    );
  }
  if (!d) {
    return (
      <EspaceClient titre="Suivi de la demande">
        <p role={erreur ? "alert" : "status"} style={{ margin: 0, color: erreur ? "var(--state-danger)" : "var(--text-muted)" }}>
          {erreur ?? "Chargement…"}
        </p>
      </EspaceClient>
    );
  }

  const vue = versDemandeClient(d);
  const nom = d.prestataire?.nom ?? "Le technicien";
  const evenements = d.evenements?.length ? d.evenements : [{ statut: "envoyee" as const, libelle: "Envoyée", auteur: "client" as const, message: null, date: d.cree_le }];
  const parStatut = new Map(evenements.map((e) => [e.statut, e]));
  const reponse = parStatut.get("acceptee");
  const refus = parStatut.get("refusee");
  const annulation = parStatut.get("annulee");
  const arretee = d.statut === "refusee" || d.statut === "annulee";
  const etapes = arretee ? ETAPES.filter((e) => parStatut.has(e.statut)) : ETAPES;

  /** Applique une action, met à jour l'écran et la liste. */
  const agir = async (action: () => Promise<DemandeApi>, titre: string, texte: string) => {
    try {
      const nouvelle = await action();
      setD(nouvelle);
      modifierClient((e) => ({ demandes: e.demandes.map((x) => (x.id === nouvelle.id ? versDemandeClient(nouvelle) : x)) }));
      setFenetre(null);
      toast(titre, texte);
    } catch (e) {
      setFenetre(null);
      toast("Action impossible", messageErreur(e), "danger");
      if (etat.auth) chargerDemandes(etat.auth.tel);
    }
  };

  return (
    <EspaceClient titre={`${d.probleme} · ${d.secteur.nom}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ ...MONO, fontSize: "14px", fontWeight: 700 }}>{d.reference}</span>
        <span data-r="statut-suivi" className={badge(vue.ton)}>
          {d.statut_libelle}
        </span>
      </div>

      <div data-r="pro-split">
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          {d.statut === "terminee" && (
            <div className="sy-card" style={{ borderColor: "var(--kola-200)", background: "var(--kola-50)" }}>
              <div style={{ padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Icon name="bell" size={22} color="var(--kola-600)" style={{ marginTop: 1 }} />
                <div>
                  <strong style={{ fontSize: "15px" }}>{nom} a marqué la prestation terminée</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "14px", lineHeight: 1.6, color: "var(--argile-700)" }}>
                    Confirmez la fin de prestation si le travail est bien terminé, sinon signalez un problème.
                  </p>
                </div>
              </div>
            </div>
          )}
          {refus && (
            <div role="status" className="sy-card" style={{ borderColor: "var(--state-danger)" }}>
              <div className="sy-card__body">
                <strong>{nom} n'a pas pu accepter votre demande.</strong>
                {refus.message && <p style={{ margin: "6px 0 0", color: "var(--argile-700)" }}>« {refus.message} »</p>}
              </div>
            </div>
          )}

          <div className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h2 style={{ ...TITRE_CARTE, marginBottom: 10 }}>Suivi de la demande</h2>
              <ol data-r="etapes-suivi" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {[...etapes, ...(refus ? [{ statut: "refusee" as const, libelle: "Refusée par le technicien" }] : []), ...(annulation ? [{ statut: "annulee" as const, libelle: "Annulée par vous" }] : [])].map((e, i, toutes) => {
                  const fait = parStatut.get(e.statut);
                  return (
                    <li key={e.statut} style={{ display: "flex", gap: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none", width: 16 }}>
                        <span style={{ width: 10, height: 10, marginTop: 4, borderRadius: "50%", background: fait ? "var(--secondary)" : "var(--argile-300)" }} />
                        {i < toutes.length - 1 && <span style={{ flex: 1, width: 2, background: "var(--border-subtle)", margin: "4px 0" }} />}
                      </div>
                      <div style={{ paddingBottom: 14 }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: fait ? "inherit" : "var(--text-muted)" }}>{e.libelle}</div>
                        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: 2 }}>{fait ? dateCourte(fait.date) : "À venir"}</div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {reponse && (
            <div className="sy-card" style={{ borderColor: "var(--lagune-200)" }}>
              <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h2 style={TITRE_CARTE}>Réponse de {nom}</h2>
                {reponse.message && <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--argile-700)" }}>« {reponse.message} »</p>}
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))" }}>
                  <div style={CASE}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Estimation</div>
                    <div style={{ ...MONO, fontSize: "17px", fontWeight: 700, marginTop: 2 }}>{francs(d.estimation)}</div>
                  </div>
                  <div style={CASE}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Créneau proposé</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, marginTop: 4 }}>{d.creneau ?? "À convenir"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "14px" }}>
              <h2 style={{ ...TITRE_CARTE, marginBottom: 4 }}>Votre demande</h2>
              <span>{d.resume}</span>
              {d.pack && (
                <div data-r="suivi-pack" style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                  {d.pack.articles.map((a) => (
                    <span key={a.cle} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span>
                        {a.quantite} × {a.nom}
                      </span>
                      <span style={{ ...MONO, whiteSpace: "nowrap" }}>{francs(a.total)}</span>
                    </span>
                  ))}
                  <strong style={{ display: "flex", justifyContent: "space-between", gap: 10, borderTop: "1px solid var(--border-subtle)", paddingTop: 6 }}>
                    <span>{d.pack.pieces} pièces · total estimé</span>
                    <span>{d.pack.total_affichage}</span>
                  </strong>
                </div>
              )}
              {d.repere && <span style={{ color: "var(--text-muted)" }}>Repère : {d.repere}</span>}
              {d.precision && <span style={{ color: "var(--text-muted)" }}>« {d.precision} »</span>}
            </div>
          </div>

          <Note>
            Le paiement de la prestation est convenu directement entre vous et le prestataire. TerraClick ne conserve
            pas les fonds liés à cette prestation.
          </Note>
        </div>

        <aside>
          <div className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={OVERLINE}>Actions</span>
              {d.statut === "terminee" && (
                <button type="button" className="sy-btn sy-btn--primary sy-btn--md sy-btn--block" onClick={() => setFenetre("confirmer")}>
                  Confirmer la fin de prestation
                </button>
              )}
              {d.statut === "confirmee" && (
                <button type="button" className="sy-btn sy-btn--primary sy-btn--md sy-btn--block" onClick={() => go("avis")}>
                  Laisser un avis
                </button>
              )}
              {arretee && d.prestataire && (
                <button type="button" className="sy-btn sy-btn--primary sy-btn--md sy-btn--block" onClick={() => go("results", { titre: d.secteur.nom, filtre: { q: d.secteur.nom }, quartier: 0 })}>
                  Choisir un autre technicien
                </button>
              )}
              {(d.statut === "envoyee" || d.statut === "acceptee") && (
                <button type="button" className="sy-btn sy-btn--outline sy-btn--md sy-btn--block" onClick={() => setFenetre("annuler")}>
                  Annuler la demande
                </button>
              )}
              {["en_cours", "terminee", "confirmee"].includes(d.statut) && (
                <button
                  type="button"
                  className="sy-btn sy-btn--outline sy-btn--md sy-btn--block"
                  style={{ color: "var(--state-danger)", borderColor: "var(--state-danger)" }}
                  onClick={() => setFenetre("signaler")}
                >
                  Signaler un problème
                </button>
              )}
              {d.prestataire && (
                <button type="button" className="sy-btn sy-btn--outline sy-btn--md sy-btn--block" style={{ gap: 8 }} onClick={() => go("fiche", { fiche: d.prestataire!.id })}>
                  <Icon name="user" size={18} />
                  Voir la fiche du technicien
                </button>
              )}
              {["terminee", "confirmee"].includes(d.statut) && (
                <button type="button" className="sy-btn sy-btn--outline sy-btn--md sy-btn--block" onClick={() => setFenetre("paiement")}>
                  Déclarer un paiement direct
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {fenetre === "confirmer" && (
        <Dialogue
          titre="Confirmer la fin de prestation"
          description={`${nom}${d.creneau ? ` · ${d.creneau}` : ""}. Estimation : ${francs(d.estimation)}.`}
          icone="clipboard-check"
          fond="var(--state-success-soft)"
          encre="var(--lagune-700)"
          confirmer="Confirmer la fin de prestation"
          note="Après confirmation, vous pourrez laisser un avis. Le paiement reste convenu directement avec le prestataire."
          onFermer={() => setFenetre(null)}
          onConfirmer={() => agir(() => api.confirmerDemande(d.id), "Fin de prestation confirmée", "Vous pouvez maintenant laisser un avis.")}
        />
      )}

      {fenetre === "annuler" && (
        <Dialogue
          titre="Annuler la demande ?"
          description={`${nom} sera prévenu que vous n'avez plus besoin de son intervention.`}
          icone="x"
          fond="var(--argile-100)"
          encre="var(--argile-700)"
          confirmer="Annuler la demande"
          onFermer={() => setFenetre(null)}
          onConfirmer={() => agir(() => api.annulerDemande(d.id, motifAnnulation.trim() || null), "Demande annulée", "Le technicien en est informé.")}
        >
          <div className="sy-field">
            <label className="sy-field__label" htmlFor="annul-motif">
              Motif (facultatif)
            </label>
            <textarea id="annul-motif" className="sy-textarea" value={motifAnnulation} onChange={(e) => setMotifAnnulation(e.target.value)} placeholder="Problème réglé, autre disponibilité…" />
          </div>
        </Dialogue>
      )}

      {fenetre === "signaler" && (
        <Dialogue
          titre="Signaler un problème"
          description="Le support TerraClick examine votre signalement et contacte les deux parties."
          icone="alert-triangle"
          fond="var(--state-danger-soft)"
          encre="var(--state-danger)"
          confirmer="Envoyer le signalement"
          onFermer={() => setFenetre(null)}
          onConfirmer={() => {
            setFenetre(null);
            toast("Signalement envoyé", `Motif : ${motif.toLowerCase()}. Un manager vous recontacte.`);
          }}
        >
          <div className="sy-field">
            <label className="sy-field__label" htmlFor="sig-motif">
              Motif
            </label>
            <div className="sy-select-wrap">
              <select id="sig-motif" className="sy-select" value={motif} onChange={(e) => setMotif(e.target.value)} autoFocus>
                {MOTIFS_SIGNALEMENT.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <span className="sy-select-wrap__caret">
                <Icon name="chevron-down" size={18} />
              </span>
            </div>
          </div>
          <div className="sy-field">
            <label className="sy-field__label" htmlFor="sig-detail">
              Précisions (facultatif)
            </label>
            <textarea id="sig-detail" className="sy-textarea" placeholder="Ce qui s'est passé…" />
          </div>
        </Dialogue>
      )}

      {fenetre === "paiement" && (
        <Dialogue
          titre="Déclarer un paiement direct"
          description="Cette déclaration documente la prestation. TerraClick ne reçoit ni ne conserve ce paiement."
          icone="banknote"
          fond="var(--argile-100)"
          encre="var(--argile-700)"
          confirmer="Enregistrer ma déclaration"
          note="La déclaration est visible par vous, par le prestataire et, en cas de ticket, par un manager."
          onFermer={() => setFenetre(null)}
          onConfirmer={() => {
            setFenetre(null);
            toast("Déclaration enregistrée", "Visible par le prestataire. Aucun fonds ne transite par TerraClick.");
          }}
        >
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))" }}>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="cpay-montant">
                Montant (F)
              </label>
              <input id="cpay-montant" className="sy-input" inputMode="numeric" defaultValue={d.estimation ?? ""} autoFocus />
            </div>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="cpay-moyen">
                Moyen
              </label>
              <div className="sy-select-wrap">
                <select id="cpay-moyen" className="sy-select" value={moyen} onChange={(e) => setMoyen(e.target.value)}>
                  {MOYENS_PAIEMENT_DIRECT.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                <span className="sy-select-wrap__caret">
                  <Icon name="chevron-down" size={18} />
                </span>
              </div>
            </div>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="cpay-date">
                Date
              </label>
              <input id="cpay-date" className="sy-input" type="date" />
            </div>
          </div>
        </Dialogue>
      )}
    </EspaceClient>
  );
}
