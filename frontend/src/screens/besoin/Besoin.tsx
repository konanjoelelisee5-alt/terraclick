import { useEffect, useMemo } from "react";
import { SECTEURS, secteurParCle } from "../../data/catalogue";
import { api } from "../../lib/api";
import { slugifier } from "../../lib/annuaire";
import { useApi } from "../../lib/useApi";
import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { VisuelSecteur } from "../../components/VisuelSecteur";
import { CARTE } from "../../components/ui";
import { PackPressing } from "./PackPressing";
import { AIDE, CadreParcours, Choix, QUANDS, TITRE_ETAPE, estUrgent, resumeBesoin } from "./commun";

const AUTRE = "Autre";
const PHOTOS_MAX = 3;

/**
 * Assistant de besoin : le service (s'il n'est pas déjà connu), puis quatre questions —
 * le problème, le lieu, le moment, des photos facultatives — et enfin le résumé avec le
 * choix du mode de mise en relation. Aucune inscription n'est demandée ici.
 */
export function Besoin() {
  const { etat, set, go, modifierBesoin, ville } = useApp();
  const b = etat.besoin;
  const etape = etat.besoinEtape;
  const secteur = secteurParCle(b.secteur);

  const { donnees: secteursApi } = useApi(() => api.secteurs(), []);
  const { donnees: villes } = useApi(() => api.villes(), []);
  const quartiers = useMemo(
    () => [...(villes?.find((v) => v.slug === slugifier(ville))?.quartiers ?? [])].sort((x, y) => x.nom.localeCompare(y.nom, "fr")),
    [villes, ville],
  );
  const nomQuartier = quartiers.find((q) => q.id === b.quartier)?.nom ?? null;
  const problemes = [...(secteursApi?.find((s) => s.cle === b.secteur)?.problemes ?? []), AUTRE];

  // Aperçus des photos choisies, libérés quand elles changent.
  const apercus = useMemo(() => b.photos.map((f) => URL.createObjectURL(f)), [b.photos]);
  useEffect(() => () => apercus.forEach((u) => URL.revokeObjectURL(u)), [apercus]);

  const allerA = (n: number) => {
    set({ besoinEtape: n });
    window.scrollTo(0, 0);
  };

  // Ce qui manque pour passer à la suite, dit au client plutôt qu'un bouton grisé muet.
  const manque =
    etape === 0
      ? !b.secteur && "Choisissez un service."
      : etape === 1
        ? b.secteur === "pressing"
          ? !b.pack.length && "Ajoutez au moins un article à votre pack."
          : (!b.probleme && "Choisissez votre problème.") || (b.probleme === AUTRE && b.precision.trim().length < 3 && "Décrivez votre problème en quelques mots.")
        : etape === 2
          ? !b.quartier && "Indiquez votre quartier."
          : etape === 3
            ? (!b.quand && "Dites-nous quand.") || (b.quand === "date" && !b.date && "Choisissez une date.")
            : false;

  const suivant = (
    <button
      onClick={() => allerA(etape + 1)}
      disabled={!!manque}
      className="sy-btn sy-btn--primary sy-btn--md"
      style={{ flex: 1, minHeight: 50, justifyContent: "center", fontSize: "16px" }}
    >
      {etape === 4 ? (b.photos.length ? "Continuer" : "Passer cette étape") : "Continuer"}
    </button>
  );

  const aideManque = manque && etape > 0 && <p role="status" style={{ ...AIDE, margin: "14px 0 0" }}>{manque}</p>;

  /* ---- 0 · Quel service ? ---- */
  if (etape === 0) {
    const ordre = [...SECTEURS].sort((x, y) => Number(b.suggestions.includes(y.cle)) - Number(b.suggestions.includes(x.cle)));
    return (
      <CadreParcours retour={() => go("home")}>
        <h1 style={TITRE_ETAPE}>De quel service avez-vous besoin ?</h1>
        <p style={AIDE}>
          {b.suggestions.length ? "Votre recherche peut concerner plusieurs services : précisez lequel." : "Choisissez un service pour commencer."}
        </p>
        <div data-r="choix-service" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {ordre.map((s) => (
            <button
              key={s.cle}
              onClick={() => {
                modifierBesoin({ secteur: s.cle, probleme: null, precision: "" });
                allerA(1);
              }}
              style={{ ...CARTE, padding: 0, overflow: "hidden", cursor: "pointer", font: "inherit", color: "inherit", textAlign: "left" }}
            >
              <VisuelSecteur secteur={s} hauteur={96} />
              <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px", fontWeight: 600 }}>
                {s.nom}
                {b.suggestions.includes(s.cle) && <span className="sy-badge sy-badge--brand" style={{ marginLeft: "auto" }}>Suggéré</span>}
              </span>
            </button>
          ))}
        </div>
      </CadreParcours>
    );
  }

  /* ---- 5 · Résumé et choix du mode ---- */
  if (etape === 5) {
    const resume = resumeBesoin(b, nomQuartier);
    const urgent = estUrgent(b);
    const metier = secteur?.metier.toLowerCase() ?? "technicien";

    // Technicien déjà choisi depuis sa fiche : il ne reste qu'à confirmer.
    if (b.prestataire) {
      return (
        <CadreParcours
          retour={() => allerA(4)}
          actions={
            <button onClick={() => go("confirmation")} className="sy-btn sy-btn--primary sy-btn--md" style={{ flex: 1, minHeight: 50, justifyContent: "center", fontSize: "16px" }}>
              Continuer avec {b.prestataire.nom}
            </button>
          }
        >
          <Resume texte={resume} />
        </CadreParcours>
      );
    }

    const cartes = [
      {
        cle: "recommande",
        titre: "Trouver pour moi",
        texte: `Nous vous proposons les 3 meilleurs ${metier}s disponibles près de vous.`,
        bouton: "Trouver pour moi",
        icone: "sparkles",
        action: () => {
          modifierBesoin({ mode: "recommande" });
          go("recommandations");
        },
      },
      {
        cle: "choisi",
        titre: "Comparer",
        texte: `Consultez les ${metier}s vérifiés, leurs avis, leurs zones et leurs délais de réponse.`,
        bouton: "Choisir moi-même",
        icone: "list-checks",
        action: () => {
          modifierBesoin({ mode: "choisi" });
          go("results", { titre: secteur?.nom ?? "", filtre: { q: secteur?.nom ?? "" }, quartier: 0, carte: false });
        },
      },
    ];
    // Urgence : « Trouver pour moi » d'abord ; travaux planifiés : « Comparer » d'abord.
    if (!urgent) cartes.reverse();

    return (
      <CadreParcours retour={() => allerA(4)}>
        <Resume texte={resume} />
        <h2 style={{ fontSize: "20px", margin: "26px 0 12px" }}>Comment voulez-vous trouver votre {metier} ?</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cartes.map((c, i) => (
            <div
              key={c.cle}
              data-r={`mode-${c.cle}`}
              style={{
                ...CARTE,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                border: i === 0 ? "1.5px solid var(--color-accent)" : CARTE.border,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name={c.icone} size={20} color="var(--color-accent-700)" />
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "17px" }}>{c.titre}</span>
                {i === 0 && <span className="sy-badge sy-badge--brand" style={{ marginLeft: "auto" }}>Recommandé</span>}
              </div>
              <p style={{ margin: 0, fontSize: "14.5px", color: "var(--color-neutral-700)" }}>{c.texte}</p>
              <button
                onClick={c.action}
                className={`sy-btn sy-btn--${i === 0 ? "primary" : "outline"} sy-btn--md`}
                style={{ minHeight: 48, justifyContent: "center" }}
              >
                {c.bouton}
              </button>
            </div>
          ))}
        </div>
      </CadreParcours>
    );
  }

  /* ---- 1 à 4 · les quatre questions ---- */
  return (
    <CadreParcours
      retour={() => (etape === 1 && !b.suggestions.length && !b.prestataire ? go("home") : allerA(etape - 1))}
      etape={`${secteur?.nom ?? ""} · Étape ${etape} sur 4`}
      progression={etape / 4}
      actions={suivant}
    >
      {/* Pressing : le client compose son pack plutôt que de choisir un problème. */}
      {etape === 1 && b.secteur === "pressing" && <PackPressing />}

      {etape === 1 && b.secteur !== "pressing" && (
        <>
          <h1 style={TITRE_ETAPE}>Quel est le problème ?</h1>
          <p style={AIDE}>Choisissez ce qui ressemble le plus à votre situation.</p>
          <div role="radiogroup" aria-label="Problème" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {problemes.map((p) => (
              <Choix key={p} actif={b.probleme === p} onClick={() => modifierBesoin({ probleme: p })} titre={p} />
            ))}
          </div>
          {b.probleme && (
            <div className="sy-field" style={{ marginTop: 16 }}>
              <label className="sy-field__label" htmlFor="besoin-precision">
                {b.probleme === AUTRE ? "Décrivez votre problème" : "Un détail à ajouter ? (facultatif)"}
              </label>
              <textarea
                id="besoin-precision"
                className="sy-textarea"
                maxLength={500}
                value={b.precision}
                onChange={(e) => modifierBesoin({ precision: e.target.value })}
                placeholder="Ex. l'eau coule sous l'évier depuis ce matin"
                style={{ borderRadius: "var(--radius-md)" }}
              />
            </div>
          )}
        </>
      )}

      {etape === 2 && (
        <>
          <h1 style={TITRE_ETAPE}>Où êtes-vous ?</h1>
          <p style={AIDE}>Le technicien voit seulement votre quartier tant qu'il n'a pas accepté.</p>
          {quartiers.length === 0 && villes ? (
            <p role="alert" style={{ ...AIDE, color: "var(--color-accent-700)" }}>
              TerraClick n'est pas encore disponible à {ville}. Choisissez une autre ville en haut de l'écran.
            </p>
          ) : (
            <>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="besoin-quartier">
                  Quartier à {ville}
                </label>
                <select
                  id="besoin-quartier"
                  className="sy-input"
                  value={b.quartier ?? ""}
                  onChange={(e) => modifierBesoin({ quartier: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">Choisissez votre quartier</option>
                  {quartiers.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sy-field" style={{ marginTop: 14 }}>
                <label className="sy-field__label" htmlFor="besoin-repere">
                  Adresse ou point de repère (facultatif)
                </label>
                <input
                  id="besoin-repere"
                  className="sy-input"
                  maxLength={160}
                  value={b.repere}
                  onChange={(e) => modifierBesoin({ repere: e.target.value })}
                  placeholder="Ex. derrière la pharmacie du marché"
                />
              </div>
            </>
          )}
        </>
      )}

      {etape === 3 && (
        <>
          <h1 style={TITRE_ETAPE}>Quand en avez-vous besoin ?</h1>
          <p style={AIDE}>En cas d'urgence, nous cherchons un technicien disponible tout de suite.</p>
          <div role="radiogroup" aria-label="Quand" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {QUANDS.map((q) => (
              <Choix
                key={q.valeur}
                actif={b.quand === q.valeur}
                onClick={() => modifierBesoin({ quand: q.valeur })}
                titre={q.libelle}
                detail={q.detail}
                icone={q.valeur === "maintenant" ? "siren" : q.valeur === "date" ? "calendar" : "clock"}
              />
            ))}
          </div>
          {b.quand === "date" && (
            <div className="sy-field" style={{ marginTop: 14 }}>
              <label className="sy-field__label" htmlFor="besoin-date">
                Date souhaitée
              </label>
              <input
                id="besoin-date"
                type="date"
                className="sy-input"
                min={new Date().toISOString().slice(0, 10)}
                value={b.date}
                onChange={(e) => modifierBesoin({ date: e.target.value })}
              />
            </div>
          )}
        </>
      )}

      {etape === 4 && (
        <>
          <h1 style={TITRE_ETAPE}>Ajoutez des photos</h1>
          <p style={AIDE}>Facultatif, jusqu'à {PHOTOS_MAX} photos : le technicien comprend mieux et prévoit le bon matériel.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {apercus.map((url, i) => (
              <div key={url} style={{ position: "relative", width: 100, height: 100, borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                <img src={url} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  onClick={() => modifierBesoin({ photos: b.photos.filter((_, j) => j !== i) })}
                  aria-label={`Retirer la photo ${i + 1}`}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    border: 0,
                    background: "rgba(0,0,0,.6)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
            ))}
            {b.photos.length < PHOTOS_MAX && (
              <label
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "var(--radius-md)",
                  border: "1.5px dashed var(--color-divider)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  fontSize: "12.5px",
                  color: "var(--color-neutral-700)",
                  cursor: "pointer",
                }}
              >
                <Icon name="camera" size={22} />
                Ajouter
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  aria-label="Ajouter des photos"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const nouvelles = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
                    modifierBesoin({ photos: [...b.photos, ...nouvelles].slice(0, PHOTOS_MAX) });
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </>
      )}

      {aideManque}
    </CadreParcours>
  );
}

function Resume({ texte }: { texte: string }) {
  return (
    <div data-r="resume-besoin" style={{ ...CARTE, padding: 18, background: "var(--color-accent-100)", border: "1px solid var(--color-accent-200)" }}>
      <div style={{ fontSize: "12.5px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
        Votre demande
      </div>
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "18px", margin: "4px 0 6px" }}>{texte}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "14px", color: "var(--color-neutral-700)" }}>
        <Icon name="shield-check" size={16} color="var(--state-success)" />
        Vous pouvez recevoir un technicien vérifié rapidement.
      </div>
    </div>
  );
}
