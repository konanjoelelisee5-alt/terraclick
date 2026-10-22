import { useEffect, useState, type CSSProperties } from "react";
import { api, messageErreur, type SecteurAdmin, type SecteursAdmin, type SecteurSaisie, type SousService } from "../../lib/api";
import { peut } from "../../lib/acces";
import { useApp } from "../../state/app";
import { Dialogue } from "../../components/Dialogue";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspaceAdmin, GRIS, TITRE_CARTE, Vide } from "./EspaceAdmin";

/* Secteurs d'activité : l'administrateur crée un secteur (désactivé tant qu'il ne l'ouvre pas),
   le modifie (nom, métier, description, icône, couleur, catégories de l'annuaire, problèmes
   proposés, mots compris par la recherche), l'active ou le désactive, le classe pour l'accueil
   client et définit ses sous-services. Chaque carte montre ses chiffres : demandes, prestataires,
   interventions réussies et leur montant. Le manager voit tout sans rien modifier. */

const nombre = (n: number) => n.toLocaleString("fr-FR");
const francs = (n: number) => `${nombre(n)} F`;

export function AdminSecteurs() {
  const { etat } = useApp();
  const toast = useToast();
  const gerer = peut(etat.auth, "secteurs.gerer");
  const [donnees, setDonnees] = useState<SecteursAdmin | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [edition, setEdition] = useState<SecteurAdmin | "nouveau" | null>(null);
  const [ouvert, setOuvert] = useState<number | null>(null);

  useEffect(() => {
    const arret = new AbortController();
    api.admin.secteurs(arret.signal).then(setDonnees, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e)));
    return () => arret.abort();
  }, []);

  const secteurs = donnees?.secteurs ?? [];
  const remplacer = (s: SecteurAdmin) =>
    setDonnees((d) => d && { ...d, secteurs: d.secteurs.some((x) => x.id === s.id) ? d.secteurs.map((x) => (x.id === s.id ? { ...s, chiffres: x.chiffres } : x)) : [...d.secteurs, s] });

  const basculer = async (s: SecteurAdmin) => {
    try {
      remplacer(await api.admin.modifierSecteur(s.id, { actif: !s.actif }));
      toast(s.actif ? "Secteur désactivé" : "Secteur activé", s.actif ? `${s.nom} n'apparaît plus dans l'application.` : `${s.nom} est ouvert aux clients.`);
    } catch (e) {
      toast("Secteur non modifié", messageErreur(e), "danger");
    }
  };

  const deplacer = async (index: number, sens: -1 | 1) => {
    const liste = [...secteurs];
    const cible = index + sens;
    if (cible < 0 || cible >= liste.length) return;
    [liste[index], liste[cible]] = [liste[cible], liste[index]];
    setDonnees((d) => d && { ...d, secteurs: liste });
    try {
      await api.admin.ordonnerSecteurs(liste.map((s) => s.id));
    } catch (e) {
      toast("Ordre non enregistré", messageErreur(e), "danger");
    }
  };

  const actifs = secteurs.filter((s) => s.actif).length;

  return (
    <EspaceAdmin
      titre="Secteurs d'activité"
      sousTitre={donnees ? `${secteurs.length} secteurs, dont ${actifs} ouvert${actifs > 1 ? "s" : ""} aux clients. L'ordre ci-dessous est celui de l'accueil client.` : undefined}
      actions={
        gerer && (
          <button data-r="nouveau-secteur" onClick={() => setEdition("nouveau")} className="sy-btn sy-btn--primary sy-btn--sm" style={{ gap: 6, flex: "none" }}>
            <Icon name="square-plus" size={16} />
            Nouveau secteur
          </button>
        )
      }
    >
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}
      {donnees && !secteurs.length && <Vide texte="Aucun secteur pour l'instant." />}
      {secteurs.map((s, i) => (
        <CarteSecteur
          key={s.id}
          s={s}
          gerer={gerer}
          premier={i === 0}
          dernier={i === secteurs.length - 1}
          ouvert={ouvert === s.id}
          onOuvrir={() => setOuvert((o) => (o === s.id ? null : s.id))}
          onMonter={() => deplacer(i, -1)}
          onDescendre={() => deplacer(i, 1)}
          onBasculer={() => basculer(s)}
          onModifier={() => setEdition(s)}
          onSousServices={(prestations) => setDonnees((d) => d && { ...d, secteurs: d.secteurs.map((x) => (x.id === s.id ? { ...x, prestations } : x)) })}
        />
      ))}

      {edition && donnees && (
        <EditeurSecteur
          secteur={edition === "nouveau" ? null : edition}
          options={donnees}
          onFermer={() => setEdition(null)}
          onEnregistre={(s) => {
            remplacer(s);
            setEdition(null);
          }}
        />
      )}
    </EspaceAdmin>
  );
}

