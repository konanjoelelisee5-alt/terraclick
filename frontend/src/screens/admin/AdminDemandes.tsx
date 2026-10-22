import { useEffect, useState, type CSSProperties } from "react";
import { SECTEURS } from "../../data/catalogue";
import { api, messageErreur, type CandidatDemande, type DemandeAdmin, type PrestataireAdmin } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { peut } from "../../lib/acces";
import { useApp } from "../../state/app";
import { Dialogue } from "../../components/Dialogue";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspaceAdmin, Filtres, GRIS, Recherche, TITRE_CARTE, Vide, dateHeure } from "./EspaceAdmin";

/* Toutes les demandes et commandes, tous secteurs : filtrées par état, service, quartier,
   prestataire et date, cherchées par référence, client ou prestataire. Le détail montre la
   demande entière (description, photos, adresse, montant, urgence), son suivi et son historique
   complet ; l'équipe y attribue ou réattribue la demande, relance le prestataire, l'annule ou
   résout un litige. Chaque bouton n'apparaît qu'avec sa permission. */

const ETATS = [
  { cle: "", nom: "Toutes" },
  { cle: "en_attente", nom: "En attente" },
  { cle: "assignee", nom: "Assignées" },
  { cle: "acceptee", nom: "Acceptées" },
  { cle: "en_cours", nom: "En cours" },
  { cle: "terminee", nom: "Terminées" },
  { cle: "annulee", nom: "Annulées" },
];

const TON: Record<string, string> = { en_attente: "warning", assignee: "warning", acceptee: "info", en_cours: "info", terminee: "success", annulee: "neutral" };

const URGENCE: Record<string, string> = { maintenant: "Urgent : maintenant", aujourdhui: "Aujourd'hui", demain: "Demain" };

