import { useEffect, useState } from "react";
import { api, messageErreur, type CandidatureApi } from "../../lib/api";
import { Dialogue } from "../../components/Dialogue";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspaceAdmin } from "./EspaceAdmin";

/* Espace administrateur, module « Candidatures » : les candidatures « Devenir prestataire » à vérifier. Le dossier complet,
   les pièces jointes (ouvertes avec le jeton, jamais publiques), puis « Valider » — la fiche
   est créée et publiée — ou « Refuser » avec le motif que le candidat lira pour corriger. */

const GRIS = "#5C5248";

const CARTE: React.CSSProperties = {
  background: "var(--color-neutral-100)",
  border: "1px solid var(--color-divider)",
  borderRadius: 20,
};

const STATUTS: { cle: CandidatureApi["statut"]; nom: string }[] = [
  { cle: "en_attente", nom: "À vérifier" },
  { cle: "validee", nom: "Validées" },
  { cle: "refusee", nom: "À corriger" },
];

const LIBELLES_DETAILS: Record<string, string> = {
  reference_nom: "Personne de référence",
  reference_telephone: "Téléphone de la référence",
  rccm: "RCCM",
  ncc: "NCC",
  adresse_siege: "Siège",
  nombre_techniciens: "Techniciens",
  adresse_local: "Adresse du pressing",
  services: "Services de pressing",
  express: "Express",
  delai: "Délai habituel",
  collecte: "Collecte à domicile",
  quartiers_collecte: "Quartiers de collecte",
  frais_collecte: "Frais de collecte",
};

const lisible = (v: unknown) => (Array.isArray(v) ? v.join(", ") : typeof v === "boolean" || v === "1" || v === "0" ? (v === true || v === "1" ? "Oui" : "Non") : String(v ?? ""));