/* ---- Une carte par secteur ---- */

function CarteSecteur(props: {
  s: SecteurAdmin;
  gerer: boolean;
  premier: boolean;
  dernier: boolean;
  ouvert: boolean;
  onOuvrir: () => void;
  onMonter: () => void;
  onDescendre: () => void;
  onBasculer: () => void;
  onModifier: () => void;
  onSousServices: (p: SousService[]) => void;
}) {
  const { s } = props;
  const couleur = s.couleur ?? "var(--kola-500)";
  const chiffres: [string, string][] = [
    ["Demandes", nombre(s.chiffres.demandes)],
    ["Prestataires actifs", nombre(s.chiffres.prestataires)],
    ["Interventions réussies", nombre(s.chiffres.reussies)],
    ["Montant des réussies", francs(s.chiffres.montant_reussies)],
  ];

  return (
    <section data-r="secteur-admin" aria-label={s.nom} className="sy-card" style={{ opacity: s.actif ? 1 : 0.86 }}>
      <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {props.gerer && (
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <button type="button" className="sy-iconbtn sy-iconbtn--sm" aria-label={`Monter ${s.nom}`} disabled={props.premier} onClick={props.onMonter}>
                <Icon name="chevron-down" size={16} style={{ transform: "rotate(180deg)" }} />
              </button>
              <button type="button" className="sy-iconbtn sy-iconbtn--sm" aria-label={`Descendre ${s.nom}`} disabled={props.dernier} onClick={props.onDescendre}>
                <Icon name="chevron-down" size={16} />
              </button>
            </span>
          )}
          <span style={{ width: 46, height: 46, flex: "none", borderRadius: 12, display: "grid", placeItems: "center", color: couleur, background: s.couleur ? `${s.couleur}1F` : "var(--kola-100)" }}>
            <Icon name={s.icone} size={22} />
          </span>
          <span style={{ flex: 1, minWidth: 180 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 style={TITRE_CARTE}>{s.nom}</h2>
              <span data-r="etat-secteur" className={`sy-badge sy-badge--${s.actif ? "success" : "neutral"}`}>
                {s.actif ? "Ouvert aux clients" : "Désactivé"}
              </span>
            </span>
            <span style={{ display: "block", fontSize: "13px", color: GRIS, marginTop: 2 }}>
              {[s.metier, s.description].filter(Boolean).join(" · ") || "Sans description"}
            </span>
          </span>
          {props.gerer && (
            <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button data-r="basculer-secteur" onClick={props.onBasculer} className={`sy-btn sy-btn--sm ${s.actif ? "sy-btn--outline" : "sy-btn--primary"}`}>
                {s.actif ? "Désactiver" : "Activer"}
              </button>
              <button data-r="modifier-secteur" onClick={props.onModifier} className="sy-btn sy-btn--outline sy-btn--sm" style={{ gap: 6 }}>
                <Icon name="pen-line" size={15} />
                Modifier
              </button>
            </span>
          )}
        </div>

        <div data-r="chiffres-secteur" style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))" }}>
          {chiffres.map(([libelle, valeur]) => (
            <span key={libelle} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--surface-sunken)" }}>
              <span style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "18px" }}>{valeur}</span>
              <span style={{ display: "block", fontSize: "12px", color: GRIS }}>{libelle}</span>
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={props.onOuvrir}
          aria-expanded={props.ouvert}
          data-r="ouvrir-sous-services"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: 0, border: 0, background: "none", cursor: "pointer", font: "inherit", fontSize: "13.5px", fontWeight: 700, color: "var(--kola-700)" }}
        >
          <Icon name="chevron-down" size={16} style={{ transform: props.ouvert ? "rotate(180deg)" : undefined }} />
          Sous-services ({s.prestations.filter((p) => p.actif).length})
        </button>
        {props.ouvert && <SousServices s={s} gerer={props.gerer} onChange={props.onSousServices} />}
      </div>
    </section>
  );
}

