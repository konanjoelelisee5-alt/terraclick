import { useApp } from "../state/app";
import { Icon } from "../components/Icon";
import { chip } from "../components/ui";
import type { Formulaire } from "../state/types";

const ETAPES = ["Projet", "Localisation", "Budget et délai", "Documents", "Accompagnement", "Équipements", "Confirmation"];

/** Ce qui manque pour continuer, étape par étape. Les étapes 4 et 6 sont facultatives. */
const AIDES = [
  "Choisissez le type de projet et le type de bien pour continuer.",
  "Indiquez la situation du terrain pour continuer.",
  "Choisissez un délai et un niveau de finition pour continuer.",
  "",
  "Choisissez un mode d'accompagnement pour continuer.",
  "",
  "",
];

const ACCOMPAGNEMENTS = [
  {
    nom: "Entreprise clé en main",
    desc: "Une entreprise unique prend en charge la coordination du chantier, les équipes, les matériaux et les finitions.",
    icon: "building-2",
  },
  {
    nom: "Artisans séparés",
    desc: "Vous choisissez séparément les maçons, plombiers, électriciens, carreleurs, peintres et autres professionnels.",
    icon: "users",
  },
  {
    nom: "Comparer les deux options",
    desc: "Recevez à la fois des propositions d'entreprises clé en main et une estimation par artisans séparés.",
    icon: "scale",
  },
  {
    nom: "Je ne sais pas encore",
    desc: "La plateforme pourra vous orienter selon votre budget, votre délai et vos besoins.",
    icon: "circle-help",
  },
];

const FICHIERS = [
  { nom: "Plan-RDC.pdf", meta: "PDF · 2,4 Mo", icon: "file-text" },
  { nom: "terrain-vue-sud.jpg", meta: "Image · 1,1 Mo", icon: "image" },
];

const TITRE_ETAPE: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontWeight: 800,
  letterSpacing: "-0.025em",
  fontSize: "clamp(24px,4vw,30px)",
  margin: 0,
};

const LEGENDE: React.CSSProperties = { fontSize: "14px", color: "var(--text-muted)" };

/**
 * Assistant de création de projet, en sept étapes.
 * Le rail permet de revenir en arrière mais jamais de sauter en avant, et
 * « Continuer » reste bloqué tant que l'étape obligatoire n'est pas renseignée.
 */
