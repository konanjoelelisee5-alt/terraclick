import { useEffect, useState } from "react";
import { api, messageErreur } from "../lib/api";
import { contactEnAttente, oublierContact, type ContactEnAttente } from "../lib/contacts";
import { useApp } from "../state/app";
import { Dialogue } from "./Dialogue";
import { useToast } from "./Toast";

/** Délai avant de poser la question : le client a eu le temps d'échanger avec le technicien. */
const DELAI_MS = 8000;

/**
 * « Avez-vous conclu avec Koffi Tanoh ? » : posée quand le client revient dans l'application
 * après avoir appelé, écrit ou contacté un technicien sur WhatsApp. Oui → la relation devient
 * un onglet (avec son reçu) ; « Pas encore » → la question est abandonnée.
 */
export function ConfirmationAccord() {
  const { etat, go, exigerCompte } = useApp();
  const toast = useToast();
  const [contact, setContact] = useState<ContactEnAttente | null>(null);
  const [objet, setObjet] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let minuterie: number | undefined;
    const verifier = () => {
      const c = contactEnAttente();
      if (!c || document.visibilityState !== "visible") return;
      const reste = c.le + DELAI_MS - Date.now();
      window.clearTimeout(minuterie);
      if (reste <= 0) ouvrir(c);
      else minuterie = window.setTimeout(verifier, reste);
    };
    const ouvrir = (c: ContactEnAttente) => {
      setContact(c);
      setObjet(c.prestation?.nom ?? "");
      setMontant("");
      setDate("");
      setErreur(null);
    };
    verifier();
    document.addEventListener("visibilitychange", verifier);
    window.addEventListener("tc-contact", verifier);
    return () => {
      window.clearTimeout(minuterie);
      document.removeEventListener("visibilitychange", verifier);
      window.removeEventListener("tc-contact", verifier);
    };
  }, []);

  if (!contact) return null;

  const fermer = () => {
    oublierContact();
    setContact(null);
  };

  const enregistrer = async () => {
    const somme = montant.replace(/\D/g, "");
    try {
      await api.creerAccord({
        prestataire_id: contact.prestataire.id,
        canal: contact.canal,
        prestation: contact.prestation?.slug ?? null,
        objet: objet.trim() || null,
        recherche: contact.recherche,
        montant: somme ? Number(somme) : null,
        date_intervention: date || null,
      });
      fermer();
      toast("Accord enregistré", "Retrouvez-le dans vos onglets, avec son reçu.");
      go("onglets");
    } catch (e) {
      setErreur(messageErreur(e));
    }
  };

  return (
    <Dialogue
      titre={`Avez-vous conclu avec ${contact.prestataire.nom} ?`}
      description="Si vous vous êtes entendus pour une intervention, confirmez-le : elle rejoindra vos onglets, avec son reçu."
      icone="clipboard-check"
      fond="var(--state-success-soft)"
      encre="var(--lagune-700)"
      confirmer="Oui, accord conclu"
      annuler="Pas encore"
      onFermer={fermer}
      // L'onglet appartient au compte : sans session, on se connecte d'abord.
      onConfirmer={() => (etat.auth ? enregistrer() : exigerCompte(enregistrer))}
    >
      <div className="sy-field">
        <label className="sy-field__label" htmlFor="accord-objet">
          Travail convenu
        </label>
        <input id="accord-objet" className="sy-input" value={objet} onChange={(e) => setObjet(e.target.value)} placeholder="Réparation de tuyau, débouchage…" />
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))" }}>
        <div className="sy-field">
          <label className="sy-field__label" htmlFor="accord-montant">
            Montant convenu (F, facultatif)
          </label>
          <input id="accord-montant" className="sy-input" inputMode="numeric" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="15 000" />
        </div>
        <div className="sy-field">
          <label className="sy-field__label" htmlFor="accord-date">
            Date de l'intervention
          </label>
          <input id="accord-date" className="sy-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      {erreur && (
        <p role="alert" style={{ margin: 0, color: "var(--state-danger)", fontSize: "14px" }}>
          {erreur}
        </p>
      )}
    </Dialogue>
  );
}