/* ---- Sous-services : les prestations du secteur ---- */

function SousServices({ s, gerer, onChange }: { s: SecteurAdmin; gerer: boolean; onChange: (p: SousService[]) => void }) {
  const toast = useToast();
  const [nom, setNom] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const ajouter = async () => {
    try {
      const p = await api.admin.ajouterSousService(s.id, { nom: nom.trim(), prix_min: min ? Number(min) : null, prix_max: max ? Number(max) : null });
      onChange([...s.prestations, p]);
      setNom("");
      setMin("");
      setMax("");
      toast("Sous-service ajouté", `${p.nom}${p.prix_affichage ? ` : ${p.prix_affichage}` : ""}`);
    } catch (e) {
      toast("Sous-service non ajouté", messageErreur(e), "danger");
    }
  };

  const basculer = async (p: SousService) => {
    try {
      const maj = await api.admin.modifierSousService(p.id, { actif: !p.actif });
      onChange(s.prestations.map((x) => (x.id === p.id ? maj : x)));
    } catch (e) {
      toast("Sous-service non modifié", messageErreur(e), "danger");
    }
  };

  const champ: CSSProperties = { width: 104, minHeight: 40 };

  return (
    <div data-r="sous-services" style={{ display: "flex", flexDirection: "column" }}>
      {!s.prestations.length && <p style={{ margin: 0, fontSize: "13.5px", color: GRIS }}>Aucun sous-service pour l'instant.</p>}
      {s.prestations.map((p) => (
        <div key={p.id} data-r="sous-service" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
          <span style={{ flex: 1, minWidth: 180, opacity: p.actif ? 1 : 0.6 }}>
            <span style={{ display: "block", fontWeight: 600, fontSize: "14px" }}>{p.nom}</span>
            <span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>
              {p.prix_affichage ?? "Sans prix indicatif"} · {p.prestataires} technicien{p.prestataires > 1 ? "s" : ""}
              {p.actif ? "" : " · désactivé"}
            </span>
          </span>
          {gerer && (
            <button onClick={() => basculer(p)} className="sy-btn sy-btn--ghost sy-btn--sm">
              {p.actif ? "Désactiver" : "Activer"}
            </button>
          )}
        </div>
      ))}
      {gerer && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 10, borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
          <input className="sy-input" aria-label={`Nouveau sous-service : ${s.nom}`} placeholder="Nouveau sous-service" value={nom} onChange={(e) => setNom(e.target.value)} style={{ flex: 1, minWidth: 180, minHeight: 40 }} />
          <input className="sy-input" inputMode="numeric" aria-label="Prix minimum du sous-service" placeholder="Min." value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} style={champ} />
          <input className="sy-input" inputMode="numeric" aria-label="Prix maximum du sous-service" placeholder="Max." value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} style={champ} />
          <button onClick={ajouter} disabled={nom.trim().length < 3} className="sy-btn sy-btn--primary sy-btn--sm">
            Ajouter
          </button>
        </div>
      )}
    </div>
  );
}

/* ---- Création et modification ---- */

