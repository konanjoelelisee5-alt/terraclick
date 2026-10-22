import { useEffect, useMemo, useState } from "react";
import { api, ErreurApi, messageErreur, type CandidatureApi, type TypePrestataire } from "../../lib/api";
import { slugifier } from "../../lib/annuaire";
import { useApi } from "../../lib/useApi";
import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { CARTE } from "../../components/ui";
import { AIDE, CadreParcours, Choix, TITRE_ETAPE } from "../besoin/commun";

/* « Devenir prestataire » : le dossier envoyé à l'équipe TerraClick pour vérification, en cinq
   étapes — le type (artisan, entreprise, pressing), l'identité du responsable, l'activité, ce
   qui est propre au type, puis le récapitulatif et l'envoi. Les pièces demandées viennent de
   l'API (config/candidature.php). Un dossier déjà envoyé affiche son statut ; refusé, il se
   corrige et se renvoie. */

const GRIS = "#5C5248";

type Valeur = string | boolean | number[] | string[];

type Champs = {
  nom_activite: string;
  responsable: string;
  secteurs: string[];
  quartier_id: number | null;
  quartiers: number[];
  description: string;
  experience_annees: string;
  horaires: string;
  prix: string;
  paiements: string[];
};

const VIDE: Champs = {
  nom_activite: "",
  responsable: "",
  secteurs: [],
  quartier_id: null,
  quartiers: [],
  description: "",
  experience_annees: "",
  horaires: "",
  prix: "",
  paiements: ["especes", "mobile_money"],
};

const TITRES = ["Quel prestataire êtes-vous ?", "Qui êtes-vous ?", "Votre activité", "", "Vérifiez et envoyez"];
const TITRES_TYPE: Record<TypePrestataire, string> = { artisan: "Vos références", entreprise: "Votre entreprise", pressing: "Votre pressing" };

const SOUS_TITRE: React.CSSProperties = { fontSize: "17px", margin: "24px 0 10px" };

function bascule<T>(liste: T[], valeur: T): T[] {
  return liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur];
}

/** Pastille à cocher (services, quartiers, paiements). */
function Pastille({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={actif}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minHeight: 44,
        padding: "0 14px",
        borderRadius: 999,
        border: `1.5px solid ${actif ? "var(--color-text)" : "var(--color-divider)"}`,
        background: actif ? "var(--color-text)" : "var(--color-neutral-100)",
        color: actif ? "var(--color-neutral-100)" : "var(--color-text)",
        font: "inherit",
        fontSize: "14.5px",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {actif && <Icon name="check" size={15} strokeWidth={2.5} />}
      {children}
    </button>
  );
}

function Champ(props: { id: string; libelle: string; aide?: string; children: React.ReactNode }) {
  return (
    <div className="sy-field" style={{ marginTop: 14 }}>
      <label className="sy-field__label" htmlFor={props.id}>
        {props.libelle}
      </label>
      {props.children}
      {props.aide && <span className="sy-field__hint">{props.aide}</span>}
    </div>
  );
}

