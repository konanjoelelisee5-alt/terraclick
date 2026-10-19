import { useState } from "react";
import { APRES_ENVOI, FRAIS_DEPLACEMENT, PAIEMENTS, POLITIQUE_ANNULATION, secteurParCle } from "../../data/catalogue";
import { api, ErreurApi, messageErreur } from "../../lib/api";
import { slugifier } from "../../lib/annuaire";
import { useApi } from "../../lib/useApi";
import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { CARTE } from "../../components/ui";
import { modifierClient } from "../client/store";
import { AIDE, CadreParcours, Choix, TITRE_ETAPE, resumeBesoin } from "./commun";
import { CarteTechnicien } from "./CarteTechnicien";

const BLOC: React.CSSProperties = { ...CARTE, padding: 16, display: "flex", gap: 12, alignItems: "flex-start" };
const TITRE_BLOC: React.CSSProperties = { display: "block", fontWeight: 700, fontSize: "15px", marginBottom: 2 };

/**
 * Dernier écran avant l'envoi : le client voit tout ce qui va se passer — demande,
 * technicien, frais, paiement, annulation — puis confirme. Le compte n'est demandé qu'ici.
 */
export function Confirmation() {
  const { etat, go, exigerCompte, modifierBesoin, ville } = useApp();
  const b = etat.besoin;
  const secteur = secteurParCle(b.secteur);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const { donnees: villes } = useApi(() => api.villes(), []);
  const quartier = villes?.find((v) => v.slug === slugifier(ville))?.quartiers.find((q) => q.id === b.quartier)?.nom ?? null;

  if (!b.secteur || !b.quartier || !b.prestataire) {
    return (
      <CadreParcours retour={() => go("home")}>
        <h1 style={TITRE_ETAPE}>Votre demande est incomplète</h1>
        <p style={AIDE}>Reprenez l'assistant pour décrire votre besoin et choisir un technicien.</p>
        <button onClick={() => go("besoin", { besoinEtape: b.secteur ? 1 : 0 })} className="sy-btn sy-btn--primary sy-btn--md">
          Reprendre ma demande
        </button>
      </CadreParcours>
    );
  }
  const technicien = b.prestataire;

  const envoyer = async () => {
    setEnvoi(true);
    setErreur(null);
    const f = new FormData();
    f.append("secteur", b.secteur ?? "");
    f.append("probleme", b.probleme ?? "");
    if (b.precision.trim()) f.append("precision", b.precision.trim());
    f.append("quartier_id", String(b.quartier));
    if (b.repere.trim()) f.append("repere", b.repere.trim());
    f.append("quand", b.quand ?? "");
    if (b.quand === "date") f.append("date_souhaitee", b.date);
    f.append("mode", b.mode ?? "choisi");
    f.append("prestataire_id", String(technicien.id));
    f.append("paiement", b.paiement);
    b.photos.forEach((photo) => f.append("photos[]", photo));

    try {
      const { data } = await api.creerDemande(f);
      // « Mes demandes » affiche aussitôt la nouvelle demande.
      modifierClient((e) => ({
        demandes: [
          {
            ref: data.reference,
            prestataire: technicien.nom,
            initiales: technicien.initiales,
            portee: [data.secteur.nom, data.quartier?.nom].filter(Boolean).join(" · "),
            statut: "Envoyée",
            groupe: "En attente",
            ton: "neutral",
            date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" }),
            estimation: "—",
            prochaine: "Attendre la réponse du technicien",
          },
          ...e.demandes,
        ],
      }));
      go("demandeEnvoyee", { demandeEnvoyee: data });
    } catch (e) {
      const champs = e instanceof ErreurApi ? Object.values(e.champs)[0]?.[0] : undefined;
      setErreur(champs ?? messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <CadreParcours
      retour={() => (b.mode === "recommande" ? go("recommandations") : go("fiche", { fiche: technicien.id }))}
      actions={
        <button
          onClick={() => exigerCompte(envoyer)}
          disabled={envoi}
          className="sy-btn sy-btn--primary sy-btn--md"
          style={{ flex: 1, minHeight: 52, justifyContent: "center", fontSize: "16px" }}
        >
          {envoi ? "Envoi en cours…" : "Confirmer ma demande"}
        </button>
      }
    >
      <h1 style={TITRE_ETAPE}>Vérifiez avant d'envoyer</h1>
      <p style={AIDE}>Rien n'est envoyé tant que vous n'avez pas confirmé.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={BLOC}>
          <Icon name="file-text" size={20} color="var(--color-accent-700)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={TITRE_BLOC}>Votre demande</span>
            <span data-r="confirmation-resume" style={{ fontSize: "14.5px" }}>
              {resumeBesoin(b, quartier)}
            </span>
            {b.repere && <span style={{ display: "block", fontSize: "13.5px", color: "var(--color-neutral-700)" }}>Repère : {b.repere}</span>}
            {b.photos.length > 0 && (
              <span style={{ display: "block", fontSize: "13.5px", color: "var(--color-neutral-700)" }}>
                {b.photos.length} photo{b.photos.length > 1 ? "s" : ""} jointe{b.photos.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button onClick={() => go("besoin", { besoinEtape: 1 })} className="sy-btn sy-btn--ghost sy-btn--md" style={{ flex: "none" }}>
            Modifier
          </button>
        </div>

        <div>
          <span style={{ ...TITRE_BLOC, margin: "8px 0 8px" }}>
            {b.mode === "recommande" ? "Technicien recommandé" : `${secteur?.metier ?? "Technicien"} choisi`}
          </span>
          <CarteTechnicien p={technicien} />
        </div>

        <div style={BLOC}>
          <Icon name="map-pin" size={20} color="var(--color-accent-700)" />
          <div>
            <span style={TITRE_BLOC}>Frais de déplacement</span>
            <span style={{ fontSize: "14px", color: "var(--color-neutral-700)" }}>{FRAIS_DEPLACEMENT}</span>
          </div>
        </div>

        <div>
          <span style={{ ...TITRE_BLOC, margin: "8px 0 8px" }}>Comment paierez-vous le technicien ?</span>
          <div role="radiogroup" aria-label="Paiement" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PAIEMENTS.map((p) => (
              <Choix
                key={p.valeur}
                actif={b.paiement === p.valeur}
                onClick={() => modifierBesoin({ paiement: p.valeur })}
                titre={p.libelle}
                detail={p.detail}
                icone={p.valeur === "especes" ? "banknote" : "wallet"}
              />
            ))}
          </div>
          <p style={{ ...AIDE, margin: "8px 0 0", fontSize: "13px" }}>Le paiement se fait directement au technicien : aucun argent ne passe par TerraClick.</p>
        </div>

        <div style={BLOC}>
          <Icon name="info" size={20} color="var(--color-accent-700)" />
          <div>
            <span style={TITRE_BLOC}>Annulation</span>
            <span style={{ fontSize: "14px", color: "var(--color-neutral-700)" }}>{POLITIQUE_ANNULATION}</span>
          </div>
        </div>

        <div style={{ ...BLOC, background: "var(--color-accent-100)", border: "1px solid var(--color-accent-200)" }}>
          <Icon name="clock" size={20} color="var(--color-accent-700)" />
          <div>
            <span style={TITRE_BLOC}>Et ensuite ?</span>
            <span style={{ fontSize: "14px" }}>{APRES_ENVOI}</span>
          </div>
        </div>
      </div>

      {erreur && (
        <p role="alert" style={{ ...AIDE, margin: "16px 0 0", color: "var(--color-accent-700)" }}>
          {erreur}
        </p>
      )}
    </CadreParcours>
  );
}