export function AdminCandidatures() {
  const toast = useToast();
  const [statut, setStatut] = useState<CandidatureApi["statut"]>("en_attente");
  const [liste, setListe] = useState<CandidatureApi[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouverte, setOuverte] = useState<CandidatureApi | null>(null);
  const [fenetre, setFenetre] = useState<"valider" | "refuser" | null>(null);
  const [motif, setMotif] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const arret = new AbortController();
    setListe(null);
    api.candidatures(statut, arret.signal).then(setListe, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e)));
    return () => arret.abort();
  }, [statut, version]);

  const traiter = async (action: () => Promise<CandidatureApi>, titre: string, texte: string) => {
    try {
      setOuverte(await action());
      setFenetre(null);
      setMotif("");
      setVersion((v) => v + 1);
      toast(titre, texte);
    } catch (e) {
      toast("Action impossible", messageErreur(e), "danger");
    }
  };

  return (
    <EspaceAdmin titre="Candidatures" sousTitre="Dossiers « Devenir prestataire » envoyés à l'équipe.">
      <div data-r="admin-candidatures" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 820 }}>

      {ouverte ? (
        <Dossier c={ouverte} onRetour={() => setOuverte(null)} onValider={() => setFenetre("valider")} onRefuser={() => setFenetre("refuser")} />
      ) : (
        <>
          <div role="tablist" aria-label="Statut" style={{ display: "flex", borderBottom: "1px solid var(--color-divider)" }}>
            {STATUTS.map((s) => (
              <button
                key={s.cle}
                role="tab"
                aria-selected={statut === s.cle}
                onClick={() => setStatut(s.cle)}
                style={{
                  flex: 1,
                  minHeight: 46,
                  border: 0,
                  borderBottom: `3px solid ${statut === s.cle ? "var(--color-accent)" : "transparent"}`,
                  background: "none",
                  font: "inherit",
                  fontSize: "15px",
                  fontWeight: statut === s.cle ? 700 : 500,
                  color: statut === s.cle ? "var(--color-text)" : GRIS,
                  cursor: "pointer",
                }}
              >
                {s.nom}
              </button>
            ))}
          </div>
          {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}
          {liste?.length === 0 && (
            <p role="status" style={{ margin: 0, padding: "28px 0", textAlign: "center", color: GRIS }}>
              Aucune candidature ici.
            </p>
          )}
          {liste && liste.length > 0 && (
            <div style={{ ...CARTE, overflow: "hidden" }}>
              {liste.map((c, i) => (
                <button
                  key={c.id}
                  data-r="candidature"
                  onClick={() => setOuverte(c)}
                  style={{ width: "100%", minHeight: 64, display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", border: 0, borderTop: i ? "1px solid var(--color-divider)" : 0, background: "none", font: "inherit", color: "inherit", textAlign: "left", cursor: "pointer" }}
                >
                  <span style={{ width: 40, height: 40, flex: "none", borderRadius: 999, background: "var(--color-surface)", display: "grid", placeItems: "center" }}>
                    <Icon name={c.type.cle === "pressing" ? "shirt" : c.type.cle === "entreprise" ? "building-2" : "wrench"} size={19} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 600, fontSize: "15.5px" }}>{c.nom_activite}</span>
                    <span style={{ display: "block", fontSize: "13px", color: GRIS }}>
                      {c.type.nom} · {c.secteurs.map((s) => s.nom).join(", ")} · {new Date(c.cree_le).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </span>
                  <Icon name="chevron-right" size={18} color={GRIS} />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {fenetre === "valider" && ouverte && (
        <Dialogue
          titre="Valider cette candidature ?"
          description={`La fiche « ${ouverte.nom_activite} » est créée, publiée et reliée au compte du candidat.`}
          icone="badge-check"
          fond="var(--state-success-soft)"
          encre="var(--state-success)"
          confirmer="Valider et publier"
          onFermer={() => setFenetre(null)}
          onConfirmer={() => traiter(() => api.validerCandidature(ouverte.id), "Candidature validée", "La fiche est publiée.")}
        />
      )}
      {fenetre === "refuser" && ouverte && (
        <Dialogue
          titre="Demander une correction"
          description="Le candidat lit ce motif dans son espace et peut renvoyer un dossier corrigé."
          icone="alert-triangle"
          fond="var(--state-danger-soft)"
          encre="var(--state-danger)"
          confirmer="Envoyer le motif"
          onFermer={() => setFenetre(null)}
          onConfirmer={() => {
            if (motif.trim().length < 5) {
              toast("Motif trop court", "Dites précisément ce qui doit être corrigé.", "danger");
              return;
            }
            traiter(() => api.refuserCandidature(ouverte.id, motif.trim()), "Correction demandée", "Le candidat est prévenu.");
          }}
        >
          <textarea className="sy-textarea" aria-label="Motif" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex. la photo de la pièce d'identité est floue." style={{ borderRadius: 14 }} />
        </Dialogue>
      )}
      </div>
    </EspaceAdmin>
  );
}

function Dossier({ c, onRetour, onValider, onRefuser }: { c: CandidatureApi; onRetour: () => void; onValider: () => void; onRefuser: () => void }) {
  const lignes: [string, string][] = [
    ["Référence", c.reference],
    ["Type", c.type.nom],
    ["Responsable", c.responsable],
    ["Téléphone", c.telephone],
    ["Services", c.secteurs.map((s) => s.nom).join(", ")],
    ["Quartier", c.quartier?.nom ?? ""],
    ["Interventions", c.quartiers.join(", ")],
    ["Expérience", c.experience_annees !== null ? `${c.experience_annees} an${c.experience_annees > 1 ? "s" : ""}` : ""],
    ["Horaires", c.horaires ?? ""],
    ["Prix", c.prix ?? ""],
    ["Paiements", c.paiements.join(", ")],
    ...Object.entries(c.details ?? {}).map(([k, v]) => [LIBELLES_DETAILS[k] ?? k, lisible(v)] as [string, string]),
    ["Envoyé le", new Date(c.cree_le).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })],
  ];

  return (
    <section data-r="dossier-candidature" aria-label={c.nom_activite} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <button onClick={onRetour} className="sy-btn sy-btn--ghost sy-btn--sm" style={{ alignSelf: "flex-start", gap: 6 }}>
        <Icon name="arrow-left" size={16} />
        Toutes les candidatures
      </button>
      <div>
        <h2 style={{ margin: 0, fontSize: "24px" }}>{c.nom_activite}</h2>
        <span className={`sy-badge sy-badge--${c.statut === "validee" ? "success" : c.statut === "refusee" ? "neutral" : "brand"}`}>{c.statut_libelle}</span>
      </div>
      <p style={{ ...CARTE, margin: 0, padding: 16, fontSize: "15px", lineHeight: 1.5 }}>{c.description}</p>
      <dl style={{ ...CARTE, margin: 0, padding: 16, display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 14px", fontSize: "14.5px" }}>
        {lignes
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} style={{ display: "contents" }}>
              <dt style={{ color: GRIS }}>{k}</dt>
              <dd style={{ margin: 0, fontWeight: 600, overflowWrap: "anywhere" }}>{v}</dd>
            </div>
          ))}
      </dl>

      <h3 style={{ margin: "6px 0 0", fontSize: "17px" }}>Pièces jointes</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
        {c.documents.map((d) => (
          <Piece key={d.type} d={d} />
        ))}
      </div>

      {c.statut === "refusee" && c.motif_refus && (
        <p style={{ margin: 0, padding: "12px 16px", borderRadius: 14, background: "var(--state-danger-soft)", fontSize: "14.5px" }}>
          <strong>Motif envoyé :</strong> {c.motif_refus}
        </p>
      )}
      {c.statut === "en_attente" && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button data-r="valider-candidature" onClick={onValider} className="sy-btn sy-btn--primary sy-btn--md" style={{ gap: 8 }}>
            <Icon name="badge-check" size={17} />
            Valider
          </button>
          <button data-r="refuser-candidature" onClick={onRefuser} className="sy-btn sy-btn--outline sy-btn--md">
            Demander une correction
          </button>
        </div>
      )}
    </section>
  );
}

/** Une pièce jointe : aperçu pour une photo, lien pour un PDF ; chargée avec le jeton. */
function Piece({ d }: { d: CandidatureApi["documents"][number] }) {
  const [adresse, setAdresse] = useState<string | null>(null);
  const [erreur, setErreur] = useState(false);
  const image = d.mime.startsWith("image/");

  useEffect(() => {
    if (!d.url) return;
    let local: string | null = null;
    api.pieceCandidature(d.url).then(
      (u) => {
        local = u;
        setAdresse(u);
      },
      () => setErreur(true),
    );
    return () => void (local && URL.revokeObjectURL(local));
  }, [d.url]);

  return (
    <a
      data-r="piece-jointe"
      href={adresse ?? undefined}
      target="_blank"
      rel="noreferrer"
      style={{ ...CARTE, overflow: "hidden", display: "flex", flexDirection: "column", color: "inherit", textDecoration: "none" }}
    >
      <span style={{ height: 110, background: "var(--color-surface)", display: "grid", placeItems: "center", color: GRIS }}>
        {image && adresse ? <img src={adresse} alt={d.libelle} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon name={erreur ? "alert-triangle" : "file-text"} size={30} />}
      </span>
      <span style={{ padding: "8px 10px", fontSize: "13px", fontWeight: 600 }}>{d.libelle}</span>
    </a>
  );
}