/** Une pièce à joindre : photo ou PDF, avec aperçu, obligatoire ou facultative. */
function ChampFichier({ piece, fichier, onChange }: { piece: { cle: string; nom: string; obligatoire: boolean; aide: string | null }; fichier?: File; onChange: (f: File | null) => void }) {
  const apercu = useMemo(() => (fichier && fichier.type.startsWith("image/") ? URL.createObjectURL(fichier) : null), [fichier]);
  useEffect(() => () => void (apercu && URL.revokeObjectURL(apercu)), [apercu]);

  return (
    <div data-r="piece" data-piece={piece.cle} style={{ ...CARTE, padding: 12, display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
      <span style={{ width: 56, height: 56, flex: "none", borderRadius: 14, overflow: "hidden", background: fichier ? "var(--state-success-soft)" : "var(--color-surface)", display: "grid", placeItems: "center", color: fichier ? "var(--state-success)" : GRIS }}>
        {apercu ? <img src={apercu} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon name={fichier ? "file-text" : "camera"} size={24} />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontWeight: 600, fontSize: "14.5px" }}>
          {piece.nom}
          <span className={`sy-badge sy-badge--${piece.obligatoire ? "brand" : "neutral"}`}>{piece.obligatoire ? "Obligatoire" : "Facultatif"}</span>
        </span>
        <span style={{ display: "block", fontSize: "13px", color: GRIS, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {fichier ? fichier.name : (piece.aide ?? "Photo ou PDF, 5 Mo au plus.")}
        </span>
      </span>
      {fichier && (
        <button type="button" onClick={() => onChange(null)} aria-label={`Retirer : ${piece.nom}`} className="sy-btn sy-btn--ghost sy-btn--sm" style={{ flex: "none" }}>
          <Icon name="x" size={16} />
        </button>
      )}
      <label className="sy-btn sy-btn--outline sy-btn--sm" style={{ flex: "none", cursor: "pointer" }}>
        {fichier ? "Changer" : "Ajouter"}
        <input
          type="file"
          accept="image/*,application/pdf"
          aria-label={piece.nom}
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onChange(f);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

export function DevenirPrestataire() {
  const { etat, go, ville } = useApp();
  const { donnees: exigences } = useApi(() => api.exigencesCandidature(), []);
  const { donnees: villes } = useApi(() => api.villes(), []);
  const quartiers = useMemo(
    () => [...(villes?.find((v) => v.slug === slugifier(ville))?.quartiers ?? [])].sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    [villes, ville],
  );

  // Dossier déjà envoyé : son statut ; `null` = aucun ; `undefined` = en chargement.
  const [candidature, setCandidature] = useState<CandidatureApi | null | undefined>(undefined);
  const [corriger, setCorriger] = useState(false);
  const [etape, setEtape] = useState(0);
  const [type, setType] = useState<TypePrestataire | null>(null);
  const [champs, setChamps] = useState<Champs>({ ...VIDE, responsable: etat.auth?.prenom ?? "" });
  const [details, setDetails] = useState<Record<string, Valeur>>({});
  const [fichiers, setFichiers] = useState<Record<string, File>>({});
  const [engagement, setEngagement] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreurs, setErreurs] = useState<string[]>([]);

  useEffect(() => {
    if (!etat.auth) {
      setCandidature(null);
      return;
    }
    const arret = new AbortController();
    api.maCandidature(arret.signal).then(setCandidature, () => setCandidature(null));
    return () => arret.abort();
  }, [etat.auth]);

  const modifier = (patch: Partial<Champs>) => setChamps((c) => ({ ...c, ...patch }));
  const detail = (cle: string, valeur: Valeur) => setDetails((d) => ({ ...d, [cle]: valeur }));
  const texte = (cle: string) => (details[cle] as string | undefined) ?? "";
  const pieces = type && exigences ? exigences.documents[type] : [];
  const piecesIdentite = pieces.filter((p) => ["photo_visage", "piece_recto", "piece_verso"].includes(p.cle));
  const piecesType = pieces.filter((p) => !piecesIdentite.includes(p));
  const manquantes = (liste: typeof pieces) => liste.filter((p) => p.obligatoire && !fichiers[p.cle]);

  const aller = (n: number) => {
    setEtape(n);
    window.scrollTo(0, 0);
  };

  // Ce qui manque pour passer à l'étape suivante, dit plutôt qu'un bouton grisé muet.
  const manque =
    etape === 0
      ? !type && "Choisissez votre type de prestataire."
      : etape === 1
        ? (champs.responsable.trim().length < 3 && "Indiquez le nom du responsable.") ||
          (champs.nom_activite.trim().length < 2 && "Indiquez le nom de votre activité.") ||
          (manquantes(piecesIdentite).length > 0 && `Ajoutez : ${manquantes(piecesIdentite)[0].nom.toLowerCase()}.`)
        : etape === 2
          ? (type !== "pressing" && !champs.secteurs.length && "Choisissez au moins un service.") ||
            (type === "pressing" && !(details.services as string[] | undefined)?.length && "Choisissez au moins un service de pressing.") ||
            (!champs.quartier_id && "Indiquez votre quartier.") ||
            (!champs.quartiers.length && "Choisissez au moins un quartier d'intervention.") ||
            (champs.description.trim().length < 20 && "Décrivez votre activité en une ou deux phrases.") ||
            (!champs.horaires.trim() && "Indiquez vos horaires.") ||
            (!champs.paiements.length && "Choisissez au moins un moyen de paiement.")
          : etape === 3
            ? (type === "artisan" && ((texte("reference_nom").trim().length < 3 && "Indiquez une personne de référence.") || (texte("reference_telephone").replace(/\D/g, "").length < 8 && "Indiquez le numéro de votre référence."))) ||
              (type === "entreprise" &&
                ((!texte("rccm").trim() && "Indiquez le numéro RCCM.") ||
                  (!texte("ncc").trim() && "Indiquez le numéro de compte contribuable.") ||
                  (!texte("adresse_siege").trim() && "Indiquez l'adresse du siège.") ||
                  (!Number(texte("nombre_techniciens")) && "Indiquez le nombre de techniciens."))) ||
              (type === "pressing" &&
                ((!texte("adresse_local").trim() && "Indiquez l'adresse du pressing.") ||
                  (!texte("delai").trim() && "Indiquez votre délai habituel.") ||
                  (details.collecte === undefined && "Dites si vous collectez à domicile.") ||
                  (details.collecte === true && !(details.quartiers_collecte as number[] | undefined)?.length && "Choisissez les quartiers où vous collectez."))) ||
              (manquantes(piecesType).length > 0 && `Ajoutez : ${manquantes(piecesType)[0].nom.toLowerCase()}.`)
            : !engagement && "Confirmez que les informations sont exactes.";

  const envoyer = async () => {
    if (!type) return;
    setEnvoi(true);
    setErreurs([]);
    const f = new FormData();
    f.append("type", type);
    f.append("nom_activite", champs.nom_activite.trim());
    f.append("responsable", champs.responsable.trim());
    if (type !== "pressing") champs.secteurs.forEach((s) => f.append("secteurs[]", s));
    f.append("quartier_id", String(champs.quartier_id));
    champs.quartiers.forEach((q) => f.append("quartiers[]", String(q)));
    f.append("description", champs.description.trim());
    if (champs.experience_annees) f.append("experience_annees", champs.experience_annees);
    f.append("horaires", champs.horaires.trim());
    if (champs.prix.trim()) f.append("prix", champs.prix.trim());
    champs.paiements.forEach((p) => f.append("paiements[]", p));
    f.append("engagement", "1");
    for (const [cle, valeur] of Object.entries(details)) {
      if (Array.isArray(valeur)) valeur.forEach((v) => f.append(`details[${cle}][]`, String(v)));
      else if (typeof valeur === "boolean") f.append(`details[${cle}]`, valeur ? "1" : "0");
      else if (valeur !== "") f.append(`details[${cle}]`, valeur);
    }
    for (const [cle, fichier] of Object.entries(fichiers)) f.append(`documents[${cle}]`, fichier);

    try {
      setCandidature(await api.envoyerCandidature(f));
      setCorriger(false);
      window.scrollTo(0, 0);
    } catch (e) {
      setErreurs(e instanceof ErreurApi && Object.keys(e.champs).length ? Object.values(e.champs).flat() : [messageErreur(e)]);
    } finally {
      setEnvoi(false);
    }
  };

  /* ---- Sans compte ---- */
  if (!etat.auth) {
    return (
      <CadreParcours retour={() => go("parametres")}>
        <h1 style={TITRE_ETAPE}>Devenir prestataire</h1>
        <p style={AIDE}>Connectez-vous pour envoyer votre dossier : il est relié à votre numéro.</p>
        <button onClick={() => go("connexion", { telDraft: "", apresConnexion: "devenirPrestataire" })} className="sy-btn sy-btn--primary sy-btn--md">
          Se connecter
        </button>
      </CadreParcours>
    );
  }

  /* ---- Dossier déjà envoyé : son statut ---- */
  if (candidature === undefined) {
    return (
      <CadreParcours retour={() => go("parametres")}>
        <p role="status" style={AIDE}>
          Chargement…
        </p>
      </CadreParcours>
    );
  }
  if (candidature && !corriger) return <StatutCandidature c={candidature} onCorriger={() => {
    // Refusé : le formulaire reprend le type et les textes, les pièces sont à renvoyer.
    setType(candidature.type.cle);
    setChamps((c) => ({ ...c, nom_activite: candidature.nom_activite, responsable: candidature.responsable, description: candidature.description, horaires: candidature.horaires ?? "", prix: candidature.prix ?? "", experience_annees: candidature.experience_annees?.toString() ?? "" }));
    setCorriger(true);
    aller(0);
  }} />;

  const titre = etape === 3 && type ? TITRES_TYPE[type] : TITRES[etape];

  return (
    <CadreParcours
      retour={() => (etape === 0 ? go("parametres") : aller(etape - 1))}
      etape={`Devenir prestataire · Étape ${etape + 1} sur 5`}
      progression={(etape + 1) / 5}
      actions={
        etape < 4 ? (
          <button onClick={() => aller(etape + 1)} disabled={!!manque} className="sy-btn sy-btn--primary sy-btn--md" style={{ flex: 1, minHeight: 50, justifyContent: "center", fontSize: "16px" }}>
            Continuer
          </button>
        ) : (
          <button data-r="envoyer-candidature" onClick={envoyer} disabled={!!manque || envoi} className="sy-btn sy-btn--primary sy-btn--md" style={{ flex: 1, minHeight: 50, justifyContent: "center", fontSize: "16px" }}>
            {envoi ? "Envoi en cours…" : "Envoyer mon dossier"}
          </button>
        )
      }
    >
      <div data-r="devenir-prestataire">
        <h1 style={TITRE_ETAPE}>{titre}</h1>

        {/* ---- 1 · Type ---- */}
        {etape === 0 && (
          <>
            <p style={AIDE}>Les informations demandées dépendent de votre activité. L'équipe TerraClick vérifie chaque dossier avant de publier votre fiche.</p>
            <div role="radiogroup" aria-label="Type de prestataire" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {exigences?.types.map((t) => (
                <Choix key={t.cle} actif={type === t.cle} onClick={() => setType(t.cle)} titre={t.nom} detail={t.detail} icone={t.icone} />
              ))}
            </div>
          </>
        )}

        {/* ---- 2 · Identité ---- */}
        {etape === 1 && (
          <>
            <p style={AIDE}>Votre pièce d'identité ne sera jamais publiée : seule l'équipe de vérification la voit.</p>
            <Champ id="cand-responsable" libelle="Nom et prénoms du responsable">
              <input id="cand-responsable" className="sy-input" maxLength={120} value={champs.responsable} onChange={(e) => modifier({ responsable: e.target.value })} />
            </Champ>
            <Champ id="cand-activite" libelle={type === "artisan" ? "Nom affiché sur votre fiche" : type === "pressing" ? "Nom du pressing" : "Nom de l'entreprise"} aide="C'est le nom que verront les clients.">
              <input
                id="cand-activite"
                className="sy-input"
                maxLength={120}
                value={champs.nom_activite}
                onChange={(e) => modifier({ nom_activite: e.target.value })}
                placeholder={type === "artisan" ? "Ex. Yao Plomberie" : type === "pressing" ? "Ex. Pressing Lumière" : "Ex. Ivoire Services SARL"}
              />
            </Champ>
            <Champ id="cand-telephone" libelle="Téléphone" aide="Celui de votre compte : les clients vous joindront à ce numéro.">
              <input id="cand-telephone" className="sy-input" value={etat.auth.tel} disabled />
            </Champ>
            <h2 style={SOUS_TITRE}>Pièces d'identité</h2>
            {piecesIdentite.map((p) => (
              <ChampFichier key={p.cle} piece={p} fichier={fichiers[p.cle]} onChange={(fi) => setFichiers((x) => { const y = { ...x }; if (fi) y[p.cle] = fi; else delete y[p.cle]; return y; })} />
            ))}
          </>
        )}

        {/* ---- 3 · Activité ---- */}
        {etape === 2 && exigences && (
          <>
            {type !== "pressing" ? (
              <>
                <h2 style={{ ...SOUS_TITRE, marginTop: 8 }}>Vos services</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {exigences.secteurs.map((s) => (
                    <Pastille key={s.cle} actif={champs.secteurs.includes(s.cle)} onClick={() => modifier({ secteurs: bascule(champs.secteurs, s.cle) })}>
                      {s.nom}
                    </Pastille>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 style={{ ...SOUS_TITRE, marginTop: 8 }}>Vos services de pressing</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {exigences.services_pressing.map((s) => (
                    <Pastille key={s.cle} actif={((details.services as string[]) ?? []).includes(s.cle)} onClick={() => detail("services", bascule((details.services as string[]) ?? [], s.cle))}>
                      {s.nom}
                    </Pastille>
                  ))}
                  <Pastille actif={details.express === true} onClick={() => detail("express", details.express !== true)}>
                    Express
                  </Pastille>
                </div>
              </>
            )}

            <h2 style={SOUS_TITRE}>Où travaillez-vous ?</h2>
            <Champ id="cand-quartier" libelle={`Votre quartier à ${ville}`}>
              <select
                id="cand-quartier"
                className="sy-input"
                value={champs.quartier_id ?? ""}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  modifier({ quartier_id: id, quartiers: id && !champs.quartiers.includes(id) ? [...champs.quartiers, id] : champs.quartiers });
                }}
              >
                <option value="">Choisissez votre quartier</option>
                {quartiers.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.nom}
                  </option>
                ))}
              </select>
            </Champ>
            <span style={{ display: "block", margin: "14px 0 8px", fontSize: "14.5px", fontWeight: 600 }}>Quartiers où vous intervenez</span>
            <div data-r="quartiers-intervention" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Pastille actif={quartiers.length > 0 && champs.quartiers.length === quartiers.length} onClick={() => modifier({ quartiers: champs.quartiers.length === quartiers.length ? [] : quartiers.map((q) => q.id) })}>
                Tout {ville}
              </Pastille>
              {quartiers.map((q) => (
                <Pastille key={q.id} actif={champs.quartiers.includes(q.id)} onClick={() => modifier({ quartiers: bascule(champs.quartiers, q.id) })}>
                  {q.nom}
                </Pastille>
              ))}
            </div>

            <h2 style={SOUS_TITRE}>Votre présentation</h2>
            <Champ id="cand-description" libelle="Décrivez votre activité" aide="Ce que vous faites, votre spécialité, ce qui vous distingue.">
              <textarea
                id="cand-description"
                className="sy-textarea"
                maxLength={1000}
                value={champs.description}
                onChange={(e) => modifier({ description: e.target.value })}
                placeholder="Ex. Plombier depuis 10 ans : fuites, sanitaires, chauffe-eau. Intervention rapide dans tout Yakro."
                style={{ borderRadius: "var(--radius-md)" }}
              />
            </Champ>
            <Champ id="cand-experience" libelle="Années d'expérience (facultatif)">
              <input id="cand-experience" className="sy-input" inputMode="numeric" maxLength={2} value={champs.experience_annees} onChange={(e) => modifier({ experience_annees: e.target.value.replace(/\D/g, "") })} />
            </Champ>
            <Champ id="cand-horaires" libelle="Horaires">
              <input id="cand-horaires" className="sy-input" maxLength={160} value={champs.horaires} onChange={(e) => modifier({ horaires: e.target.value })} placeholder="Ex. Lundi au samedi, 7 h – 19 h" />
            </Champ>
            <Champ id="cand-prix" libelle="Prix indicatifs (facultatif)" aide="Ex. déplacement 2 000 F, devis gratuit.">
              <input id="cand-prix" className="sy-input" maxLength={160} value={champs.prix} onChange={(e) => modifier({ prix: e.target.value })} />
            </Champ>
            <span style={{ display: "block", margin: "14px 0 8px", fontSize: "14.5px", fontWeight: 600 }}>Paiements acceptés</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {exigences.paiements.map((p) => (
                <Pastille key={p.cle} actif={champs.paiements.includes(p.cle)} onClick={() => modifier({ paiements: bascule(champs.paiements, p.cle) })}>
                  {p.nom}
                </Pastille>
              ))}
            </div>
          </>
        )}

        {/* ---- 4 · Propre au type ---- */}
        {etape === 3 && type === "artisan" && (
          <>
            <p style={AIDE}>Une personne qui peut confirmer votre sérieux : un ancien client, un patron, un collègue.</p>
            <Champ id="cand-ref-nom" libelle="Personne de référence">
              <input id="cand-ref-nom" className="sy-input" maxLength={120} value={texte("reference_nom")} onChange={(e) => detail("reference_nom", e.target.value)} />
            </Champ>
            <Champ id="cand-ref-tel" libelle="Son numéro de téléphone">
              <input id="cand-ref-tel" className="sy-input" inputMode="tel" maxLength={20} value={texte("reference_telephone")} onChange={(e) => detail("reference_telephone", e.target.value)} placeholder="07 00 00 00 00" />
            </Champ>
          </>
        )}
        {etape === 3 && type === "entreprise" && (
          <>
            <p style={AIDE}>Les informations de votre immatriculation.</p>
            <Champ id="cand-rccm" libelle="Numéro RCCM">
              <input id="cand-rccm" className="sy-input" maxLength={40} value={texte("rccm")} onChange={(e) => detail("rccm", e.target.value)} placeholder="CI-YAM-2024-B-00000" />
            </Champ>
            <Champ id="cand-ncc" libelle="Numéro de compte contribuable (NCC)">
              <input id="cand-ncc" className="sy-input" maxLength={40} value={texte("ncc")} onChange={(e) => detail("ncc", e.target.value)} />
            </Champ>
            <Champ id="cand-siege" libelle="Adresse du siège">
              <input id="cand-siege" className="sy-input" maxLength={160} value={texte("adresse_siege")} onChange={(e) => detail("adresse_siege", e.target.value)} />
            </Champ>
            <Champ id="cand-techniciens" libelle="Nombre de techniciens">
              <input id="cand-techniciens" className="sy-input" inputMode="numeric" maxLength={3} value={texte("nombre_techniciens")} onChange={(e) => detail("nombre_techniciens", e.target.value.replace(/\D/g, ""))} />
            </Champ>
          </>
        )}
        {etape === 3 && type === "pressing" && (
          <>
            <p style={AIDE}>Où vous trouver, et comment vous travaillez.</p>
            <Champ id="cand-local" libelle="Adresse du pressing" aide="Avec un point de repère.">
              <input id="cand-local" className="sy-input" maxLength={160} value={texte("adresse_local")} onChange={(e) => detail("adresse_local", e.target.value)} placeholder="Ex. face à la pharmacie de l'Habitat" />
            </Champ>
            <Champ id="cand-delai" libelle="Délai habituel">
              <input id="cand-delai" className="sy-input" maxLength={60} value={texte("delai")} onChange={(e) => detail("delai", e.target.value)} placeholder="Ex. 48 h, 24 h en express" />
            </Champ>
            <span style={{ display: "block", margin: "14px 0 8px", fontSize: "14.5px", fontWeight: 600 }}>Collecte à domicile</span>
            <div role="radiogroup" aria-label="Collecte à domicile" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Choix actif={details.collecte === true} onClick={() => detail("collecte", true)} titre="Oui, je collecte et je livre" icone="route" />
              <Choix actif={details.collecte === false} onClick={() => detail("collecte", false)} titre="Non, dépôt au pressing seulement" icone="building-2" />
            </div>
            {details.collecte === true && (
              <>
                <span style={{ display: "block", margin: "14px 0 8px", fontSize: "14.5px", fontWeight: 600 }}>Quartiers où vous collectez</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {quartiers.map((q) => (
                    <Pastille key={q.id} actif={((details.quartiers_collecte as number[]) ?? []).includes(q.id)} onClick={() => detail("quartiers_collecte", bascule((details.quartiers_collecte as number[]) ?? [], q.id))}>
                      {q.nom}
                    </Pastille>
                  ))}
                </div>
                <Champ id="cand-frais" libelle="Frais de collecte (facultatif)">
                  <input id="cand-frais" className="sy-input" maxLength={60} value={texte("frais_collecte")} onChange={(e) => detail("frais_collecte", e.target.value)} placeholder="Ex. 500 F, gratuit dès 10 pièces" />
                </Champ>
              </>
            )}
          </>
        )}
        {etape === 3 && (
          <>
            <h2 style={SOUS_TITRE}>Pièces</h2>
            {piecesType.map((p) => (
              <ChampFichier key={p.cle} piece={p} fichier={fichiers[p.cle]} onChange={(fi) => setFichiers((x) => { const y = { ...x }; if (fi) y[p.cle] = fi; else delete y[p.cle]; return y; })} />
            ))}
          </>
        )}

        {/* ---- 5 · Récapitulatif ---- */}
        {etape === 4 && type && exigences && (
          <>
            <p style={AIDE}>Votre dossier part à l'équipe TerraClick. Elle vous répond ici après vérification.</p>
            <dl data-r="recap-candidature" style={{ ...CARTE, margin: 0, padding: 16, display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 14px", fontSize: "14.5px" }}>
              {(
                [
                  ["Type", exigences.types.find((t) => t.cle === type)?.nom],
                  ["Activité", champs.nom_activite],
                  ["Responsable", champs.responsable],
                  ["Services", type === "pressing" ? exigences.services_pressing.filter((s) => ((details.services as string[]) ?? []).includes(s.cle)).map((s) => s.nom).join(", ") + (details.express ? ", Express" : "") : exigences.secteurs.filter((s) => champs.secteurs.includes(s.cle)).map((s) => s.nom).join(", ")],
                  ["Quartiers", champs.quartiers.length === quartiers.length ? `Tout ${ville}` : quartiers.filter((q) => champs.quartiers.includes(q.id)).map((q) => q.nom).join(", ")],
                  ["Horaires", champs.horaires],
                  ["Paiements", exigences.paiements.filter((p) => champs.paiements.includes(p.cle)).map((p) => p.nom).join(", ")],
                  ["Pièces jointes", `${Object.keys(fichiers).length} fichier${Object.keys(fichiers).length > 1 ? "s" : ""}`],
                ] as [string, string | undefined][]
              ).map(([k, v]) => (
                <div key={k} style={{ display: "contents" }}>
                  <dt style={{ color: GRIS }}>{k}</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>{v || "—"}</dd>
                </div>
              ))}
            </dl>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 16, fontSize: "15px", cursor: "pointer" }}>
              <input type="checkbox" checked={engagement} onChange={(e) => setEngagement(e.target.checked)} style={{ width: 22, height: 22, marginTop: 1, flex: "none", accentColor: "var(--color-accent)" }} />
              J'atteste que ces informations et ces pièces sont exactes, et j'accepte qu'elles soient vérifiées par TerraClick.
            </label>
            {erreurs.length > 0 && (
              <ul role="alert" style={{ margin: "16px 0 0", padding: "12px 16px 12px 32px", borderRadius: 14, background: "var(--state-danger-soft)", color: "var(--state-danger)", fontSize: "14px" }}>
                {erreurs.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </>
        )}

        {manque && etape > 0 && etape < 4 && (
          <p role="status" style={{ ...AIDE, margin: "16px 0 0" }}>
            {manque}
          </p>
        )}
      </div>
    </CadreParcours>
  );
}

/** Le dossier envoyé : en vérification, validé (fiche publiée), à compléter ou rejeté (motif de l'équipe). */
function StatutCandidature({ c, onCorriger }: { c: CandidatureApi; onCorriger: () => void }) {
  const { go } = useApp();
  const ton = c.statut === "validee" ? ["var(--state-success-soft)", "var(--state-success)", "badge-check"] : c.statut === "refusee" || c.statut === "rejetee" ? ["var(--state-danger-soft)", "var(--state-danger)", "alert-triangle"] : ["var(--color-accent-100)", "var(--color-accent-700)", "clock"];

  return (
    <CadreParcours retour={() => go("parametres")}>
      <div data-r="statut-candidature" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, marginBottom: 20 }}>
        <span style={{ width: 72, height: 72, borderRadius: 999, background: ton[0], color: ton[1], display: "grid", placeItems: "center" }}>
          <Icon name={ton[2]} size={34} />
        </span>
        <h1 style={{ ...TITRE_ETAPE, margin: 0 }}>
          {c.statut === "validee" ? "Vous êtes prestataire TerraClick" : c.statut === "refusee" ? "Votre dossier est à compléter" : c.statut === "rejetee" ? "Votre candidature n'est pas retenue" : "Dossier envoyé"}
        </h1>
        <span className={`sy-badge sy-badge--${c.statut === "validee" ? "success" : c.statut === "refusee" || c.statut === "rejetee" ? "neutral" : "brand"}`}>{c.statut_libelle}</span>
        <p style={{ margin: 0, fontSize: "15px", maxWidth: "44ch", color: GRIS }}>
          {c.statut === "validee"
            ? "Votre fiche est publiée. Les clients peuvent vous trouver et vous envoyer des demandes."
            : c.statut === "refusee"
              ? "L'équipe TerraClick vous demande de corriger ou de compléter votre dossier :"
              : c.statut === "rejetee"
                ? "L'équipe TerraClick a examiné votre dossier et ne peut pas le retenir :"
                : "L'équipe TerraClick vérifie votre dossier. Vous verrez sa réponse ici."}
        </p>
        {(c.statut === "refusee" || c.statut === "rejetee") && c.motif_refus && (
          <p data-r="motif-refus" style={{ margin: 0, padding: "12px 16px", borderRadius: 14, background: "var(--state-danger-soft)", fontSize: "15px", fontWeight: 600 }}>
            {c.motif_refus}
          </p>
        )}
      </div>

      <dl style={{ ...CARTE, margin: 0, padding: 16, display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 14px", fontSize: "14.5px" }}>
        {(
          [
            ["Référence", c.reference],
            ["Type", c.type.nom],
            ["Activité", c.nom_activite],
            ["Services", c.secteurs.map((s) => s.nom).join(", ")],
            ["Envoyé le", new Date(c.cree_le).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div key={k} style={{ display: "contents" }}>
            <dt style={{ color: GRIS }}>{k}</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>{v}</dd>
          </div>
        ))}
      </dl>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        {c.statut === "refusee" && (
          <button data-r="corriger-candidature" onClick={onCorriger} className="sy-btn sy-btn--primary sy-btn--md">
            Corriger et renvoyer
          </button>
        )}
        {c.statut === "validee" && (
          <>
            <button onClick={() => go("demandesRecues")} className="sy-btn sy-btn--primary sy-btn--md">
              Mes demandes reçues
            </button>
            {c.prestataire_id && (
              <button onClick={() => go("fiche", { fiche: c.prestataire_id! })} className="sy-btn sy-btn--outline sy-btn--md">
                Voir ma fiche
              </button>
            )}
          </>
        )}
      </div>
    </CadreParcours>
  );
}