function EditeurSecteur({ secteur, options, onFermer, onEnregistre }: { secteur: SecteurAdmin | null; options: SecteursAdmin; onFermer: () => void; onEnregistre: (s: SecteurAdmin) => void }) {
  const toast = useToast();
  const [saisie, setSaisie] = useState<Required<Omit<SecteurSaisie, "actif">>>({
    nom: secteur?.nom ?? "",
    metier: secteur?.metier ?? "",
    description: secteur?.description ?? "",
    icone: secteur?.icone ?? "wrench",
    couleur: secteur?.couleur ?? null,
    categories: secteur?.categories ?? [],
    problemes: secteur?.problemes ?? [],
    mots: secteur?.mots ?? [],
  });
  const maj = (patch: Partial<typeof saisie>) => setSaisie((x) => ({ ...x, ...patch }));

  const enregistrer = async () => {
    if (saisie.nom.trim().length < 3) {
      toast("Nom manquant", "Donnez un nom au secteur (3 lettres au moins).", "danger");
      return;
    }
    if (secteur && !saisie.categories.length) {
      toast("Catégorie manquante", "Un secteur ouvre au moins une catégorie de l'annuaire.", "danger");
      return;
    }
    const corps: SecteurSaisie = { ...saisie, nom: saisie.nom.trim(), metier: saisie.metier?.trim() || null, description: saisie.description?.trim() || null };
    try {
      const s = secteur ? await api.admin.modifierSecteur(secteur.id, corps) : await api.admin.creerSecteur(corps);
      toast(secteur ? "Secteur enregistré" : "Secteur créé", secteur ? s.nom : `${s.nom} est prêt. Activez-le pour l'ouvrir aux clients.`);
      onEnregistre(s);
    } catch (e) {
      toast("Secteur non enregistré", messageErreur(e), "danger");
    }
  };

  const libelle: CSSProperties = { display: "block", fontSize: "13px", fontWeight: 700, marginBottom: 6 };

  return (
    <Dialogue
      titre={secteur ? `Modifier « ${secteur.nom} »` : "Nouveau secteur"}
      description={secteur ? "Les changements se voient aussitôt dans l'application client." : "Il reste désactivé tant que vous ne l'ouvrez pas aux clients."}
      icone={saisie.icone}
      fond={saisie.couleur ? `${saisie.couleur}1F` : "var(--kola-100)"}
      encre={saisie.couleur ?? "var(--kola-700)"}
      confirmer={secteur ? "Enregistrer" : "Créer le secteur"}
      onFermer={onFermer}
      onConfirmer={enregistrer}
    >
      <div data-r="editeur-secteur" style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "min(62vh, 620px)", overflowY: "auto", paddingRight: 4 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))" }}>
          <label>
            <span style={libelle}>Nom du secteur</span>
            <input className="sy-input" value={saisie.nom} onChange={(e) => maj({ nom: e.target.value })} placeholder="Peinture" maxLength={80} />
          </label>
          <label>
            <span style={libelle}>Métier</span>
            <input className="sy-input" value={saisie.metier ?? ""} onChange={(e) => maj({ metier: e.target.value })} placeholder="Peintre" maxLength={80} />
          </label>
        </div>
        <label>
          <span style={libelle}>Description</span>
          <textarea className="sy-input" rows={2} value={saisie.description ?? ""} onChange={(e) => maj({ description: e.target.value })} placeholder="Murs, plafonds et façades." maxLength={500} style={{ minHeight: 64, resize: "vertical" }} />
        </label>

        <div>
          <span style={libelle}>Icône affichée au client</span>
          <div role="radiogroup" aria-label="Icône" style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))" }}>
            {options.icones.map((nom) => {
              const choisie = saisie.icone === nom;
              return (
                <button
                  key={nom}
                  type="button"
                  role="radio"
                  aria-checked={choisie}
                  aria-label={nom}
                  onClick={() => maj({ icone: nom })}
                  style={{ height: 44, borderRadius: 10, display: "grid", placeItems: "center", cursor: "pointer", border: `1.5px solid ${choisie ? "var(--kola-500)" : "var(--border-subtle)"}`, background: choisie ? "var(--kola-50)" : "var(--surface-card)", color: choisie ? "var(--kola-700)" : "var(--argile-700)" }}
                >
                  <Icon name={nom} size={20} />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span style={libelle}>Couleur</span>
          <div role="radiogroup" aria-label="Couleur" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" role="radio" aria-checked={!saisie.couleur} onClick={() => maj({ couleur: null })} className={`sy-tag${!saisie.couleur ? " sy-tag--selected" : ""}`}>
              Par défaut
            </button>
            {options.couleurs.map((c) => (
              <button
                key={c.hex}
                type="button"
                role="radio"
                aria-checked={saisie.couleur === c.hex}
                aria-label={c.nom}
                title={c.nom}
                onClick={() => maj({ couleur: c.hex })}
                style={{ width: 34, height: 34, borderRadius: "50%", cursor: "pointer", background: c.hex, border: saisie.couleur === c.hex ? "3px solid var(--argile-900)" : "3px solid transparent", boxShadow: "inset 0 0 0 2px #fff" }}
              />
            ))}
            <input type="color" aria-label="Autre couleur" value={saisie.couleur ?? "#E25B1A"} onChange={(e) => maj({ couleur: e.target.value.toUpperCase() })} style={{ width: 40, height: 34, padding: 0, border: 0, background: "none", cursor: "pointer" }} />
          </div>
        </div>

        <ChoixCategories options={options.categories} valeurs={saisie.categories} onChange={(categories) => maj({ categories })} nouveau={!secteur} />
        <ListeEditable
          titre="Problèmes proposés au client"
          aide="Les choix de la première question « Quel est le problème ? » (huit au plus)."
          valeurs={saisie.problemes}
          max={8}
          placeholder="Peindre une chambre"
          onChange={(problemes) => maj({ problemes })}
        />
        <ListeEditable
          titre="Mots compris par la recherche"
          aide="Un mot suivi de * reconnaît ses variantes (« peint* » : peinture, peintre). Le nom et le métier sont compris d'office."
          valeurs={saisie.mots}
          max={80}
          placeholder="plafond"
          onChange={(mots) => maj({ mots })}
        />
      </div>
    </Dialogue>
  );
}

function ChoixCategories({ options, valeurs, onChange, nouveau }: { options: SecteursAdmin["categories"]; valeurs: string[]; onChange: (v: string[]) => void; nouveau: boolean }) {
  const [q, setQ] = useState("");
  const sansAccent = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const trouvees = q.trim() ? options.filter((c) => !valeurs.includes(c.slug) && sansAccent(`${c.nom} ${c.rubrique}`).includes(sansAccent(q.trim()))).slice(0, 6) : [];
  const nomDe = (slug: string) => options.find((c) => c.slug === slug)?.nom ?? slug;

  return (
    <div>
      <span style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: 2 }}>Catégories de l'annuaire</span>
      <span style={{ display: "block", fontSize: "12.5px", color: GRIS, marginBottom: 6 }}>
        Les prestataires de ces catégories apparaissent dans ce secteur.{nouveau ? " Sans choix, une catégorie à son nom est créée." : ""}
      </span>
      <Pastilles valeurs={valeurs.map(nomDe)} onRetirer={(i) => onChange(valeurs.filter((_, j) => j !== i))} />
      <input className="sy-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher une catégorie (peintres, vitriers…)" aria-label="Chercher une catégorie de l'annuaire" style={{ marginTop: 6 }} />
      {trouvees.map((c) => (
        <button
          key={c.slug}
          type="button"
          onClick={() => {
            onChange([...valeurs, c.slug]);
            setQ("");
          }}
          style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 8, padding: "8px 10px", border: 0, borderBottom: "1px solid var(--border-subtle)", background: "none", cursor: "pointer", font: "inherit", fontSize: "13.5px", textAlign: "left" }}
        >
          <span>{c.nom}</span>
          <span style={{ color: GRIS, fontSize: "12px" }}>{c.rubrique}</span>
        </button>
      ))}
    </div>
  );
}

