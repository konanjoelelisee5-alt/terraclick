import { Fragment, useState } from "react";
import { APRES_ENVOI, FRAIS_DEPLACEMENT, PAIEMENT_AUTRE, PAIEMENTS, POLITIQUE_ANNULATION, secteurParCle } from "../../data/catalogue";
import { api, ErreurApi, messageErreur } from "../../lib/api";
import { slugifier } from "../../lib/annuaire";
import { useApi } from "../../lib/useApi";
import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { CARTE } from "../../components/ui";
import { Facture } from "../../components/Facture";
import { lancerEnvol } from "../../components/EnvolDemande";
import { CONFIG } from "../../lib/config";
import { creneauLisible, lignesPack } from "../../lib/pressing";
import { francs, modifierClient, versDemandeClient } from "../client/store";
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
  // Pack pressing : les noms des articles, pour le récapitulatif.
  const { donnees: articles } = useApi(() => (b.pack.length ? api.articlesPressing() : Promise.resolve([])), [b.pack.length > 0]);
  const { donnees: options } = useApi(() => (b.pack.length ? api.optionsPressing() : Promise.resolve(null)), [b.pack.length > 0]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [facture, setFacture] = useState(false);
  // Commande au pressing : récapitulatif détaillé, facture, trois moyens de paiement.
  const pressing = b.secteur === "pressing" && b.pack.length > 0;

  const { donnees: villes } = useApi(() => api.villes(), []);
  const quartierChoisi = villes?.find((v) => v.slug === slugifier(ville))?.quartiers.find((q) => q.id === b.quartier);
  const quartier = quartierChoisi?.nom ?? null;
  // Frais de déplacement fixés par l'équipe pour ce quartier.
  const frais = quartierChoisi?.frais_deplacement ?? null;

  if (!b.secteur || !b.quartier || !b.prestataire || (pressing && (!b.depot || !b.heure || !b.date))) {
    return (
      <CadreParcours retour={() => go("home")}>
        <h1 style={TITRE_ETAPE}>Votre demande est incomplète</h1>
        <p style={AIDE}>Reprenez l'assistant pour décrire votre besoin et choisir un technicien.</p>
        <button
          onClick={() => (pressing ? go("commandePressing") : go("besoin", { besoinEtape: b.secteur ? 1 : 0 }))}
          className="sy-btn sy-btn--primary sy-btn--md"
        >
          Reprendre ma demande
        </button>
      </CadreParcours>
    );
  }
  const technicien = b.prestataire;
  const lignes = lignesPack(b, articles, options);
  const total = lignes.reduce((n, l) => n + l.total, 0);
  const details: [string, string][] = pressing
    ? ([
        ["Articles", lignes.map((l) => `${l.quantite} × ${l.nom}`).join(", ")],
        ["Service", `${options?.services.find((s) => s.cle === b.service)?.nom ?? b.service}${b.express ? " · Express" : ""}`],
        ["Dépôt", options?.depots.find((d) => d.cle === b.depot)?.nom ?? ""],
        [b.depot === "pressing" ? "Dépôt prévu" : "Collecte", creneauLisible(b.date, b.heure) ?? ""],
        ["Adresse", [b.adresse, quartier, b.repere].filter(Boolean).join(" · ")],
        ["Instructions", b.precision.trim()],
        ["Frais de déplacement", frais ? `${frais.toLocaleString("fr-FR")} F` : ""],
      ] as [string, string][]).filter(([, v]) => v)
    : [];

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
    // Pack pressing : seuls les articles et leur nombre partent ; l'API calcule les prix.
    b.pack.forEach((a, i) => {
      f.append(`articles[${i}][cle]`, a.cle);
      f.append(`articles[${i}][quantite]`, String(a.quantite));
    });
    if (pressing) {
      f.append("service", b.service);
      f.append("express", b.express ? "1" : "0");
      f.append("depot", b.depot ?? "");
      f.append("heure", b.heure);
      if (b.adresse) f.append("adresse_libelle", b.adresse);
    }

    try {
      const { data } = await api.creerDemande(f);
      // « Mes demandes » affiche aussitôt la nouvelle demande, telle qu'enregistrée.
      modifierClient((e) => ({ demandes: [versDemandeClient(data), ...e.demandes.filter((d) => d.id !== data.id)] }));
      if (CONFIG.envoiDemande === "ecran") {
        go("demandeEnvoyee", { demandeEnvoyee: data });
        return;
      }
      // Le parcours s'arrête à l'envoi : la fenêtre s'envole vers « Mes onglets », où la
      // demande se suit. L'accueil s'affiche dessous ; sans barre d'onglets, les onglets s'ouvrent.
      lancerEnvol(
        {
          titre: pressing ? "Commande envoyée" : "Demande envoyée",
          reference: data.reference,
          texte: "Suivez-la désormais dans vos onglets.",
        },
        { sansCible: () => go("onglets") },
      );
      go("home", { besoin: { ...b, photos: [], pack: [] } });
    } catch (e) {
      const champs = e instanceof ErreurApi ? Object.values(e.champs)[0]?.[0] : undefined;
      setErreur(champs ?? messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <CadreParcours
      retour={() => (pressing ? go("commandePressing") : b.mode === "recommande" ? go("recommandations") : go("fiche", { fiche: technicien.id }))}
      actions={
        <button
          onClick={() => exigerCompte(envoyer)}
          disabled={envoi}
          className="sy-btn sy-btn--primary sy-btn--md"
          style={{ flex: 1, minHeight: 52, justifyContent: "center", fontSize: "16px" }}
        >
          {envoi ? "Envoi en cours…" : pressing ? `Valider la commande · ${francs(total)}` : "Confirmer ma demande"}
        </button>
      }
    >
      <h1 style={TITRE_ETAPE}>{pressing ? "Vérifiez votre commande" : "Vérifiez avant d'envoyer"}</h1>
      <p style={AIDE}>Rien n'est envoyé tant que vous n'avez pas {pressing ? "validé" : "confirmé"}.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {pressing && (
          <div data-r="recap-commande" style={{ ...BLOC, flexDirection: "column", gap: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
              <Icon name="shopping-basket" size={20} color="var(--color-accent-700)" />
              <span style={{ ...TITRE_BLOC, flex: 1, margin: 0 }}>Votre commande</span>
              <button onClick={() => go("commandePressing")} className="sy-btn sy-btn--ghost sy-btn--md" style={{ flex: "none" }}>
                Modifier
              </button>
            </div>
            <dl style={{ margin: "8px 0 0", display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontSize: "14px", width: "100%" }}>
              {details.map(([cle, valeur]) => (
                <Fragment key={cle}>
                  <dt style={{ color: "var(--color-neutral-700)" }}>{cle}</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>{valeur}</dd>
                </Fragment>
              ))}
            </dl>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", width: "100%", marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--color-divider)" }}>
              <span style={{ fontWeight: 700 }}>Prix estimé</span>
              <strong data-r="prix-estime" style={{ fontSize: "20px" }}>
                {francs(total)}
              </strong>
            </div>
            <button
              data-r="voir-facture"
              onClick={() => setFacture((v) => !v)}
              aria-expanded={facture}
              className="sy-btn sy-btn--outline sy-btn--md"
              style={{ marginTop: 10, gap: 8, alignSelf: "flex-start" }}
            >
              <Icon name="receipt" size={17} />
              {facture ? "Masquer la facture" : "Voir la facture"}
            </button>
          </div>
        )}
        {pressing && facture && <Facture pressing={technicien.nom} lignes={lignes} details={details} />}

        {!pressing && (
        <div style={BLOC}>
          <Icon name="file-text" size={20} color="var(--color-accent-700)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={TITRE_BLOC}>Votre demande</span>
            <span data-r="confirmation-resume" style={{ fontSize: "14.5px" }}>
              {resumeBesoin(b, quartier)}
            </span>
            {b.repere && <span style={{ display: "block", fontSize: "13.5px", color: "var(--color-neutral-700)" }}>Repère : {b.repere}</span>}
            {frais ? (
              <span data-r="confirmation-frais" style={{ display: "block", fontSize: "13.5px", color: "var(--color-neutral-700)" }}>
                Frais de déplacement : {frais.toLocaleString("fr-FR")} F
              </span>
            ) : null}
            {b.pack.length > 0 && (
              <ul data-r="confirmation-pack" style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: "13.5px", color: "var(--color-neutral-700)" }}>
                {b.pack.map((a) => (
                  <li key={a.cle}>
                    {a.quantite} × {articles?.find((x) => x.cle === a.cle)?.nom ?? a.cle}
                  </li>
                ))}
              </ul>
            )}
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
        )}

        <div>
          <span style={{ ...TITRE_BLOC, margin: "8px 0 8px" }}>
            {pressing ? "Pressing choisi" : b.mode === "recommande" ? "Technicien recommandé" : `${secteur?.metier ?? "Technicien"} choisi`}
          </span>
          <CarteTechnicien p={technicien} />
        </div>

        {!pressing && (
          <div style={BLOC}>
            <Icon name="map-pin" size={20} color="var(--color-accent-700)" />
            <div>
              <span style={TITRE_BLOC}>Frais de déplacement</span>
              <span style={{ fontSize: "14px", color: "var(--color-neutral-700)" }}>{FRAIS_DEPLACEMENT}</span>
            </div>
          </div>
        )}

        <div>
          <span style={{ ...TITRE_BLOC, margin: "8px 0 8px" }}>Comment paierez-vous {pressing ? "le pressing" : "le technicien"} ?</span>
          <div role="radiogroup" aria-label="Paiement" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(pressing ? [...PAIEMENTS, PAIEMENT_AUTRE] : PAIEMENTS).map((p) => (
              <Choix
                key={p.valeur}
                actif={b.paiement === p.valeur}
                onClick={() => modifierBesoin({ paiement: p.valeur })}
                titre={p.libelle}
                detail={p.detail}
                icone={p.valeur === "especes" ? "banknote" : p.valeur === "autre" ? "credit-card" : "wallet"}
              />
            ))}
          </div>
          <p style={{ ...AIDE, margin: "8px 0 0", fontSize: "13px" }}>
            Le paiement se fait directement {pressing ? "au pressing" : "au technicien"} : aucun argent ne passe par TerraClick.
          </p>
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
            <span style={{ fontSize: "14px" }}>
              {pressing ? "Le pressing confirme votre commande. Vous la suivez ensuite dans vos onglets, étape par étape, et la cloche vous prévient." : APRES_ENVOI}
            </span>
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