export function Assistant() {
  const { etat, set, go, poserSujetMaison } = useApp();
  const n = etat.assistStep;
  const f = etat.form;

  /** Choix simple ou multiple, écrit dans le formulaire. */
  function choix(cle: keyof Formulaire, options: string[], multi = false) {
    return options.map((nom) => {
      const courant = f[cle];
      const actif = multi ? ((courant as string[]) ?? []).includes(nom) : courant === nom;
      return {
        nom,
        actif,
        pick: () => {
          const valeur = multi
            ? ((courant as string[]) ?? []).includes(nom)
              ? (courant as string[]).filter((x) => x !== nom)
              : [...((courant as string[]) ?? []), nom]
            : nom;
          set({ form: { ...f, [cle]: valeur } });
        },
      };
    });
  }

  function Chips({ cle, options, multi = false }: { cle: keyof Formulaire; options: string[]; multi?: boolean }) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
        {choix(cle, options, multi).map((c) => (
          <button key={c.nom} onClick={c.pick} aria-pressed={c.actif} style={chip(c.actif)}>
            {c.nom}
          </button>
        ))}
      </div>
    );
  }

  const complet = [!!(f.type && f.bien), !!f.terrain, !!(f.delai && f.finition), true, !!f.accomp, true, true];
  const valide = complet[n - 1];

  const liste = (v?: string[]) => (v && v.length ? v.join(", ") : "Non renseigné");

  const recap = [
    { cle: "Type de projet", val: f.type || "Non renseigné" },
    { cle: "Type de bien", val: f.bien || "Non renseigné" },
    { cle: "Surface et pièces", val: "180 m² · 3 chambres · 2 salles de bain" },
    { cle: "Localisation", val: "Yamoussoukro · Habitat" },
    { cle: "Situation du terrain", val: f.terrain || "Non renseigné" },
    { cle: "Budget et délai", val: `12 000 000 – 18 000 000 F · ${f.delai || "délai à préciser"}` },
    { cle: "Niveau de finition", val: f.finition || "Non renseigné" },
    { cle: "Documents ajoutés", val: "2 fichiers" },
    { cle: "Mode d'accompagnement", val: f.accomp || "Non renseigné" },
    { cle: "Équipements sélectionnés", val: liste(f.equip) },
    { cle: "Services d'entretien", val: liste(f.entretien) },
  ];

  const allerEtape = (i: number) => i + 1 <= n && set({ assistStep: i + 1 });
  const suivant = () => {
    if (!valide) return;
    set({ assistStep: Math.min(7, n + 1) });
    window.scrollTo(0, 0);
  };
  const precedent = () => {
    if (n > 1) {
      set({ assistStep: n - 1 });
      window.scrollTo(0, 0);
    } else go("construction");
  };

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "26px 20px 80px" }}>
      <div data-r="steprail" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12, marginBottom: 10 }}>
        {ETAPES.map((nom, i) => {
          const courante = i + 1 === n;
          const faite = i + 1 < n;
          return (
            <button
              key={nom}
              onClick={() => allerEtape(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: i + 1 <= n ? "pointer" : "default",
                background: "none",
                border: 0,
                padding: 0,
                font: "inherit",
                fontSize: "13px",
                whiteSpace: "nowrap",
                color: courante ? "var(--kola-600)" : faite ? "var(--state-success)" : "var(--text-muted)",
                fontWeight: courante ? 700 : 400,
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  flex: "none",
                  borderRadius: "999px",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: courante ? "var(--color-accent)" : faite ? "var(--state-success)" : "var(--argile-100)",
                  color: courante || faite ? "#fff" : "var(--text-muted)",
                }}
              >
                {i + 1}
              </span>
              {nom}
            </button>
          );
        })}
      </div>

      <div style={{ height: 6, borderRadius: "999px", background: "var(--argile-100)", marginBottom: 8 }}>
        <div
          style={{
            width: `${Math.round((n / 7) * 100)}%`,
            height: 6,
            borderRadius: "999px",
            background: "var(--color-accent)",
            transition: "width 220ms cubic-bezier(.2,.8,.2,1)",
          }}
        />
      </div>
      <p style={{ fontSize: "13px", margin: "0 0 22px", color: "var(--text-muted)" }}>
        Étape {n} sur 7 · {ETAPES[n - 1]}
      </p>

      <div className="sy-card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 22 }}>
        {n === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h1 style={TITRE_ETAPE}>Parlez-nous de votre projet</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={LEGENDE}>Type de projet</span>
              <Chips
                cle="type"
                options={["Construction neuve", "Rénovation", "Extension", "Aménagement", "Équipement d'une maison existante"]}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={LEGENDE}>Type de bien</span>
              <Chips cle="bien" options={["Villa", "Immeuble", "Appartement", "Local commercial", "Bureau", "Autre"]} />
            </div>
            <div data-grid="421" style={{ gap: 14 }}>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="a-surface">
                  Surface estimée (m²)
                </label>
                <input id="a-surface" className="sy-input" placeholder="180" />
              </div>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="a-chambres">
                  Chambres
                </label>
                <input id="a-chambres" className="sy-input" placeholder="3" />
              </div>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="a-sdb">
                  Salles de bain
                </label>
                <input id="a-sdb" className="sy-input" placeholder="2" />
              </div>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="a-pieces">
                  Autres pièces
                </label>
                <input id="a-pieces" className="sy-input" placeholder="Salon, cuisine, bureau" />
              </div>
            </div>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="a-desc">
                Décrivez votre besoin
              </label>
              <textarea
                id="a-desc"
                className="sy-textarea"
                placeholder="Vos attentes, les détails importants, ce qui existe déjà…"
              />
            </div>
          </div>
        )}

        {n === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h1 style={TITRE_ETAPE}>Où se situe votre projet ?</h1>
            <div data-grid="421" style={{ gap: 14 }}>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="a-ville">
                  Ville
                </label>
                <input id="a-ville" className="sy-input" defaultValue="Yamoussoukro" />
              </div>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="a-commune">
                  Commune ou quartier
                </label>
                <input id="a-commune" className="sy-input" placeholder="Habitat" />
              </div>
            </div>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="a-adresse">
                Adresse ou point de repère
              </label>
              <input id="a-adresse" className="sy-input" placeholder="Derrière la pharmacie du Lac" />
            </div>
            <div
              style={{
                position: "relative",
                height: 190,
                borderRadius: "calc(var(--radius-lg) * 1.15)",
                overflow: "hidden",
                background: "var(--kola-50)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "-8%",
                  top: "44%",
                  width: "120%",
                  height: 12,
                  background: "var(--argile-100)",
                  transform: "rotate(-6deg)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "42%",
                  top: "-8%",
                  width: 11,
                  height: "120%",
                  background: "var(--argile-100)",
                  transform: "rotate(5deg)",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "32%",
                  top: "34%",
                  width: 34,
                  height: 34,
                  borderRadius: "999px",
                  background: "var(--color-accent)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="map-pin" size={18} />
              </span>
              <button
                className="sy-btn sy-btn--outline sy-btn--md"
                style={{ position: "absolute", right: 12, bottom: 12, background: "var(--surface-card)", fontSize: "13px" }}
              >
                Placer sur la carte
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={LEGENDE}>Situation du terrain</span>
              <Chips
                cle="terrain"
                options={[
                  "Terrain acquis avec titre foncier",
                  "Terrain acquis sans document",
                  "Terrain en cours d'acquisition",
                  "Terrain non encore acquis",
                  "Je ne possède pas encore de terrain",
                ]}
              />
            </div>
            <button className="sy-btn sy-btn--outline sy-btn--md" style={{ alignSelf: "flex-start", gap: 8 }}>
              <Icon name="paperclip" size={16} />
              Ajouter les documents du terrain (facultatif)
            </button>
          </div>
        )}

        {n === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h1 style={TITRE_ETAPE}>Budget et calendrier</h1>
            <div data-grid="421" style={{ gap: 14 }}>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="a-bmin">
                  Budget minimum (FCFA)
                </label>
                <input id="a-bmin" className="sy-input" placeholder="12 000 000" />
              </div>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="a-bmax">
                  Budget maximum (FCFA)
                </label>
                <input id="a-bmax" className="sy-input" placeholder="18 000 000" />
              </div>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="a-debut">
                  Début souhaité des travaux
                </label>
                <input id="a-debut" className="sy-input" placeholder="octobre 2026" />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={LEGENDE}>Délai souhaité</span>
              <Chips cle="delai" options={["3 mois", "6 mois", "9 mois", "12 mois et plus"]} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={LEGENDE}>Niveau de finition</span>
              <Chips
                cle="finition"
                options={["Économique", "Standard", "Haut de gamme", "À discuter avec les professionnels"]}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--kola-50)",
              }}
            >
              <Icon name="info" size={18} color="var(--kola-600)" style={{ marginTop: 1 }} />
              <span style={{ fontSize: "14px", lineHeight: 1.5 }}>
                Le budget est indicatif et sera affiné après réception des devis.
              </span>
            </div>
          </div>
        )}

        {n === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h1 style={TITRE_ETAPE}>Ajoutez vos documents</h1>
            <p style={{ fontSize: "14.5px", lineHeight: 1.55, margin: 0, color: "var(--text-muted)" }}>
              Plans architecturaux, permis, devis antérieurs, photos du terrain ou images de référence.
            </p>
            <div
              style={{
                padding: "32px 20px",
                border: "1.5px dashed var(--border-subtle)",
                borderRadius: "calc(var(--radius-lg) * 1.15)",
                background: "var(--kola-50)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Icon name="upload-cloud" size={32} color="var(--kola-600)" />
              <span style={{ fontSize: "15px", fontWeight: 600 }}>Glissez vos fichiers ici</span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                PDF, JPG ou PNG · 10 Mo maximum par fichier
              </span>
              <button
                className="sy-btn sy-btn--outline sy-btn--md"
                style={{ background: "var(--surface-card)", marginTop: 4 }}
              >
                Parcourir mes fichiers
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {FICHIERS.map((fi) => (
                <div
                  key={fi.nom}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      flex: "none",
                      borderRadius: "var(--radius-md)",
                      background: "var(--kola-50)",
                      color: "var(--kola-600)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name={fi.icon} size={18} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "14.5px", fontWeight: 600 }}>{fi.nom}</span>
                    <span style={{ display: "block", fontSize: "12.5px", color: "var(--text-muted)" }}>{fi.meta}</span>
                  </span>
                  <button className="sy-btn sy-btn--ghost sy-btn--md" style={{ fontSize: "13px" }}>
                    Prévisualiser
                  </button>
                  <button
                    aria-label={`Supprimer ${fi.nom}`}
                    style={{
                      width: 38,
                      height: 38,
                      flex: "none",
                      display: "grid",
                      placeItems: "center",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "999px",
                      background: "var(--surface-card)",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Icon name="trash-2" size={16} />
                  </button>
                </div>
              ))}
            </div>
            <Chips
              cle="sansPlan"
              options={["Je n'ai pas encore de plan et je souhaite être mis en relation avec un architecte"]}
            />
          </div>
        )}

        {n === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h1 style={TITRE_ETAPE}>Comment souhaitez-vous réaliser votre projet ?</h1>
            <div data-r="promo" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {ACCOMPAGNEMENTS.map((o) => {
                const actif = f.accomp === o.nom;
                return (
                  <button
                    key={o.nom}
                    onClick={() => set({ form: { ...f, accomp: o.nom } })}
                    aria-pressed={actif}
                    style={{
                      textAlign: "left",
                      cursor: "pointer",
                      font: "inherit",
                      color: "inherit",
                      padding: 18,
                      borderRadius: "calc(var(--radius-lg) * 1.15)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      border: actif ? "1.5px solid var(--color-accent)" : "1px solid var(--border-subtle)",
                      background: actif ? "var(--kola-50)" : "var(--surface-card)",
                      boxShadow: actif ? "var(--shadow-sm)" : "none",
                    }}
                  >
                    <span
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "var(--radius-md)",
                        background: "var(--surface-card)",
                        color: "var(--kola-600)",
                        display: "grid",
                        placeItems: "center",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <Icon name={o.icon} size={21} />
                    </span>
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "17px", lineHeight: 1.2 }}>
                      {o.nom}
                    </span>
                    <span style={{ fontSize: "13.5px", lineHeight: 1.5, color: "var(--text-muted)" }}>{o.desc}</span>
                  </button>
                );
              })}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                paddingTop: 6,
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <span style={{ fontSize: "14.5px" }}>
                Souhaitez-vous un conducteur de travaux pour coordonner les artisans ?
              </span>
              <Chips cle="conducteur" options={["Oui", "Non", "Je souhaite comparer les prix"]} />
            </div>
          </div>
        )}

        {n === 6 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div>
              <h1 style={{ ...TITRE_ETAPE, marginBottom: 8 }}>Équipements et services complémentaires</h1>
              <p style={{ fontSize: "14.5px", lineHeight: 1.55, margin: 0, color: "var(--text-muted)" }}>
                Vous pouvez demander ces services maintenant ou les ajouter plus tard. Ils ne seront inclus dans le devis
                que si vous les sélectionnez.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--kola-600)",
                }}
              >
                Équipement maison
              </span>
              <Chips
                cle="equip"
                multi
                options={[
                  "Climatisation",
                  "Panneaux solaires",
                  "Groupe électrogène",
                  "Filtration ou adoucisseur d'eau",
                  "Alarme et vidéosurveillance",
                  "Portail et porte de garage automatiques",
                  "Domotique",
                  "Meubles",
                  "Décoration intérieure",
                ]}
              />
              <div className="sy-field" style={{ marginTop: 6 }}>
                <label className="sy-field__label" htmlFor="a-equip">
                  Informations complémentaires ou budget prévu
                </label>
                <input id="a-equip" className="sy-input" placeholder="Ex. 3 splits 1,5 CV, budget 900 000 F" />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                paddingTop: 6,
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--kola-600)",
                }}
              >
                Entretien après livraison
              </span>
              <Chips
                cle="entretien"
                multi
                options={[
                  "Femme de ménage",
                  "Jardinier",
                  "Pisciniste",
                  "Désinsectisation",
                  "Entretien plomberie",
                  "Entretien électricité",
                  "Entretien climatisation",
                  "Nettoyage façade et toiture",
                ]}
              />
              <div style={{ marginTop: 6 }}>
                <Chips cle="apres" options={["Recevoir des propositions après la livraison", "Décider plus tard"]} />
              </div>
            </div>
          </div>
        )}

        {n === 7 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h1 style={TITRE_ETAPE}>Vérifiez votre projet avant publication</h1>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recap.map((r) => (
                <div
                  key={r.cle}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 18,
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontSize: "14.5px",
                  }}
                >
                  <span style={{ color: "var(--text-muted)", flex: "none" }}>{r.cle}</span>
                  <span style={{ textAlign: "right" }}>{r.val}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => set({ accepte: !etat.accepte })}
              aria-pressed={etat.accepte}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: 16,
                borderRadius: "var(--radius-md)",
                background: "var(--kola-50)",
                cursor: "pointer",
                border: 0,
                font: "inherit",
                color: "inherit",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  flex: "none",
                  borderRadius: 6,
                  display: "grid",
                  placeItems: "center",
                  background: etat.accepte ? "var(--state-success)" : "var(--surface-card)",
                  border: etat.accepte ? "1.5px solid var(--state-success)" : "1.5px solid var(--border-subtle)",
                  color: etat.accepte ? "#fff" : "transparent",
                }}
              >
                <Icon name="check" size={15} strokeWidth={2.5} />
              </span>
              <span style={{ fontSize: "14.5px", lineHeight: 1.5 }}>
                J'accepte que mon projet soit transmis à des professionnels vérifiés correspondant à ma zone et à mes
                besoins.
              </span>
            </button>
            <button
              onClick={() => etat.accepte && go("publie")}
              className="sy-btn sy-btn--primary sy-btn--md"
              disabled={!etat.accepte}
              style={{ justifyContent: "center", minHeight: 52, fontSize: "16px", ...(etat.accepte ? {} : { opacity: 0.45 }) }}
            >
              Publier mon projet
            </button>
          </div>
        )}

        {!valide && (
          <p style={{ fontSize: "13.5px", margin: 0, color: "var(--text-muted)" }}>{AIDES[n - 1]}</p>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            paddingTop: 6,
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <button onClick={precedent} className="sy-btn sy-btn--outline sy-btn--md" style={{ minHeight: 46 }}>
            Retour
          </button>
          <button
            onClick={() => poserSujetMaison()}
            className="sy-btn sy-btn--ghost sy-btn--md"
            style={{ minHeight: 46 }}
          >
            Enregistrer comme brouillon
          </button>
          {n < 7 && (
            <button
              onClick={suivant}
              className="sy-btn sy-btn--primary sy-btn--md"
              disabled={!valide}
              style={{
                flex: 1,
                minWidth: 160,
                justifyContent: "center",
                minHeight: 46,
                ...(valide ? {} : { opacity: 0.45 }),
              }}
            >
              Continuer
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
