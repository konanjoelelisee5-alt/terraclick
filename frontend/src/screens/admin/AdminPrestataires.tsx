import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { api, messageErreur, type DossierPrestataire, type PieceDossier, type PrestataireAdmin, type StatutPrestataire } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { peut } from "../../lib/acces";
import { useApp } from "../../state/app";
import { Dialogue } from "../../components/Dialogue";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspaceAdmin, Filtres, GRIS, Recherche, TITRE_CARTE, Vide, dateCourte, dateHeure } from "./EspaceAdmin";
import { Personne, Section, Stats, Statut, Tableau, chiffre } from "./Gabarit";
import { Piece } from "./AdminCandidatures";

/* Prestataires, tous secteurs confondus : la liste filtrée (secteur, quartier, statut, note),
   puis le dossier complet de chacun — identité, secteurs, pièces vérifiées une à une, photos,
   activité (missions, taux d'acceptation, retards, litiges), avis, signalements et sanctions.
   Les décisions : activer, suspendre (fiche masquée), bloquer (fiche masquée et espace
   prestataire fermé), avertir, attribuer les secteurs, vérifier ou refuser une pièce.
   Chaque bouton n'apparaît qu'avec sa permission ; le serveur la vérifie aussi. */

type Etat = "actifs" | "suspendus" | "bloques" | "tous";

const TON_STATUT: Record<StatutPrestataire, string> = { actif: "success", suspendu: "warning", bloque: "danger" };