function ListeEditable({ titre, aide, valeurs, max, placeholder, onChange }: { titre: string; aide: string; valeurs: string[]; max: number; placeholder: string; onChange: (v: string[]) => void }) {
  const [texte, setTexte] = useState("");
  const ajouter = () => {
    const t = texte.trim();
    if (t.length < 2 || valeurs.includes(t) || valeurs.length >= max) return;
    onChange([...valeurs, t]);
    setTexte("");
  };

  return (
    <div>
      <span style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: 2 }}>{titre}</span>
      <span style={{ display: "block", fontSize: "12.5px", color: GRIS, marginBottom: 6 }}>{aide}</span>
      <Pastilles valeurs={valeurs} onRetirer={(i) => onChange(valeurs.filter((_, j) => j !== i))} />
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <input
          className="sy-input"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              ajouter();
            }
          }}
          placeholder={placeholder}
          aria-label={`Ajouter : ${titre}`}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={ajouter} disabled={texte.trim().length < 2 || valeurs.length >= max} className="sy-btn sy-btn--outline sy-btn--sm">
          Ajouter
        </button>
      </div>
    </div>
  );
}

function Pastilles({ valeurs, onRetirer }: { valeurs: string[]; onRetirer: (i: number) => void }) {
  if (!valeurs.length) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {valeurs.map((v, i) => (
        <span key={`${v}-${i}`} className="sy-tag" style={{ gap: 4, paddingRight: 4 }}>
          {v}
          <button type="button" aria-label={`Retirer ${v}`} onClick={() => onRetirer(i)} style={{ display: "grid", placeItems: "center", width: 22, height: 22, border: 0, borderRadius: "50%", background: "none", cursor: "pointer", color: "inherit" }}>
            <Icon name="x" size={13} />
          </button>
        </span>
      ))}
    </div>
  );
}