export function AdminDemandes() {
  const [etat, setEtat] = useState("");
  const [secteur, setSecteur] = useState("");
  const [quartier, setQuartier] = useState("");
  const [prestataire, setPrestataire] = useState("");
  const [du, setDu] = useState("");
  const [au, setAu] = useState("");
  const [q, setQ] = useState("");
  const [recherche, setRecherche] = useState("");
  const [page, setPage] = useState(1);
  const [resultat, setResultat] = useState<{ data: DemandeAdmin[]; meta: { page: number; derniere: number; total: number } } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouverte, setOuverte] = useState<DemandeAdmin | null>(null);
  const [version, setVersion] = useState(0);
  const { donnees: villes } = useApi(() => api.villes(), []);
  const [prestataires, setPrestataires] = useState<PrestataireAdmin[]>([]);

  useEffect(() => {
    const arret = new AbortController();
    api.admin.prestataires({ etat: "tous" }, arret.signal).then(setPrestataires, () => {});
    return () => arret.abort();
  }, []);

  // La recherche part un instant après la dernière frappe.
  useEffect(() => {
    const t = setTimeout(() => {
      setRecherche(q.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const arret = new AbortController();
    const filtres = {
      etat: etat || undefined,
      secteur: secteur || undefined,
      quartier: quartier ? Number(quartier) : undefined,
      prestataire: prestataire ? Number(prestataire) : undefined,
      du: du || undefined,
      au: au || undefined,
      q: recherche || undefined,
      page,
    };
    setErreur(null);
    api.admin.demandes(filtres, arret.signal).then(setResultat, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e)));
    return () => arret.abort();
  }, [etat, secteur, quartier, prestataire, du, au, recherche, page, version]);

  const ouvrir = async (d: DemandeAdmin) => {
    setOuverte(d);
    try {
      setOuverte(await api.admin.demande(d.id));
    } catch {
      /* le résumé de la liste suffit */
    }
  };

  if (ouverte)
    return (
      <DetailDemande
        d={ouverte}
        onMaj={setOuverte}
        onRetour={() => {
          setOuverte(null);
          setVersion((v) => v + 1);
        }}
      />
    );

  const champ: CSSProperties = { minHeight: 42, flex: "1 1 150px" };
  const filtre = <T,>(set: (v: T) => void) => (v: T) => (set(v), setPage(1));

  return (
    <EspaceAdmin titre="Demandes et commandes" sousTitre={resultat ? `${resultat.meta.total} au total avec ces filtres.` : undefined}>
      <div data-r="filtres-demandes" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Recherche valeur={q} onChange={setQ} placeholder="Référence, client ou prestataire" />
        <select className="sy-input" aria-label="Service" value={secteur} onChange={(e) => filtre(setSecteur)(e.target.value)} style={champ}>
          <option value="">Tous les services</option>
          {SECTEURS.map((s) => (
            <option key={s.cle} value={s.cle}>
              {s.nom}
            </option>
          ))}
        </select>
        <select className="sy-input" aria-label="Quartier" value={quartier} onChange={(e) => filtre(setQuartier)(e.target.value)} style={champ}>
          <option value="">Tous les quartiers</option>
          {(villes ?? []).flatMap((v) => v.quartiers).map((x) => (
            <option key={x.id} value={x.id}>
              {x.nom}
            </option>
          ))}
        </select>
        <select className="sy-input" aria-label="Prestataire" value={prestataire} onChange={(e) => filtre(setPrestataire)(e.target.value)} style={champ}>
          <option value="">Tous les prestataires</option>
          {prestataires.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", color: GRIS, flex: "1 1 150px" }}>
          Du
          <input className="sy-input" type="date" aria-label="Du" value={du} onChange={(e) => filtre(setDu)(e.target.value)} style={{ minHeight: 42 }} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", color: GRIS, flex: "1 1 150px" }}>
          Au
          <input className="sy-input" type="date" aria-label="Au" value={au} onChange={(e) => filtre(setAu)(e.target.value)} style={{ minHeight: 42 }} />
        </label>
      </div>
      <Filtres options={ETATS} valeur={etat} onChange={filtre(setEtat)} />
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}
      {resultat?.data.length === 0 && <Vide texte="Aucune demande avec ces filtres." />}

      {resultat && resultat.data.length > 0 && (
        <div className="sy-card" style={{ overflow: "hidden" }}>
          {resultat.data.map((d, i) => (
            <button
              key={d.id}
              data-r="demande-admin"
              onClick={() => ouvrir(d)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: 0, borderTop: i ? "1px solid var(--border-subtle)" : 0, background: "none", font: "inherit", color: "inherit", textAlign: "left", cursor: "pointer" }}
            >
              <span style={{ width: 38, height: 38, flex: "none", borderRadius: 999, background: "var(--argile-100)", display: "grid", placeItems: "center" }}>
                <Icon name={SECTEURS.find((s) => s.cle === d.secteur.cle)?.icone ?? "wrench"} size={18} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 700, fontSize: "14.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.resume}</span>
                <span style={{ display: "block", fontSize: "12.5px", color: GRIS, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {d.reference} · {d.client.nom ?? "Client"} → {d.prestataire?.nom ?? "—"} · {dateHeure(d.cree_le)}
                </span>
                {d.alertes.length > 0 && (
                  <span style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                    {d.alertes.map((a) => (
                      <span key={a} data-r="alerte-demande" className="sy-badge sy-badge--danger">
                        {a}
                      </span>
                    ))}
                  </span>
                )}
              </span>
              <span className={`sy-badge sy-badge--${TON[d.etat_equipe.cle] ?? "neutral"}`} style={{ flex: "none" }}>
                {d.commande?.etape_libelle ?? d.statut_libelle}
              </span>
            </button>
          ))}
        </div>
      )}

      {resultat && resultat.meta.derniere > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <button className="sy-btn sy-btn--outline sy-btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Précédentes
          </button>
          <span style={{ fontSize: "13.5px", color: GRIS }}>
            Page {resultat.meta.page} sur {resultat.meta.derniere}
          </span>
          <button className="sy-btn sy-btn--outline sy-btn--sm" disabled={page >= resultat.meta.derniere} onClick={() => setPage((p) => p + 1)}>
            Suivantes
          </button>
        </div>
      )}
    </EspaceAdmin>
  );
}

/* ---- Le détail d'une demande ---- */

type Fenetre = "attribuer" | "relancer" | "annuler" | "litige" | null;

