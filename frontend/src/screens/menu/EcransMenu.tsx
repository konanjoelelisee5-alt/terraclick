import { useState, type ReactNode } from "react";
import { SECTEURS } from "../../data/catalogue";
import type { RechercheApi } from "../../lib/api";
import { appareilId, effacerHistorique, useHistorique } from "../../lib/historique";
import { useApp } from "../../state/app";
import { ChoixVille } from "../../components/ChoixVille";
import { Dialogue } from "../../components/Dialogue";
import { Icon } from "../../components/Icon";
import { BandeauInstallation } from "../../components/Installer";
import { useToast } from "../../components/Toast";

/* Écrans ouverts depuis le menu ⋮ de l'accueil : onglets de recherche, historique, onglets
   récents (autres appareils), téléchargements (reçus) et paramètres. */

const GRIS = "#5C5248";

const CARTE: React.CSSProperties = {
  background: "var(--color-neutral-100)",
  border: "1px solid var(--color-divider)",
  borderRadius: 20,
};

const LIGNE: React.CSSProperties = {
  width: "100%",
  minHeight: 60,
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "10px 16px",
  border: 0,
  background: "none",
  font: "inherit",
  color: "inherit",
  textAlign: "left",
  cursor: "pointer",
};

function Page({ titre, sousTitre, children, r }: { titre: string; sousTitre?: string; children: ReactNode; r: string }) {
  return (
    <main data-r={r} style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 48px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "28px", lineHeight: 1.2 }}>{titre}</h1>
        {sousTitre && <p style={{ margin: "4px 0 0", fontSize: "15px", color: GRIS }}>{sousTitre}</p>}
      </div>
      {children}
    </main>
  );
}

