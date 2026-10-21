import { APRES_ENVOI } from "../../data/catalogue";
import { useApp } from "../../state/app";
import { Facture } from "../../components/Facture";
import { Icon } from "../../components/Icon";
import { CARTE } from "../../components/ui";
import { creneauLisible } from "../../lib/pressing";
import { choisirOnglet } from "../menu/EcransMenu";
import { CadreParcours } from "./commun";
import { CarteTechnicien } from "./CarteTechnicien";

/**
 * Accusé d'envoi : la demande est enregistrée, voici sa référence et ce qui va suivre. Elle se
 * suit dans son onglet ; une commande au pressing montre en plus sa facture.
 */
export function DemandeEnvoyee() {
  const { etat, go } = useApp();
  const d = etat.demandeEnvoyee;
  const commande = d?.commande && d.pack ? d.commande : null;

  const suivre = () => {
    if (d?.accord_id) {
      choisirOnglet(d.accord_id);
      go("accord");
    } else go("clientDemandes");
  };

  return (
    <CadreParcours
      retour={() => go("home")}
      actions={
        <>
          <button data-r="suivre-commande" onClick={suivre} className="sy-btn sy-btn--primary sy-btn--md" style={{ flex: 1, minHeight: 50, justifyContent: "center" }}>
            {commande ? "Suivre ma commande" : "Suivre ma demande"}
          </button>
          <button onClick={() => go("home")} className="sy-btn sy-btn--outline sy-btn--md" style={{ flex: 1, minHeight: 50, justifyContent: "center" }}>
            Accueil
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, marginBottom: 22 }}>
        <span
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            background: "var(--state-success-soft)",
            color: "var(--state-success)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="check" size={32} strokeWidth={2.5} />
        </span>
        <h1 style={{ fontSize: "clamp(24px,4vw,30px)", margin: 0 }}>{commande ? "Commande envoyée" : "Demande envoyée"}</h1>
        {d && <span style={{ fontSize: "14px", color: "var(--color-neutral-700)" }}>Référence {d.reference}</span>}
        <p style={{ margin: 0, fontSize: "15px", maxWidth: "46ch" }}>
          {commande
            ? `${d?.prestataire?.nom ?? "Le pressing"} va confirmer votre commande. Suivez-la dans vos onglets ; la cloche vous prévient à chaque étape.`
            : APRES_ENVOI}
        </p>
      </div>

      {d && commande && d.pack && (
        <Facture
          reference={d.reference}
          date={d.cree_le}
          pressing={d.prestataire?.nom ?? "Pressing"}
          lignes={d.pack.articles}
          details={[
            ["Service", `${commande.service?.nom ?? ""}${commande.express ? " · Express" : ""}`],
            ["Dépôt", commande.depot?.nom],
            [commande.depot?.cle === "pressing" ? "Dépôt prévu" : "Collecte", creneauLisible(d.date_souhaitee, commande.heure)],
            ["Adresse", [commande.adresse, d.quartier?.nom, d.repere].filter(Boolean).join(" · ")],
            ["Instructions", d.precision],
            ["Paiement", d.paiement_libelle],
          ]}
        />
      )}

      {d && !commande && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...CARTE, padding: 16 }}>
            <span style={{ display: "block", fontWeight: 700, fontSize: "15px", marginBottom: 2 }}>Votre demande</span>
            <span style={{ fontSize: "14.5px" }}>{d.resume}</span>
          </div>
          {d.prestataire && <CarteTechnicien p={d.prestataire} badge="En attente de réponse" />}
        </div>
      )}
    </CadreParcours>
  );
}