export function AdminPrestataires() {
  const { go, etat } = useApp();
  const toast = useToast();
  const [etatFiltre, setEtatFiltre] = useState<Etat>("actifs");
  const [q, setQ] = useState("");
  const [secteur, setSecteur] = useState("");
  const [quartier, setQuartier] = useState("");
  const [noteMin, setNoteMin] = useState("");
  const [liste, setListe] = useState<PrestataireAdmin[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [suspendre, setSuspendre] = useState<PrestataireAdmin | null>(null);
  const [motif, setMotif] = useState("");
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [version, setVersion] = useState(0);
  const peutSuspendre = peut(etat.auth, "prestataires.suspendre");
  const peutMettreEnAvant = peut(etat.auth, "prestataires.mettre_en_avant");
  const { donnees: secteurs } = useApi(() => api.secteurs(), []);
  const { donnees: villes } = useApi(() => api.villes(), []);
  const quartiers = villes?.flatMap((v) => v.quartiers) ?? [];

  useEffect(() => {
    const arret = new AbortController();
    const filtres = { etat: etatFiltre, q: q.trim() || undefined, secteur: secteur || undefined, quartier: quartier ? Number(quartier) : undefined, note_min: noteMin ? Number(noteMin) : undefined };
    const t = setTimeout(() => api.admin.prestataires(filtres, arret.signal).then(setListe, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e))), 300);
    return () => {
      clearTimeout(t);
      arret.abort();
    };
  }, [etatFiltre, q, secteur, quartier, noteMin, version]);

  const modifier = async (p: PrestataireAdmin, patch: { actif?: boolean; en_vedette?: boolean; motif?: string }, titre: string) => {
    try {
      const maj = await api.admin.modifierPrestataire(p.id, patch);
      // Suspendu ou réactivé : il change de liste.
      setListe((l) => (patch.actif !== undefined && etatFiltre !== "tous" ? l?.filter((x) => x.id !== p.id) : l?.map((x) => (x.id === p.id ? maj : x))) ?? null);
      toast(titre, maj.nom);
    } catch (e) {
      toast("Action impossible", messageErreur(e), "danger");
    }
  };

  if (ouvert !== null) {
    return (
      <EspaceAdmin titre="Dossier prestataire">
        <DossierVue
          id={ouvert}
          onRetour={() => {
            setOuvert(null);
            setVersion((v) => v + 1);
          }}
        />
      </EspaceAdmin>
    );
  }

  const selecteur: CSSProperties = { minHeight: 42, flex: "1 1 160px" };

  return (
    <EspaceAdmin titre="Prestataires" sousTitre="Tous les prestataires, quel que soit leur secteur.">
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}
      <Stats
        items={[
          { libelle: "Prestataires", valeur: chiffre(liste?.length ?? 0), icone: "briefcase", detail: "Avec ces filtres" },
          { libelle: "Vérifiés", valeur: chiffre((liste ?? []).filter((p) => p.verifie).length), icone: "badge-check" },
          { libelle: "À la une", valeur: chiffre((liste ?? []).filter((p) => p.en_vedette).length), icone: "star" },
          {
            libelle: "Note moyenne",
            valeur: (() => {
              const notes = (liste ?? []).filter((p) => p.nombre_avis);
              return notes.length ? (notes.reduce((n, p) => n + p.note, 0) / notes.length).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : "—";
            })(),
            icone: "star",
            detail: "Des prestataires notés",
          },
        ]}
      />
      <Section
        titre="Tous les prestataires"
        actions={
          <Filtres
            options={[
              { cle: "actifs" as const, nom: "Actifs" },
              { cle: "suspendus" as const, nom: "Suspendus" },
              { cle: "bloques" as const, nom: "Bloqués" },
              { cle: "tous" as const, nom: "Tous" },
            ]}
            valeur={etatFiltre}
            onChange={setEtatFiltre}
          />
        }
      >
        <div data-r="filtres-prestataires" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <Recherche valeur={q} onChange={setQ} placeholder="Nom ou métier" />
          <select className="sy-input" aria-label="Secteur" value={secteur} onChange={(e) => setSecteur(e.target.value)} style={selecteur}>
            <option value="">Tous les secteurs</option>
            {secteurs?.map((s) => (
              <option key={s.cle} value={s.cle}>
                {s.nom}
              </option>
            ))}
          </select>
          <select className="sy-input" aria-label="Quartier" value={quartier} onChange={(e) => setQuartier(e.target.value)} style={selecteur}>
            <option value="">Tous les quartiers</option>
            {quartiers.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nom}
                {x.ville ? ` (${x.ville})` : ""}
              </option>
            ))}
          </select>
          <select className="sy-input" aria-label="Note minimale" value={noteMin} onChange={(e) => setNoteMin(e.target.value)} style={selecteur}>
            <option value="">Toutes les notes</option>
            {["4.5", "4", "3", "2"].map((n) => (
              <option key={n} value={n}>
                {Number(n).toLocaleString("fr-FR")} et plus
              </option>
            ))}
          </select>
        </div>
        <Tableau
          lignes={liste ?? []}
          cle={(p) => p.id}
          ligneR="prestataire-admin"
          vide={liste ? "Aucun prestataire ne correspond." : undefined}
          min={980}
          colonnes={[
            { titre: "Prestataire", rendu: (p) => <Personne nom={p.nom} detail={[p.metier, p.quartier].filter(Boolean).join(" · ")} /> },
            { titre: "Secteurs", rendu: (p) => <span style={{ fontSize: "13px" }}>{p.secteurs.join(", ") || "—"}</span> },
            {
              titre: "Note",
              rendu: (p) => (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                  <Icon name="star" size={13} />
                  {p.note.toLocaleString("fr-FR")} <span style={{ color: GRIS, fontSize: "12.5px" }}>({p.nombre_avis})</span>
                </span>
              ),
            },
            { titre: "Demandes", rendu: (p) => <span style={{ fontFamily: "var(--font-mono)" }}>{p.demandes}</span> },
            { titre: "Compte", rendu: (p) => <span style={{ fontSize: "13px", color: GRIS }}>{p.compte ? `Compte : ${p.compte.nom ?? p.compte.telephone}` : "Aucun compte relié"}</span> },
            {
              titre: "Statut",
              rendu: (p) => (
                <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.statut === "actif" ? <Statut ton="success">Actif</Statut> : <Statut ton={p.statut === "bloque" ? "danger" : "warning"}>{p.statut_libelle}</Statut>}
                  {p.en_vedette && <span className="sy-badge sy-badge--brand">À la une</span>}
                  {p.verifie && <span className="sy-badge sy-badge--info">Vérifié</span>}
                </span>
              ),
            },
            {
              titre: "Actions",
              droite: true,
              rendu: (p) => (
                <span style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                  <button data-r="ouvrir-dossier" onClick={() => setOuvert(p.id)} className="sy-btn sy-btn--outline sy-btn--sm" style={{ gap: 6 }}>
                    <Icon name="file-text" size={15} />
                    Dossier
                  </button>
                  {p.actif && (
                    <button onClick={() => go("fiche", { fiche: p.id })} className="sy-iconbtn sy-iconbtn--sm sy-iconbtn--outline" aria-label={`Voir la fiche de ${p.nom}`} title="Voir la fiche">
                      <Icon name="eye" size={15} />
                    </button>
                  )}
                  {p.actif && peutMettreEnAvant && (
                    <button
                      data-r="vedette"
                      onClick={() => modifier(p, { en_vedette: !p.en_vedette }, p.en_vedette ? "Retiré de la une" : "Mis en avant")}
                      className="sy-iconbtn sy-iconbtn--sm sy-iconbtn--outline"
                      aria-label={p.en_vedette ? "Retirer de la une" : "Mettre en avant"}
                      title={p.en_vedette ? "Retirer de la une" : "Mettre en avant"}
                      style={p.en_vedette ? { color: "var(--kola-600)", borderColor: "var(--kola-500)" } : undefined}
                    >
                      <Icon name="trending-up" size={15} />
                    </button>
                  )}
                  {!peutSuspendre || p.statut === "bloque" ? null : p.actif ? (
                    <button data-r="suspendre" onClick={() => setSuspendre(p)} className="sy-iconbtn sy-iconbtn--sm sy-iconbtn--outline" aria-label="Suspendre" title="Suspendre" style={{ color: "var(--state-danger)" }}>
                      <Icon name="lock" size={15} />
                    </button>
                  ) : (
                    <button data-r="reactiver" onClick={() => modifier(p, { actif: true }, "Prestataire réactivé")} className="sy-btn sy-btn--primary sy-btn--sm">
                      Réactiver
                    </button>
                  )}
                </span>
              ),
            },
          ]}
        />
      </Section>
      {suspendre && (
        <Dialogue
          titre={`Suspendre ${suspendre.nom} ?`}
          description="La fiche disparaît de l'annuaire et ne reçoit plus de demandes. Rien n'est supprimé : vous pourrez la réactiver."
          icone="alert-triangle"
          fond="var(--state-danger-soft)"
          encre="var(--state-danger)"
          confirmer="Suspendre"
          onFermer={() => setSuspendre(null)}
          onConfirmer={async () => {
            await modifier(suspendre, { actif: false, motif: motif.trim() || undefined }, "Prestataire suspendu");
            setSuspendre(null);
            setMotif("");
          }}
        >
          <textarea className="sy-textarea" aria-label="Motif de la suspension" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif (gardé dans son dossier)" style={{ borderRadius: 14 }} />
        </Dialogue>
      )}
    </EspaceAdmin>
  );
}

