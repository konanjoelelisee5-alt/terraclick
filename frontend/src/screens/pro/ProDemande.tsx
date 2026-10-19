import { useState } from "react";
import { useApp } from "../../state/app";
import { DEMANDE_DETAIL, MOYENS_PAIEMENT_DIRECT } from "../../data/pro";
import { Dialogue } from "../../components/Dialogue";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspacePro, MONO, Note, OVERLINE, TITRE_CARTE, badge } from "./EspacePro";
import { modifierPro, useEtatPro } from "./store";

const d = DEMANDE_DETAIL;

export function ProDemande() {
  const { go } = useApp();
  const toast = useToast();
  const { demandes } = useEtatPro();
  const courante = demandes.find((x) => x.ref === d.ref) ?? d;
  const [fenetre, setFenetre] = useState<"terminer" | "paiement" | null>(null);
  const [message, setMessage] = useState("");
  const [montant, setMontant] = useState("25 000");
  const [moyen, setMoyen] = useState(MOYENS_PAIEMENT_DIRECT[1]);

  const changerStatut = (statut: string, groupe: string, ton: typeof d.ton) =>
    modifierPro((e) => ({ demandes: e.demandes.map((x) => (x.ref === d.ref ? { ...x, statut, groupe, ton } : x)) }));

  const repondre = () => {
    if (message.trim().length < 5) {
      toast("Message trop court", "Expliquez en une phrase ce que vous proposez au client.", "danger");
      return;
    }
    changerStatut("Répondue", "Répondues", "info");
    toast("Réponse envoyée", `${d.client} reçoit votre proposition.`);
    go("proDemandes");
  };

  return (
    <EspacePro titre={`${d.client} · ${d.categorie}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ ...MONO, fontSize: "14px", fontWeight: 700 }}>{d.ref}</span>
        <span className={badge(courante.ton)}>{courante.statut}</span>
      </div>

      <div data-r="pro-split">
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h2 style={TITRE_CARTE}>Besoin décrit par le client</h2>
              <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--argile-700)" }}>{d.description}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {d.photos.map((p) => (
                  <div
                    key={p}
                    className="sy-slot"
                    style={{ width: 110, height: 110, borderRadius: 12, placeItems: "end start", padding: 8 }}
                  >
                    {p}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span className="sy-badge sy-badge--neutral">{d.quartier}</span>
                <span className="sy-badge sy-badge--neutral">Souhaitée : {d.souhait}</span>
                <span className="sy-badge sy-badge--neutral">Budget indiqué : {d.budget}</span>
                <span className="sy-badge sy-badge--neutral">Contact : {d.contact}</span>
              </div>
            </div>
          </div>

          <div className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={TITRE_CARTE}>Répondre à la demande</h2>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))" }}>
                <div className="sy-field">
                  <label className="sy-field__label" htmlFor="rep-estimation">
                    Estimation (facultatif)
                  </label>
                  <input id="rep-estimation" className="sy-input" placeholder="25 000 F" inputMode="numeric" />
                  <span className="sy-field__hint">Montant indicatif, pas un prix définitif.</span>
                </div>
                <div className="sy-field">
                  <label className="sy-field__label" htmlFor="rep-date">
                    Date proposée
                  </label>
                  <input id="rep-date" className="sy-input" type="date" />
                </div>
                <div className="sy-field">
                  <label className="sy-field__label" htmlFor="rep-debut">
                    Début
                  </label>
                  <input id="rep-debut" className="sy-input" type="time" defaultValue="09:00" />
                </div>
                <div className="sy-field">
                  <label className="sy-field__label" htmlFor="rep-fin">
                    Fin
                  </label>
                  <input id="rep-fin" className="sy-input" type="time" defaultValue="11:00" />
                </div>
              </div>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="rep-message">
                  Message au client
                </label>
                <textarea
                  id="rep-message"
                  className="sy-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Je peux passer mardi matin. Le joint et le siphon sont à changer."
                />
              </div>
              <button type="button" className="sy-btn sy-btn--primary sy-btn--md" onClick={repondre} style={{ alignSelf: "flex-start" }}>
                Envoyer ma réponse
              </button>
            </div>
          </div>

          <Note>
            Le paiement de la prestation est convenu directement entre le client et le prestataire. TerraClick ne
            conserve pas les fonds liés à cette prestation.
          </Note>
        </div>

        <aside>
          <div className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={OVERLINE}>Actions</span>
              <button
                type="button"
                className="sy-btn sy-btn--outline sy-btn--md sy-btn--block"
                style={{ gap: 8 }}
                onClick={() => toast(`Appeler ${d.client}`, "Le numéro du client s'affichera ici une fois l'appel branché.", "info")}
              >
                <Icon name="phone" size={18} />
                Appeler {d.client}
              </button>
              <button
                type="button"
                className="sy-btn sy-btn--outline sy-btn--md sy-btn--block"
                style={{ gap: 8 }}
                onClick={() => toast("WhatsApp", "La conversation WhatsApp s'ouvrira ici.", "info")}
              >
                <Icon name="message-circle" size={18} />
                WhatsApp
              </button>
              <button type="button" className="sy-btn sy-btn--outline sy-btn--md sy-btn--block" onClick={() => setFenetre("terminer")}>
                Marquer la prestation terminée
              </button>
              <button type="button" className="sy-btn sy-btn--outline sy-btn--md sy-btn--block" onClick={() => setFenetre("paiement")}>
                Déclarer un paiement reçu
              </button>
              <button
                type="button"
                className="sy-btn sy-btn--ghost sy-btn--md sy-btn--block"
                style={{ color: "var(--state-danger)" }}
                onClick={() => {
                  changerStatut("Refusée", "Terminées", "neutral");
                  toast("Demande refusée", `${d.client} est prévenu et peut contacter un autre prestataire.`);
                }}
              >
                Refuser la demande
              </button>
            </div>
          </div>
        </aside>
      </div>

      {fenetre === "terminer" && (
        <Dialogue
          titre="Marquer la prestation terminée"
          description={`${d.client} · ${d.quartier} · ${d.souhait}, 09:00 – 11:00. Estimation acceptée : ${d.budget}.`}
          icone="clipboard-check"
          fond="var(--kola-100)"
          encre="var(--kola-700)"
          confirmer="Marquer comme terminée"
          note="Le client devra confirmer la fin de prestation."
          onFermer={() => setFenetre(null)}
          onConfirmer={() => {
            changerStatut("À confirmer", "À confirmer", "warning");
            setFenetre(null);
            toast("Prestation marquée terminée", `${d.client} reçoit une demande de confirmation.`);
          }}
        />
      )}

      {fenetre === "paiement" && (
        <Dialogue
          titre="Déclarer un paiement direct"
          description="Cette déclaration documente la prestation. TerraClick ne reçoit ni ne conserve ce paiement."
          icone="banknote"
          fond="var(--argile-100)"
          encre="var(--argile-700)"
          confirmer="Enregistrer ma déclaration"
          note="La déclaration est visible par vous, par l'autre partie et, en cas de ticket, par un manager."
          onFermer={() => setFenetre(null)}
          onConfirmer={() => {
            setFenetre(null);
            toast("Déclaration enregistrée", "Visible par l'autre partie. Aucun fonds ne transite par TerraClick.");
          }}
        >
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))" }}>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="pay-montant">
                Montant (F)
              </label>
              <input
                id="pay-montant"
                className="sy-input"
                inputMode="numeric"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                autoFocus
              />
            </div>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="pay-moyen">
                Moyen
              </label>
              <div className="sy-select-wrap">
                <select id="pay-moyen" className="sy-select" value={moyen} onChange={(e) => setMoyen(e.target.value)}>
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
              <label className="sy-field__label" htmlFor="pay-date">
                Date
              </label>
              <input id="pay-date" className="sy-input" type="date" />
            </div>
          </div>
        </Dialogue>
      )}
    </EspacePro>
  );
}
