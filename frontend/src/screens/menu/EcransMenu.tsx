import { Fragment, useEffect, useState, type ReactNode } from "react";
import { SECTEURS } from "../../data/catalogue";
import { api, messageErreur, type AccordApi, type RechercheApi } from "../../lib/api";
import { appareilId, effacerHistorique, useHistorique } from "../../lib/historique";
import { useApp } from "../../state/app";
import { ChoixVille } from "../../components/ChoixVille";
import { Dialogue } from "../../components/Dialogue";
import { Icon } from "../../components/Icon";
import { BandeauInstallation } from "../../components/Installer";
import { useToast } from "../../components/Toast";

/* Écrans ouverts depuis le menu ⋮ de l'accueil : onglets (relations abouties et reçus), historique, onglets
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

/** Onglet ouvert dans l'écran de détail (et son reçu). */
let accordOuvert: number | null = null;

const secteurDeCategorie = (categorie: string | null, cle?: string | null) =>
  SECTEURS.find((s) => s.cle === cle || s.categorie === categorie) ?? null;

const dateLongue = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/**
 * « Mes onglets » : les relations qui ont abouti. Le client a confirmé avoir conclu avec le
 * technicien (après un appel, un WhatsApp, un message ou une demande) ; chaque onglet garde les
 * étapes qui y ont mené et son reçu. Les recherches sans suite restent dans l'Historique.
 */