/* ---- Le dossier d'un prestataire ---- */

type Decision = { statut: StatutPrestataire; titre: string; texte: string; bouton: string } | { avertir: true } | { piece: PieceDossier };

function DossierVue({ id, onRetour }: { id: number; onRetour: () => void }) {
  const { etat } = useApp();
  const toast = useToast();
  const [d, setD] = useState<DossierPrestataire | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [motif, setMotif] = useState("");
  const [signalement, setSignalement] = useState("");
  const { donnees: secteurs } = useApi(() => api.secteurs(), []);
  const [choix, setChoix] = useState<string[] | null>(null);
  const droit = (p: string) => peut(etat.auth, p);

  useEffect(() => {
    const arret = new AbortController();
    api.admin.dossierPrestataire(id, arret.signal).then(setD, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e)));
    return () => arret.abort();
  }, [id]);

  if (erreur) return <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>;
  if (!d) return <Vide texte="Chargement du dossier…" />;

  const agir = async (action: () => Promise<DossierPrestataire>, titre: string) => {
    try {
      setD(await action());
      setDecision(null);
      setMotif("");
      setSignalement("");
      toast(titre, d.nom);
    } catch (e) {
      toast("Action impossible", messageErreur(e), "danger");
    }
  };

  const confirmer = async () => {
    if (!decision) return;
    if ("piece" in decision) {
      if (motif.trim().length < 5) return toast("Motif trop court", "Dites pourquoi la pièce est refusée.", "danger");
      try {
        const maj = await api.admin.verifierPiece(d.id, decision.piece.id, "refuse", motif.trim());
        setD({ ...d, documents: d.documents.map((x) => (x.id === maj.id ? maj : x)) });
        setDecision(null);
        setMotif("");
        toast("Pièce refusée", maj.libelle);
      } catch (e) {
        toast("Action impossible", messageErreur(e), "danger");
      }
      return;
    }
    if (motif.trim().length < 5) return toast("Motif trop court", "Le motif reste dans le dossier : soyez précis.", "danger");
    if ("avertir" in decision) {
      return agir(() => api.admin.avertirPrestataire(d.id, motif.trim(), signalement ? Number(signalement) : undefined), "Avertissement inscrit");
    }
    return agir(() => api.admin.statutPrestataire(d.id, decision.statut, motif.trim()), decision.titre);
  };

  const verifier = async (piece: PieceDossier) => {
    try {
      const maj = await api.admin.verifierPiece(d.id, piece.id, "verifie");
      setD({ ...d, documents: d.documents.map((x) => (x.id === maj.id ? maj : x)) });
      toast("Pièce vérifiée", maj.libelle);
    } catch (e) {
      toast("Action impossible", messageErreur(e), "danger");
    }
  };

  const bloque = d.statut === "bloque";
  const peutStatut = (cible: StatutPrestataire) => (cible === "bloque" || bloque ? droit("prestataires.bloquer") : droit("prestataires.suspendre"));
  const decisions: Extract<Decision, { statut: StatutPrestataire }>[] = [
    { statut: "actif" as const, titre: bloque ? "Prestataire débloqué" : "Prestataire réactivé", texte: "La fiche réapparaît dans l'annuaire et reçoit de nouveau des demandes.", bouton: bloque ? "Débloquer" : "Réactiver" },
    { statut: "suspendu" as const, titre: "Prestataire suspendu", texte: "La fiche disparaît de l'annuaire et ne reçoit plus de demandes. Il garde l'accès à ses demandes en cours.", bouton: "Suspendre" },
    { statut: "bloque" as const, titre: "Prestataire bloqué", texte: "La fiche disparaît de l'annuaire et son espace prestataire se ferme. Réservé aux fautes graves.", bouton: "Bloquer" },
  ].filter((x) => x.statut !== d.statut && peutStatut(x.statut));
  const secteursChoisis = choix ?? d.secteurs;
  const lignes: [string, ReactNode][] = [
    ["Téléphone", d.telephone],
    ["Compte", d.compte ? `${d.compte.nom ?? ""} · ${d.compte.telephone}` : "Aucun compte relié"],
    ["Quartier", d.quartier],
    ["Zone d'intervention", d.zone],
    ["Expérience", d.experience_annees !== null ? `${d.experience_annees} an${d.experience_annees > 1 ? "s" : ""}` : null],
    ["Catégories", d.categories.join(", ")],
    ["Inscrit le", d.inscrit_le ? dateCourte(d.inscrit_le) : null],
    ["Candidature", d.candidature ? `${d.candidature.reference} · ${d.candidature.type.nom} · ${d.candidature.statut_libelle}` : null],
    ["Horaires", d.candidature?.horaires],
    ["Prix annoncés", d.candidature?.prix],
    ["Paiements", d.candidature?.paiements.join(", ")],
  ];
  const a = d.activite;
  const tuiles: [string, string, string?][] = [
    ["Missions", String(a.missions), `${a.reussies} réussie${a.reussies > 1 ? "s" : ""}, ${a.annulees} annulée${a.annulees > 1 ? "s" : ""}`],
    ["Taux d'acceptation", a.taux_acceptation === null ? "—" : `${a.taux_acceptation} %`, `${a.acceptees} acceptée${a.acceptees > 1 ? "s" : ""}, ${a.refusees} refusée${a.refusees > 1 ? "s" : ""}`],
    ["Sans réponse", String(a.sans_reponse), "Demandes envoyées depuis plus de 2 h"],
    ["Retards signalés", String(a.retards)],
    ["Litiges", String(a.litiges), `${a.litiges_ouverts} ouvert${a.litiges_ouverts > 1 ? "s" : ""}`],
    ["Note", d.nombre_avis ? `${d.note.toLocaleString("fr-FR")} / 5` : "—", `${d.nombre_avis} avis`],
  ];

  return (
    <section data-r="dossier-prestataire" aria-label={d.nom} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <button onClick={onRetour} className="sy-btn sy-btn--ghost sy-btn--sm" style={{ alignSelf: "flex-start", gap: 6 }}>
        <Icon name="arrow-left" size={16} />
        Tous les prestataires
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2 style={{ margin: 0, fontSize: "24px" }}>{d.nom}</h2>
          <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 4, fontSize: "14px", color: GRIS }}>
            {d.metier}
            <span data-r="statut-prestataire" className={`sy-badge sy-badge--${TON_STATUT[d.statut]}`}>
              {d.statut_libelle}
            </span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {decisions.map((x) => (
            <button
              key={x.statut}
              data-r={`statut-${x.statut}`}
              onClick={() => setDecision(x)}
              className={`sy-btn sy-btn--sm ${x.statut === "actif" ? "sy-btn--primary" : "sy-btn--outline"}`}
              style={x.statut === "actif" ? undefined : { color: "var(--state-danger)", borderColor: "var(--state-danger)" }}
            >
              {x.bouton}
            </button>
          ))}
          {droit("prestataires.sanctionner") && (
            <button data-r="avertir" onClick={() => setDecision({ avertir: true })} className="sy-btn sy-btn--outline sy-btn--sm" style={{ gap: 6 }}>
              <Icon name="flag" size={15} />
              Avertir
            </button>
          )}
        </div>
      </div>

      {d.statut !== "actif" && d.statut_motif && (
        <p style={{ margin: 0, padding: "12px 16px", borderRadius: 14, background: "var(--state-danger-soft)", fontSize: "14.5px" }}>
          <strong>{d.statut_libelle}{d.statut_le ? ` le ${dateCourte(d.statut_le)}` : ""} :</strong> {d.statut_motif}
        </p>
      )}

      <Bloc titre="Activité">
        <div data-r="activite-prestataire" style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 160px), 1fr))" }}>
          {tuiles.map(([libelle, valeur, detail]) => (
            <span key={libelle} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--surface-sunken)" }}>
              <span style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "19px" }}>{valeur}</span>
              <span style={{ display: "block", fontSize: "12.5px", fontWeight: 600 }}>{libelle}</span>
              {detail && <span style={{ display: "block", fontSize: "11.5px", color: GRIS }}>{detail}</span>}
            </span>
          ))}
        </div>
      </Bloc>

      <Bloc titre="Identité">
        {d.description && <p style={{ margin: 0, fontSize: "14.5px", lineHeight: 1.5 }}>{d.description}</p>}
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
      </Bloc>

      <ZonesPrestataire d={d} modifiable={droit("prestataires.modifier")} onMaj={(zones) => setD({ ...d, zones })} />

      <Bloc titre="Secteurs">
        <div data-r="secteurs-prestataire" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(secteurs ?? []).map((s) => {
            const actif = secteursChoisis.includes(s.cle);
            return droit("prestataires.modifier") ? (
              <button key={s.cle} type="button" aria-pressed={actif} onClick={() => setChoix(actif ? secteursChoisis.filter((x) => x !== s.cle) : [...secteursChoisis, s.cle])} className={`sy-tag${actif ? " sy-tag--selected" : ""}`}>
                {s.nom}
              </button>
            ) : actif ? (
              <span key={s.cle} className="sy-tag sy-tag--selected">
                {s.nom}
              </span>
            ) : null;
          })}
        </div>
        {choix && (
          <button
            data-r="enregistrer-secteurs"
            onClick={() => agir(() => api.admin.secteursPrestataire(d.id, choix), "Secteurs enregistrés").then(() => setChoix(null))}
            disabled={!choix.length}
            className="sy-btn sy-btn--primary sy-btn--sm"
            style={{ alignSelf: "flex-start" }}
          >
            Enregistrer les secteurs
          </button>
        )}
      </Bloc>

      <Bloc titre={`Documents (${d.documents.filter((x) => x.statut === "verifie").length} vérifié${d.documents.filter((x) => x.statut === "verifie").length > 1 ? "s" : ""} sur ${d.documents.length})`}>
        {!d.documents.length && <p style={{ margin: 0, fontSize: "14px", color: GRIS }}>Aucune pièce dans ce dossier.</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
          {d.documents.map((piece) => (
            <div key={piece.id} data-r="piece-prestataire" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {piece.url ? (
                <Piece d={piece} />
              ) : (
                <span style={{ padding: "12px", borderRadius: 14, border: "1px solid var(--border-subtle)", fontSize: "13px", fontWeight: 600 }}>
                  {piece.libelle}
                  <span style={{ display: "block", fontWeight: 400, color: GRIS }}>Fichier non joint</span>
                </span>
              )}
              <span className={`sy-badge sy-badge--${piece.statut === "verifie" ? "success" : piece.statut === "refuse" ? "danger" : "warning"}`} style={{ alignSelf: "flex-start" }}>
                {piece.statut === "verifie" ? "Vérifiée" : piece.statut === "refuse" ? "Refusée" : "À vérifier"}
              </span>
              {piece.motif && <span style={{ fontSize: "12.5px", color: GRIS }}>{piece.motif}</span>}
              {droit("prestataires.modifier") && (
                <span style={{ display: "flex", gap: 6 }}>
                  {piece.statut !== "verifie" && (
                    <button data-r="verifier-piece" onClick={() => verifier(piece)} className="sy-btn sy-btn--outline sy-btn--sm">
                      Vérifier
                    </button>
                  )}
                  {piece.statut !== "refuse" && (
                    <button data-r="refuser-piece" onClick={() => setDecision({ piece })} className="sy-btn sy-btn--ghost sy-btn--sm" style={{ color: "var(--state-danger)" }}>
                      Refuser
                    </button>
                  )}
                </span>
              )}
            </div>
          ))}
        </div>
      </Bloc>

      {d.photos.length > 0 && (
        <Bloc titre="Photos des réalisations">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {d.photos.map((ph) => (
              <figure key={ph.image} style={{ margin: 0 }}>
                <img src={ph.image} alt={ph.legende} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 12 }} />
                <figcaption style={{ fontSize: "12.5px", color: GRIS, marginTop: 4 }}>{ph.legende}</figcaption>
              </figure>
            ))}
          </div>
        </Bloc>
      )}

      <Bloc titre={`Avis des clients (${d.avis.length})`}>
        {!d.avis.length && <p style={{ margin: 0, fontSize: "14px", color: GRIS }}>Aucun avis pour l'instant.</p>}
        {d.avis.map((x) => (
          <div key={x.id} data-r="avis-admin" style={{ padding: "10px 0", borderTop: "1px solid var(--border-subtle)", fontSize: "14px" }}>
            <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <strong>{x.note.toLocaleString("fr-FR")} / 5</strong>
              <span style={{ color: GRIS, fontSize: "12.5px" }}>
                Ponctualité {x.ponctualite} · Qualité {x.qualite} · Prix {x.prix} · {x.auteur ?? "Client"}
                {x.date ? ` · ${dateCourte(x.date)}` : ""}
              </span>
            </span>
            {x.commentaire && <span style={{ display: "block", marginTop: 4 }}>{x.commentaire}</span>}
          </div>
        ))}
      </Bloc>

      <Bloc titre={`Signalements des clients (${d.signalements.length})`}>
        {!d.signalements.length && <p style={{ margin: 0, fontSize: "14px", color: GRIS }}>Aucun signalement.</p>}
        {d.signalements.map((s) => (
          <div key={s.id} data-r="signalement-prestataire" style={{ padding: "10px 0", borderTop: "1px solid var(--border-subtle)", fontSize: "14px" }}>
            <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <strong>{s.motif_libelle}</strong>
              <span className={`sy-badge sy-badge--${s.statut === "ouvert" ? "warning" : "neutral"}`}>{s.statut === "ouvert" ? "Ouvert" : "Traité"}</span>
              <span style={{ color: GRIS, fontSize: "12.5px" }}>
                {[s.demande, s.auteur, s.date ? dateHeure(s.date) : null].filter(Boolean).join(" · ")}
              </span>
            </span>
            {s.message && <span style={{ display: "block", marginTop: 4 }}>{s.message}</span>}
          </div>
        ))}
      </Bloc>

      <Bloc titre={`Sanctions et décisions (${d.sanctions.length})`}>
        {!d.sanctions.length && <p style={{ margin: 0, fontSize: "14px", color: GRIS }}>Aucune sanction.</p>}
        {d.sanctions.map((s) => (
          <div key={s.id} data-r="sanction" style={{ padding: "10px 0", borderTop: "1px solid var(--border-subtle)", fontSize: "14px" }}>
            <strong>{s.type_libelle}</strong>
            <span style={{ color: GRIS, fontSize: "12.5px" }}>
              {" "}
              · {[s.par, s.date ? dateHeure(s.date) : null].filter(Boolean).join(" · ")}
            </span>
            <span style={{ display: "block", marginTop: 4 }}>{s.motif}</span>
          </div>
        ))}
      </Bloc>

      {decision && (
        <Dialogue
          titre={"piece" in decision ? `Refuser « ${decision.piece.libelle} » ?` : "avertir" in decision ? `Avertir ${d.nom}` : `${decision.bouton} ${d.nom} ?`}
          description={
            "piece" in decision
              ? "La pièce passe en « Refusée » ; le badge « Vérifié » tombe tant qu'elle n'est pas remplacée."
              : "avertir" in decision
                ? "L'avertissement est inscrit à son dossier. La fiche reste visible."
                : decision.texte
          }
          icone={"piece" in decision ? "file-text" : "avertir" in decision ? "flag" : decision.statut === "actif" ? "badge-check" : "alert-triangle"}
          fond={"statut" in decision && decision.statut === "actif" ? "var(--state-success-soft)" : "var(--state-danger-soft)"}
          encre={"statut" in decision && decision.statut === "actif" ? "var(--state-success)" : "var(--state-danger)"}
          confirmer={"piece" in decision ? "Refuser la pièce" : "avertir" in decision ? "Inscrire l'avertissement" : decision.bouton}
          onFermer={() => {
            setDecision(null);
            setMotif("");
          }}
          onConfirmer={confirmer}
        >
          {"avertir" in decision && d.signalements.length > 0 && (
            <select className="sy-input" aria-label="Signalement concerné" value={signalement} onChange={(e) => setSignalement(e.target.value)} style={{ marginBottom: 8 }}>
              <option value="">Sans signalement précis</option>
              {d.signalements.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.motif_libelle} · {s.demande}
                </option>
              ))}
            </select>
          )}
          <textarea className="sy-textarea" aria-label="Motif" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif (gardé dans son dossier)" style={{ borderRadius: 14 }} />
        </Dialogue>
      )}
    </section>
  );
}

