import { useState } from "react";
import { useApp } from "../../state/app";
import { MOTIFS_SIGNALEMENT, SUIVI } from "../../data/client";
import { MOYENS_PAIEMENT_DIRECT } from "../../data/pro";
import { Dialogue } from "../../components/Dialogue";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { MONO, Note, OVERLINE, TITRE_CARTE, badge } from "../pro/EspacePro";
import { EspaceClient } from "./EspaceClient";
import { modifierClient, useEtatClient } from "./store";

const s = SUIVI;

const CASE: React.CSSProperties = { background: "var(--argile-50)", borderRadius: 12, padding: "12px 14px" };

export function ClientSuivi() {
  const { go } = useApp();
  const toast = useToast();
  const { demandes } = useEtatClient();
  const demande = demandes.find((d) => d.ref === s.ref)!;
  const confirmee = demande.statut === "Terminée";
  const [fenetre, setFenetre] = useState<"confirmer" | "signaler" | "paiement" | null>(null);
  const [motif, setMotif] = useState(MOTIFS_SIGNALEMENT[0]);
  const [moyen, setMoyen] = useState(MOYENS_PAIEMENT_DIRECT[1]);

  const etapes = s.etapes.map((e, i) =>
    i === s.etapes.length - 1 && confirmee ? { ...e, fait: true, date: "à l'instant" } : e,
  );

  return (
    <EspaceClient titre={s.titre}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ ...MONO, fontSize: "14px", fontWeight: 700 }}>{s.ref}</span>
        <span className={badge(demande.ton)}>{confirmee ? "Terminée" : "Marquée terminée par le prestataire"}</span>
      </div>

      <div data-r="pro-split">
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          {!confirmee && (
            <div className="sy-card" style={{ borderColor: "var(--kola-200)", background: "var(--kola-50)" }}>
              <div style={{ padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Icon name="bell" size={22} color="var(--kola-600)" style={{ marginTop: 1 }} />
                <div>
                  <strong style={{ fontSize: "15px" }}>{s.prestataire} a marqué la prestation terminée</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "14px", lineHeight: 1.6, color: "var(--argile-700)" }}>
                    Confirmez la fin de prestation si le travail est bien terminé, sinon signalez un problème.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h2 style={{ ...TITRE_CARTE, marginBottom: 10 }}>Suivi de la demande</h2>
              <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {etapes.map((e, i) => (
                  <li key={e.libelle} style={{ display: "flex", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none", width: 16 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          marginTop: 4,
                          borderRadius: "50%",
                          background: e.fait ? "var(--secondary)" : "var(--argile-300)",
                        }}
                      />
                      {i < etapes.length - 1 && (
                        <span style={{ flex: 1, width: 2, background: "var(--border-subtle)", margin: "4px 0" }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: 14 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: e.fait ? "inherit" : "var(--text-muted)" }}>
                        {e.libelle}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: 2 }}>{e.date}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="sy-card" style={{ borderColor: "var(--lagune-200)" }}>
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h2 style={TITRE_CARTE}>Réponse de {s.prestataire}</h2>
              <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--argile-700)" }}>« {s.reponse} »</p>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))" }}>
                <div style={CASE}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Estimation</div>
                  <div style={{ ...MONO, fontSize: "17px", fontWeight: 700, marginTop: 2 }}>{s.estimation}</div>
                </div>
                <div style={CASE}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Date confirmée</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, marginTop: 4 }}>{s.date}</div>
                </div>
                <div style={CASE}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Créneau</div>
                  <div style={{ ...MONO, fontSize: "15px", fontWeight: 700, marginTop: 4 }}>{s.creneau}</div>
                </div>
              </div>
            </div>
          </div>

          <Note>
            Le paiement de la prestation est convenu directement entre vous et le prestataire. Servis Yakro ne conserve
            pas les fonds liés à cette prestation.
          </Note>
        </div>

        <aside>
          <div className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={OVERLINE}>Actions</span>
              {confirmee ? (
                <button type="button" className="sy-btn sy-btn--primary sy-btn--md sy-btn--block" onClick={() => go("avis")}>
                  Laisser un avis
                </button>
              ) : (
                <button
                  type="button"
                  className="sy-btn sy-btn--primary sy-btn--md sy-btn--block"
                  onClick={() => setFenetre("confirmer")}
                >
                  Confirmer la fin de prestation
                </button>
              )}
              <button
                type="button"
                className="sy-btn sy-btn--outline sy-btn--md sy-btn--block"
                style={{ color: "var(--state-danger)", borderColor: "var(--state-danger)" }}
                onClick={() => setFenetre("signaler")}
              >
                Signaler un problème
              </button>
              <button
                type="button"
                className="sy-btn sy-btn--outline sy-btn--md sy-btn--block"
                style={{ gap: 8 }}
                onClick={() => toast(`Appeler ${s.prestataire}`, "Le numéro figure sur sa fiche professionnelle.", "info")}
              >
                <Icon name="phone" size={18} />
                Appeler le prestataire
              </button>
              <button type="button" className="sy-btn sy-btn--outline sy-btn--md sy-btn--block" onClick={() => setFenetre("paiement")}>
                Déclarer un paiement direct
              </button>
            </div>
          </div>
        </aside>
      </div>

      {fenetre === "confirmer" && (
        <Dialogue
          titre="Confirmer la fin de prestation"
          description={`${s.prestataire} · ${s.date}, ${s.creneau}. Estimation acceptée : ${s.estimation}.`}
          icone="clipboard-check"
          fond="var(--state-success-soft)"
          encre="var(--lagune-700)"
          confirmer="Confirmer la fin de prestation"
          note="Après confirmation, vous pourrez laisser un avis. Le paiement reste convenu directement avec le prestataire."
          onFermer={() => setFenetre(null)}
          onConfirmer={() => {
            modifierClient((e) => ({
              demandes: e.demandes.map((d) =>
                d.ref === s.ref
                  ? { ...d, statut: "Terminée", groupe: "Terminées", ton: "success", prochaine: "Laisser un avis" }
                  : d,
              ),
            }));
            setFenetre(null);
            toast("Fin de prestation confirmée", "Vous pouvez maintenant laisser un avis.");
          }}
        />
      )}

      {fenetre === "signaler" && (
        <Dialogue
          titre="Signaler un problème"
          description="Le support Servis Yakro examine votre signalement et contacte les deux parties."
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
          description="Cette déclaration documente la prestation. Servis Yakro ne reçoit ni ne conserve ce paiement."
          icone="banknote"
          fond="var(--argile-100)"
          encre="var(--argile-700)"
          confirmer="Enregistrer ma déclaration"
          note="La déclaration est visible par vous, par le prestataire et, en cas de ticket, par un manager."
          onFermer={() => setFenetre(null)}
          onConfirmer={() => {
            setFenetre(null);
            toast("Déclaration enregistrée", "Visible par le prestataire. Aucun fonds ne transite par Servis Yakro.");
          }}
        >
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))" }}>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="cpay-montant">
                Montant (F)
              </label>
              <input id="cpay-montant" className="sy-input" inputMode="numeric" defaultValue="25 000" autoFocus />
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