function Vide({ icone, titre, texte }: { icone: string; titre: string; texte: string }) {
  return (
    <div role="status" style={{ ...CARTE, padding: "36px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}>
      <Icon name={icone} size={40} strokeWidth={1.5} color={GRIS} />
      <h2 style={{ margin: "6px 0 0", fontSize: "19px" }}>{titre}</h2>
      <p style={{ margin: 0, fontSize: "14.5px", lineHeight: 1.5, color: GRIS, maxWidth: "32ch" }}>{texte}</p>
    </div>
  );
}

const secteurDe = (r: RechercheApi) => SECTEURS.find((s) => s.cle === r.secteur || s.categorie === r.categorie) ?? null;

const heure = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function jour(iso: string) {
  const d = new Date(iso);
  const aujourdhui = new Date();
  const hier = new Date(Date.now() - 864e5);
  if (d.toDateString() === aujourdhui.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === hier.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

/** Relance une recherche de l'historique. */
function useRelancer() {
  const { rechercher } = useApp();
  return (r: RechercheApi) => {
    const s = secteurDe(r);
    if (r.categorie && s) rechercher(s.nom, { categorie: r.categorie });
    else rechercher(r.texte);
  };
}

/** Ligne d'historique : icône du secteur, texte, et secteur reconnu ou heure. */
function LigneRecherche({ r, detail }: { r: RechercheApi; detail: string }) {
  const relancer = useRelancer();
  const s = secteurDe(r);
  return (
    <button data-r="ligne-historique" onClick={() => relancer(r)} style={LIGNE}>
      <span style={{ width: 40, height: 40, flex: "none", borderRadius: 999, background: "var(--color-surface)", display: "grid", placeItems: "center" }}>
        <Icon name={s?.icone ?? "search"} size={19} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: "15.5px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.texte}</span>
        <span style={{ display: "block", fontSize: "13px", color: GRIS }}>{detail}</span>
      </span>
      <Icon name="chevron-right" size={18} color={GRIS} />
    </button>
  );
}

/** « Onglets de recherche » : un onglet par secteur cherché (ou par recherche libre), le plus récent d'abord. */
export function Onglets() {
  const { etat } = useApp();
  const relancer = useRelancer();
  const { elements } = useHistorique(!!etat.auth);

  const onglets: { cle: string; titre: string; derniere: RechercheApi; nombre: number }[] = [];
  for (const r of elements ?? []) {
    const s = secteurDe(r);
    const cle = s?.cle ?? r.texte.toLowerCase();
    const existant = onglets.find((o) => o.cle === cle);
    if (existant) existant.nombre++;
    else onglets.push({ cle, titre: s?.nom ?? r.texte, derniere: r, nombre: 1 });
  }

  return (
    <Page r="onglets" titre="Onglets de recherche" sousTitre="Chaque service cherché garde son onglet : revenez-y en un toucher.">
      {elements && onglets.length === 0 && <Vide icone="square-plus" titre="Aucun onglet" texte="Vos recherches apparaîtront ici, un onglet par service." />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        {onglets.map((o) => {
          const s = secteurDe(o.derniere);
          return (
            <button key={o.cle} data-r="onglet" onClick={() => relancer(o.derniere)} style={{ ...CARTE, overflow: "hidden", padding: 0, textAlign: "left", font: "inherit", color: "inherit", cursor: "pointer" }}>
              {s?.image ? (
                <img src={s.image} alt="" style={{ display: "block", width: "100%", height: 96, objectFit: "cover" }} />
              ) : (
                <span style={{ display: "grid", placeItems: "center", height: 96, background: "var(--color-surface)", color: GRIS }}>
                  <Icon name={s?.icone ?? "search"} size={30} strokeWidth={1.75} />
                </span>
              )}
              <span style={{ display: "block", padding: "10px 12px" }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.titre}</span>
                <span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>
                  {o.nombre} recherche{o.nombre > 1 ? "s" : ""} · {jour(o.derniere.date).toLowerCase()}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Page>
  );
}

/** « Historique » : les recherches par jour, et « Supprimer les données de navigation ». */
export function Historique() {
  const { etat } = useApp();
  const toast = useToast();
  const [version, setVersion] = useState(0);
  const { elements } = useHistorique(!!etat.auth, version);
  const [confirmer, setConfirmer] = useState(false);

  const jours: { jour: string; liste: RechercheApi[] }[] = [];
  for (const r of elements ?? []) {
    const j = jour(r.date);
    const groupe = jours.find((g) => g.jour === j);
    if (groupe) groupe.liste.push(r);
    else jours.push({ jour: j, liste: [r] });
  }

  return (
    <Page r="historique" titre="Historique" sousTitre={etat.auth ? "Vos recherches, sur tous vos appareils." : "Vos recherches sur cet appareil."}>
      {elements && elements.length > 0 && (
        <button onClick={() => setConfirmer(true)} className="sy-btn sy-btn--outline sy-btn--md" style={{ alignSelf: "flex-start", gap: 8 }}>
          <Icon name="trash-2" size={17} />
          Supprimer les données de navigation
        </button>
      )}
      {elements && elements.length === 0 && <Vide icone="history" titre="Historique vide" texte="Les services et techniciens que vous cherchez apparaîtront ici." />}
      {jours.map((g) => (
        <section key={g.jour} aria-label={g.jour}>
          <h2 style={{ margin: "0 0 8px 4px", fontSize: "14px", fontWeight: 600, color: GRIS, textTransform: "capitalize" }}>{g.jour}</h2>
          <div style={{ ...CARTE, overflow: "hidden" }}>
            {g.liste.map((r, i) => (
              <div key={r.id} style={{ borderTop: i ? "1px solid var(--color-divider)" : 0 }}>
                <LigneRecherche r={r} detail={[heure(r.date), secteurDe(r)?.nom, r.ville].filter(Boolean).join(" · ")} />
              </div>
            ))}
          </div>
        </section>
      ))}
      {confirmer && (
        <Dialogue
          titre="Supprimer les données de navigation ?"
          description="Votre historique de recherche et vos onglets seront effacés de vos appareils."
          icone="trash-2"
          fond="var(--state-danger-soft)"
          encre="var(--state-danger)"
          confirmer="Supprimer"
          onConfirmer={async () => {
            await effacerHistorique(!!etat.auth).catch(() => {});
            setConfirmer(false);
            setVersion((v) => v + 1);
            toast("Données de navigation supprimées", "Votre historique de recherche est vide.");
          }}
          onFermer={() => setConfirmer(false)}
        />
      )}
    </Page>
  );
}

/** « Onglets récents » : les recherches du compte faites sur ses autres appareils. */
export function OngletsRecents() {
  const { elements, erreur } = useHistorique(true);
  const ici = appareilId();
  const autres = (elements ?? []).filter((r) => r.appareil_id !== ici);

  const appareils: { nom: string; liste: RechercheApi[] }[] = [];
  for (const r of autres) {
    const cle = r.appareil_id ?? "?";
    const groupe = appareils.find((a) => a.nom === cle);
    if (groupe) groupe.liste.push(r);
    else appareils.push({ nom: cle, liste: [r] });
  }

  return (
    <Page r="onglets-recents" titre="Onglets récents" sousTitre="Vos recherches sur vos autres appareils, connectés au même compte.">
      {erreur && <p style={{ margin: 0, color: "var(--state-danger)" }}>Les autres appareils n'ont pas pu être joints.</p>}
      {elements && appareils.length === 0 && (
        <Vide icone="monitor-smartphone" titre="Aucun autre appareil" texte="Connectez-vous avec le même numéro sur votre ordinateur ou un autre téléphone : ses recherches apparaîtront ici." />
      )}
      {appareils.map((a) => (
        <section key={a.nom} aria-label={a.liste[0].appareil ?? "Autre appareil"}>
          <h2 style={{ margin: "0 0 8px 4px", display: "flex", alignItems: "center", gap: 8, fontSize: "15px" }}>
            <Icon name="monitor-smartphone" size={18} />
            {a.liste[0].appareil ?? "Autre appareil"}
          </h2>
          <div style={{ ...CARTE, overflow: "hidden" }}>
            {a.liste.slice(0, 8).map((r, i) => (
              <div key={r.id} style={{ borderTop: i ? "1px solid var(--color-divider)" : 0 }}>
                <LigneRecherche r={r} detail={`${jour(r.date)} · ${heure(r.date)}`} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </Page>
  );
}

/** « Téléchargements » : les reçus de paiement, à télécharger. */
export function Telechargements() {
  return (
    <Page r="telechargements" titre="Téléchargements" sousTitre="Vos reçus de paiement, à garder ou à partager.">
      <Vide icone="download" titre="Aucun reçu pour l'instant" texte="Après le paiement d'une intervention, son reçu apparaîtra ici, prêt à être téléchargé." />
    </Page>
  );
}

/** « Paramètres » : réglages de l'application côté utilisateur, et l'entrée des techniciens. */
export function Parametres() {
  const { etat, go, exigerCompte, ville } = useApp();

  const lignes: { icone: string; titre: string; detail: string; action: () => void; r?: string }[] = [
    {
      icone: "user",
      titre: "Mon compte",
      detail: etat.auth ? "Nom, numéro, e-mail, quartier" : "Se connecter ou créer un compte",
      action: () => (etat.auth ? go("clientDashboard") : go("connexion", { telDraft: "", apresConnexion: "parametres" })),
    },
    { icone: "bell", titre: "Notifications", detail: "Demandes, réponses des techniciens", action: () => exigerCompte(() => go("clientNotifications")) },
    { icone: "history", titre: "Historique des recherches", detail: "Revoir ou supprimer vos recherches", action: () => go("historique") },
    {
      icone: "wrench",
      titre: "Devenir prestataire",
      detail: "Vous êtes technicien ? Recevez les demandes de votre quartier.",
      action: () => exigerCompte(() => go("proDashboard")),
      r: "devenir-partenaire",
    },
  ];

  return (
    <Page r="parametres" titre="Paramètres">
      <div style={{ ...CARTE, overflow: "hidden" }}>
        <div style={{ ...LIGNE, cursor: "default" }}>
          <span style={{ width: 40, height: 40, flex: "none", borderRadius: 999, background: "var(--color-surface)", display: "grid", placeItems: "center" }}>
            <Icon name="map-pin" size={19} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: "15.5px", fontWeight: 600 }}>Ville</span>
            <span style={{ display: "block", fontSize: "13px", color: GRIS }}>Les techniciens proposés sont ceux de {ville}.</span>
          </span>
          <ChoixVille
            data-r="parametres-ville"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 40, padding: "0 12px", borderRadius: 999, background: "var(--color-surface)", fontSize: "14px", fontWeight: 600 }}
          />
        </div>
        {lignes.map((l) => (
          <button key={l.titre} data-r={l.r} onClick={l.action} style={{ ...LIGNE, borderTop: "1px solid var(--color-divider)" }}>
            <span style={{ width: 40, height: 40, flex: "none", borderRadius: 999, background: "var(--color-surface)", display: "grid", placeItems: "center" }}>
              <Icon name={l.icone} size={19} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: "15.5px", fontWeight: 600 }}>{l.titre}</span>
              <span style={{ display: "block", fontSize: "13px", color: GRIS }}>{l.detail}</span>
            </span>
            <Icon name="chevron-right" size={18} color={GRIS} />
          </button>
        ))}
      </div>
      <BandeauInstallation sobre style={{ borderRadius: 20, boxShadow: "none" }} />
    </Page>
  );
}