/** Zones d'intervention : les quartiers où il se déplace, en plus du sien. */
function ZonesPrestataire({ d, modifiable, onMaj }: { d: DossierPrestataire; modifiable: boolean; onMaj: (zones: DossierPrestataire["zones"]) => void }) {
  const toast = useToast();
  const { donnees: villes } = useApi(() => api.villes(), []);
  const [choix, setChoix] = useState<number[] | null>(null);
  const ids = choix ?? d.zones.map((z) => z.id);

  const enregistrer = async () => {
    try {
      onMaj(await api.admin.zonesPrestataire(d.id, ids));
      setChoix(null);
      toast("Zones enregistrées", d.nom);
    } catch (e) {
      toast("Zones non enregistrées", messageErreur(e), "danger");
    }
  };

  return (
    <Bloc titre={`Zones d'intervention (${ids.length})`}>
      {!modifiable && !d.zones.length && <p style={{ margin: 0, fontSize: "14px", color: GRIS }}>Seulement son quartier{d.quartier ? ` : ${d.quartier}` : ""}.</p>}
      {(villes ?? [])
        .filter((v) => v.quartiers.length)
        .map((v) => (
          <div key={v.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(villes?.length ?? 0) > 1 && <span style={{ fontSize: "12.5px", fontWeight: 700, color: GRIS }}>{v.nom}</span>}
            <div data-r="zones-prestataire" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {v.quartiers.map((q) => {
                const actif = ids.includes(q.id);
                return modifiable ? (
                  <button key={q.id} type="button" aria-pressed={actif} onClick={() => setChoix(actif ? ids.filter((x) => x !== q.id) : [...ids, q.id])} className={`sy-tag${actif ? " sy-tag--selected" : ""}`}>
                    {q.nom}
                  </button>
                ) : actif ? (
                  <span key={q.id} className="sy-tag sy-tag--selected">
                    {q.nom}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        ))}
      {choix && (
        <button data-r="enregistrer-zones" onClick={enregistrer} className="sy-btn sy-btn--primary sy-btn--sm" style={{ alignSelf: "flex-start" }}>
          Enregistrer les zones
        </button>
      )}
    </Bloc>
  );
}

function Bloc({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="sy-card" aria-label={titre}>
      <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h3 style={TITRE_CARTE}>{titre}</h3>
        {children}
      </div>
    </section>
  );
}