function DetailDemande({ d, onRetour, onMaj }: { d: DemandeAdmin; onRetour: () => void; onMaj: (d: DemandeAdmin) => void }) {
  const { etat } = useApp();
  const toast = useToast();
  const [fenetre, setFenetre] = useState<Fenetre>(null);
  const [texte, setTexte] = useState("");
  const [candidats, setCandidats] = useState<CandidatDemande[] | null>(null);
  const [choisi, setChoisi] = useState<number | null>(null);
  const [issue, setIssue] = useState<"aucune" | "annuler" | "cloturer">("aucune");
  const [avertir, setAvertir] = useState(false);
  const gerer = peut(etat.auth, "demandes.gerer");
  const litiges = peut(etat.auth, "litiges.resoudre");
  const actions = d.actions ?? [];
  const suivi = d.commande?.suivi ?? d.suivi ?? [];

  const fermer = () => {
    setFenetre(null);
    setTexte("");
    setChoisi(null);
    setIssue("aucune");
    setAvertir(false);
  };

  const agir = async (action: () => Promise<DemandeAdmin>, titre: string) => {
    try {
      onMaj(await action());
      fermer();
      toast(titre, d.reference);
    } catch (e) {
      toast("Action impossible", messageErreur(e), "danger");
    }
  };

  const ouvrirAttribution = () => {
    setFenetre("attribuer");
    setCandidats(null);
    api.admin.candidatsDemande(d.id).then(setCandidats, (e) => toast("Liste indisponible", messageErreur(e), "danger"));
  };

  const confirmer = () => {
    if (fenetre === "attribuer") {
      if (!choisi) return toast("Aucun prestataire choisi", "Choisissez à qui confier la demande.", "danger");
      return agir(() => api.admin.attribuerDemande(d.id, choisi, texte.trim() || undefined), d.prestataire ? "Demande réattribuée" : "Demande attribuée");
    }
    if (fenetre === "relancer") return agir(() => api.admin.relancerDemande(d.id, texte.trim() || undefined), "Prestataire relancé");
    if (texte.trim().length < 5) return toast("Texte trop court", fenetre === "annuler" ? "Indiquez le motif : le client le lit." : "Écrivez la décision prise.", "danger");
    if (fenetre === "annuler") return agir(() => api.admin.annulerDemandeEquipe(d.id, texte.trim()), "Demande annulée");
    return agir(() => api.admin.resoudreLitige(d.id, texte.trim(), issue, avertir), "Litige résolu");
  };

  const urgence = d.quand === "date" ? (d.date_souhaitee ? `Le ${new Date(d.date_souhaitee).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}` : null) : URGENCE[d.quand];
  const lignes: [string, string | null | undefined][] = [
    ["Référence", d.reference],
    ["Service", d.secteur.nom],
    ["Problème", d.probleme],
    ["Description", d.precision],
    ["Urgence", urgence],
    ["Adresse", [d.commande?.adresse, d.quartier?.nom, d.repere].filter(Boolean).join(" · ")],
    ["Client", [d.client.nom, d.client.telephone].filter(Boolean).join(" · ")],
    ["Prestataire", d.prestataire_contact ? [d.prestataire_contact.nom, d.prestataire_contact.telephone].filter(Boolean).join(" · ") : d.prestataire ? d.prestataire.nom : "Aucun"],
    ["Montant", d.pack?.total_affichage ?? (d.estimation !== null ? `${d.estimation.toLocaleString("fr-FR")} F (estimation du prestataire)` : "Pas encore estimé")],
    ["Frais de déplacement", d.frais_deplacement ? `${d.frais_deplacement.toLocaleString("fr-FR")} F` : null],
    ["Créneau", d.creneau],
    ["Paiement", d.paiement_libelle],
    ["Statut", d.commande?.etape_libelle ?? d.statut_libelle],
    ["Créée le", dateHeure(d.cree_le)],
  ];

  const boutons: { cle: Fenetre; libelle: string; visible: boolean; danger?: boolean; ouvrir?: () => void }[] = [
    { cle: "attribuer", libelle: d.prestataire ? "Réattribuer" : "Attribuer", visible: gerer && actions.includes("attribuer"), ouvrir: ouvrirAttribution },
    { cle: "relancer", libelle: "Relancer le prestataire", visible: gerer && actions.includes("relancer") },
    { cle: "litige", libelle: "Résoudre un litige", visible: litiges && d.statut !== "annulee" },
    { cle: "annuler", libelle: "Annuler la demande", visible: gerer && actions.includes("annuler"), danger: true },
  ];

  return (
    <EspaceAdmin titre={d.reference ?? "Demande"}>
      <button onClick={onRetour} className="sy-btn sy-btn--ghost sy-btn--sm" style={{ alignSelf: "flex-start", gap: 6 }}>
        <Icon name="arrow-left" size={16} />
        Toutes les demandes
      </button>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span data-r="etat-demande" className={`sy-badge sy-badge--${TON[d.etat_equipe?.cle] ?? "neutral"}`}>
          {d.etat_equipe?.libelle}
        </span>
        {(d.alertes ?? []).map((a) => (
          <span key={a} className="sy-badge sy-badge--danger">
            {a}
          </span>
        ))}
        <span style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: "auto" }}>
          {boutons
            .filter((b) => b.visible)
            .map((b) => (
              <button
                key={b.cle}
                data-r={`action-${b.cle}`}
                onClick={b.ouvrir ?? (() => setFenetre(b.cle))}
                className={`sy-btn sy-btn--sm ${b.cle === "attribuer" ? "sy-btn--primary" : "sy-btn--outline"}`}
                style={b.danger ? { color: "var(--state-danger)", borderColor: "var(--state-danger)" } : undefined}
              >
                {b.libelle}
              </button>
            ))}
        </span>
      </div>

      <div data-r="detail-demande-admin" style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))" }}>
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 14px", fontSize: "14px" }}>
              {lignes
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} style={{ display: "contents" }}>
                    <dt style={{ color: GRIS }}>{k}</dt>
                    <dd style={{ margin: 0, fontWeight: 600, overflowWrap: "anywhere" }}>{v}</dd>
                  </div>
                ))}
            </dl>
            {d.photos.length > 0 && (
              <div data-r="photos-demande" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
                {d.photos.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="Photo jointe par le client" style={{ width: "100%", height: 96, objectFit: "cover", borderRadius: 10 }} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={TITRE_CARTE}>Suivi</h3>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {suivi.map((e) => (
                <li key={e.cle} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "14px", color: e.fait ? "var(--color-text)" : GRIS }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, flex: "none", background: e.fait ? "var(--state-success)" : "var(--argile-200, #DDD3C8)" }} />
                  <span style={{ flex: 1 }}>{e.libelle}</span>
                  {e.date && <span style={{ fontSize: "12.5px", color: GRIS }}>{dateHeure(e.date)}</span>}
                </li>
              ))}
            </ol>
            {d.pack && (
              <>
                <h3 style={{ ...TITRE_CARTE, marginTop: 8 }}>Articles</h3>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: "14px" }}>
                  {d.pack.articles.map((a) => (
                    <li key={a.cle}>
                      {a.quantite} × {a.nom}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      <section className="sy-card" aria-label="Historique">
        <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h3 style={TITRE_CARTE}>Historique des échanges et décisions</h3>
          <ol data-r="historique-demande" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {(d.historique ?? []).map((h, i) => (
              <li key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: i ? "1px solid var(--border-subtle)" : 0 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    marginTop: 6,
                    flex: "none",
                    borderRadius: 999,
                    background: h.type === "equipe" ? "var(--kola-500)" : h.type === "litige" ? "var(--state-danger)" : h.type === "technicien" ? "var(--lagune-500, #1F7A57)" : "var(--argile-500)",
                  }}
                />
                <span style={{ flex: 1, minWidth: 0, fontSize: "14px" }}>
                  <strong>{h.titre}</strong>
                  <span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>
                    {h.qui}
                    {h.date ? ` · ${dateHeure(h.date)}` : ""}
                  </span>
                  {h.texte && <span style={{ display: "block", marginTop: 2 }}>{h.texte}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {fenetre && (
        <Dialogue
          titre={
            fenetre === "attribuer"
              ? d.prestataire
                ? "Réattribuer la demande"
                : "Attribuer la demande"
              : fenetre === "relancer"
                ? `Relancer ${d.prestataire?.nom ?? "le prestataire"}`
                : fenetre === "annuler"
                  ? "Annuler la demande ?"
                  : "Résoudre le litige"
          }
          description={
            fenetre === "attribuer"
              ? "Le prestataire choisi reçoit la demande et le client est prévenu. Les plus proches et les mieux notés d'abord."
              : fenetre === "relancer"
                ? "Le prestataire voit votre message sur la demande, dans ses demandes reçues."
                : fenetre === "annuler"
                  ? "Le client et le prestataire voient la demande annulée, avec votre motif."
                  : "Votre décision clôt les signalements ouverts. Le client la lit dans ses notifications."
          }
          icone={fenetre === "attribuer" ? "users" : fenetre === "relancer" ? "bell" : fenetre === "annuler" ? "x" : "scale"}
          fond={fenetre === "annuler" ? "var(--state-danger-soft)" : "var(--kola-100)"}
          encre={fenetre === "annuler" ? "var(--state-danger)" : "var(--kola-700)"}
          confirmer={fenetre === "attribuer" ? "Confier la demande" : fenetre === "relancer" ? "Relancer" : fenetre === "annuler" ? "Annuler la demande" : "Enregistrer la décision"}
          annuler="Fermer"
          onFermer={fermer}
          onConfirmer={confirmer}
        >
          {fenetre === "attribuer" && (
            <div role="radiogroup" aria-label="Prestataires" data-r="candidats-demande" style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "40vh", overflowY: "auto", marginBottom: 8 }}>
              {candidats === null && <span style={{ color: GRIS, fontSize: "14px" }}>Chargement…</span>}
              {candidats?.length === 0 && <span style={{ color: GRIS, fontSize: "14px" }}>Aucun autre prestataire actif dans ce secteur.</span>}
              {candidats?.map((c) => (
                <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${choisi === c.id ? "var(--kola-500)" : "var(--border-subtle)"}` }}>
                  <input type="radio" name="candidat" checked={choisi === c.id} onChange={() => setChoisi(c.id)} style={{ accentColor: "var(--kola-500)" }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: "14px" }}>
                    <strong>{c.nom}</strong>
                    <span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>
                      {[c.metier, c.quartier, c.nombre_avis ? `${c.note.toLocaleString("fr-FR")} / 5` : "Pas encore noté", `${c.en_cours} en cours`].filter(Boolean).join(" · ")}
                      {c.compte ? "" : " · sans compte relié"}
                    </span>
                  </span>
                  {c.meme_quartier && <span className="sy-badge sy-badge--success">Même quartier</span>}
                </label>
              ))}
            </div>
          )}
          {fenetre === "litige" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8, fontSize: "14px" }}>
              {(
                [
                  ["aucune", "La demande suit son cours"],
                  ["annuler", "Annuler la demande"],
                  ...(d.cloturable ? [["cloturer", "Clôturer : l'intervention est réputée faite"]] : []),
                ] as ["aucune" | "annuler" | "cloturer", string][]
              ).map(([cle, nom]) => (
                <label key={cle} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="radio" name="issue" checked={issue === cle} onChange={() => setIssue(cle)} style={{ accentColor: "var(--kola-500)" }} />
                  {nom}
                </label>
              ))}
              {d.prestataire && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 4 }}>
                  <input type="checkbox" checked={avertir} onChange={(e) => setAvertir(e.target.checked)} style={{ accentColor: "var(--kola-500)" }} />
                  Avertir le prestataire (inscrit à son dossier)
                </label>
              )}
            </div>
          )}
          <textarea
            className="sy-textarea"
            aria-label={fenetre === "annuler" ? "Motif" : fenetre === "litige" ? "Décision" : "Message"}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder={fenetre === "annuler" ? "Motif de l'annulation" : fenetre === "litige" ? "La décision prise, après avoir entendu le client et le prestataire" : "Message (facultatif)"}
            style={{ borderRadius: 14 }}
          />
        </Dialogue>
      )}
    </EspaceAdmin>
  );
}