export function Onglets() {
  const { etat, go } = useApp();
  const [accords, setAccords] = useState<AccordApi[] | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!etat.auth) return;
    const arret = new AbortController();
    api.accords(arret.signal).then(setAccords, (e) => e?.name !== "AbortError" && setErreur(true));
    return () => arret.abort();
  }, [etat.auth]);

  return (
    <Page r="onglets" titre="Mes onglets" sousTitre="Vos dépannages conclus avec un technicien, et leurs reçus.">
      {!etat.auth && (
        <>
          <Vide icone="square-plus" titre="Connectez-vous pour voir vos onglets" texte="Chaque accord conclu avec un technicien y est gardé, avec son reçu." />
          <button onClick={() => go("connexion", { telDraft: "", apresConnexion: "onglets" })} className="sy-btn sy-btn--primary sy-btn--md" style={{ alignSelf: "center" }}>
            Se connecter
          </button>
        </>
      )}
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>Vos onglets n'ont pas pu être chargés.</p>}
      {accords && accords.length === 0 && (
        <Vide
          icone="square-plus"
          titre="Aucun onglet pour l'instant"
          texte="Quand vous concluez avec un technicien (appel, WhatsApp, message ou demande), confirmez-le : l'accord apparaîtra ici."
        />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: 12 }}>
        {accords?.map((a) => {
          const s = secteurDeCategorie(a.prestataire.categorie, a.prestation?.secteur);
          return (
            <button
              key={a.id}
              data-r="onglet"
              onClick={() => {
                accordOuvert = a.id;
                go("accord");
              }}
              style={{ ...CARTE, overflow: "hidden", padding: 0, display: "flex", textAlign: "left", font: "inherit", color: "inherit", cursor: "pointer" }}
            >
              {s?.image ? (
                <img src={s.image} alt="" style={{ display: "block", width: 96, flex: "none", objectFit: "cover" }} />
              ) : (
                <span style={{ display: "grid", placeItems: "center", width: 96, flex: "none", background: "var(--color-surface)", color: GRIS }}>
                  <Icon name={s?.icone ?? "wrench"} size={28} strokeWidth={1.75} />
                </span>
              )}
              <span style={{ flex: 1, minWidth: 0, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontWeight: 700, fontSize: "15.5px" }}>{a.objet}</span>
                <span style={{ fontSize: "13.5px", color: GRIS }}>
                  {a.prestataire.nom} · {a.canal_libelle}
                </span>
                <span style={{ fontSize: "13.5px" }}>
                  {a.montant_affichage ?? "Montant non indiqué"} · {jour(a.cree_le).toLowerCase()}
                </span>
                <span className={`sy-badge sy-badge--${a.statut === "termine" ? "success" : "info"}`} style={{ alignSelf: "flex-start", marginTop: 4 }}>
                  {a.statut_libelle}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Page>
  );
}

/** Détail d'un onglet : les étapes de la relation, les actions, et le reçu à télécharger. */
export function OngletAccord() {
  const { go } = useApp();
  const toast = useToast();
  const [a, setA] = useState<AccordApi | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!accordOuvert) return;
    const arret = new AbortController();
    api.accord(accordOuvert, arret.signal).then(setA, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e)));
    return () => arret.abort();
  }, []);

  if (!a) {
    return (
      <Page r="onglet-accord" titre="Onglet">
        <p role={erreur ? "alert" : "status"} style={{ margin: 0, color: erreur ? "var(--state-danger)" : GRIS }}>
          {erreur ?? (accordOuvert ? "Chargement…" : "Choisissez un onglet.")}
        </p>
        <button onClick={() => go("onglets")} className="sy-btn sy-btn--outline sy-btn--md" style={{ alignSelf: "flex-start" }}>
          Mes onglets
        </button>
      </Page>
    );
  }

  const terminer = async () => {
    try {
      setA(await api.terminerAccord(a.id));
      toast("Intervention terminée", "Votre reçu est à jour.");
    } catch (e) {
      toast("Action impossible", messageErreur(e), "danger");
    }
  };

  const lignes: [string, string][] = [
    ["Référence", a.reference],
    ["Travail", a.objet],
    ["Technicien", `${a.prestataire.nom} · ${a.prestataire.metier}${a.prestataire.quartier ? ` · ${a.prestataire.quartier}` : ""}`],
    ["Contact", a.canal_libelle],
    ["Montant convenu", a.montant_affichage ?? "Non indiqué"],
    ["Date de l'intervention", a.date_intervention ? dateLongue(a.date_intervention) : "Non indiquée"],
    ["Accord conclu le", dateLongue(a.cree_le)],
    ["Statut", a.statut_libelle],
    ...(a.demande_reference ? ([["Demande", a.demande_reference]] as [string, string][]) : []),
  ];

  return (
    <Page r="onglet-accord" titre={a.objet} sousTitre={`${a.prestataire.nom} · ${a.statut_libelle}`}>
      {/* À l'impression (« Télécharger le reçu »), seul le reçu est gardé. */}
      <style>{"@media print { body * { visibility: hidden !important; } [data-r='recu-accord'], [data-r='recu-accord'] * { visibility: visible !important; } [data-r='recu-accord'] { position: absolute; inset: 0 auto auto 0; width: 100%; border: 0 !important; } }"}</style>

      <section aria-label="Étapes" style={{ ...CARTE, padding: "14px 16px" }}>
        <h2 style={{ margin: "0 0 10px", fontSize: "16px" }}>Les étapes</h2>
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {a.etapes.map((e, i) => (
            <li key={i} style={{ display: "flex", gap: 12 }}>
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 14, flex: "none" }}>
                <span style={{ width: 10, height: 10, marginTop: 5, borderRadius: 999, background: "var(--secondary)" }} />
                {i < a.etapes.length - 1 && <span style={{ flex: 1, width: 2, background: "var(--color-divider)", margin: "3px 0" }} />}
              </span>
              <span style={{ paddingBottom: 12 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: "14.5px" }}>{e.libelle}</span>
                <span style={{ display: "block", fontSize: "13px", color: GRIS }}>
                  {jour(e.date)} · {heure(e.date)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button data-r="telecharger-recu" onClick={() => window.print()} className="sy-btn sy-btn--primary sy-btn--md" style={{ gap: 8 }}>
          <Icon name="download" size={17} />
          Télécharger le reçu
        </button>
        {a.statut === "conclu" && (
          <button onClick={terminer} className="sy-btn sy-btn--outline sy-btn--md">
            Intervention terminée
          </button>
        )}
        {a.prestataire.telephone && (
          <a href={`tel:+225${a.prestataire.telephone.replace(/\D/g, "")}`} className="sy-btn sy-btn--outline sy-btn--md" style={{ gap: 8 }}>
            <Icon name="phone" size={16} />
            Rappeler
          </a>
        )}
        <button onClick={() => go("fiche", { fiche: a.prestataire.id })} className="sy-btn sy-btn--ghost sy-btn--md">
          Voir la fiche
        </button>
      </div>

      <section data-r="recu-accord" aria-label="Reçu" style={{ ...CARTE, padding: "18px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <strong style={{ fontFamily: "var(--font-heading)", fontSize: "20px" }}>
            Terra<span style={{ color: "var(--color-accent)" }}>Click</span>
          </strong>
          <span style={{ fontSize: "13px", color: GRIS }}>Reçu d'intervention</span>
        </div>
        <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 14px", fontSize: "14.5px" }}>
          {lignes.map(([cle, valeur]) => (
            <Fragment key={cle}>
              <dt style={{ color: GRIS }}>{cle}</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>{valeur}</dd>
            </Fragment>
          ))}
        </dl>
        <p style={{ margin: "14px 0 0", fontSize: "12.5px", lineHeight: 1.5, color: GRIS }}>
          Le paiement est convenu directement entre le client et le technicien ; TerraClick ne perçoit pas ce montant. Ce reçu
          atteste l'accord confirmé par le client dans l'application.
        </p>
      </section>
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
      <BandeauInstallation sobre toujours style={{ borderRadius: 20, boxShadow: "none" }} />
    </Page>
  );
}
