import { useEffect, useRef, useState } from "react";
import { SECTEURS } from "../data/catalogue";
import { api } from "../lib/api";
import { slugifier, versPrestataire } from "../lib/annuaire";
import { useApi } from "../lib/useApi";
import { useApp } from "../state/app";
import { Icon } from "../components/Icon";
import { PastilleChoix, TRIS, type Tri } from "./Results";

/* Résultats sur téléphone, mis en page comme une page de résultats de moteur de recherche
   (CONFIG.resultatsMobile = « moteur ») : barre de recherche, onglets (Tous, puis les
   services), conseil, puis chaque technicien en résultat : nom en petit, grand titre, extrait,
   note et délai. L'en-tête de l'application reste celui de toutes les pages. */

const GRIS = "#5C5248";
const GOUTTIERE = 16;

/** Reconnaissance vocale du navigateur (Chrome Android), absente ailleurs. */
type Reconnaissance = {
  lang: string;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
};
const Vocale = (window as unknown as { SpeechRecognition?: new () => Reconnaissance; webkitSpeechRecognition?: new () => Reconnaissance })
  .SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Reconnaissance }).webkitSpeechRecognition;

export function ResultatsMobile() {
  const { etat, set, go, rechercher, ouvrirChat, demarrerBesoin, ville } = useApp();
  const [essai, setEssai] = useState(0);
  const [filtreOuvert, setFiltreOuvert] = useState<"quartier" | "tri">("quartier");
  const [menu, setMenu] = useState<number | null>(null);
  const [ecoute, setEcoute] = useState(false);
  const [saisie, setSaisie] = useState(etat.filtre.q ?? etat.titre ?? "");
  // Une nouvelle recherche (onglet, historique) remet la barre à jour.
  useEffect(() => setSaisie(etat.filtre.q ?? etat.titre ?? ""), [etat.filtre.q, etat.titre]);

  const villeSlug = slugifier(ville);
  const { donnees: villes } = useApi(() => api.villes(), []);
  const quartiers = villes?.find((v) => v.slug === villeSlug)?.quartiers ?? [];
  const recherche = useApi(
    (signal) => api.rechercher({ ...etat.filtre, ville: villeSlug, quartier: etat.quartier || undefined, par_page: 50 }, signal),
    [JSON.stringify(etat.filtre), etat.quartier, villeSlug, essai],
  );
  const resultats = recherche.donnees?.data.map(versPrestataire) ?? [];
  const total = recherche.donnees?.meta.total ?? 0;
  const demande = etat.filtre.q;
  const compris = demande ? (recherche.donnees?.analyse?.secteurs ?? []) : [];
  const titre = compris.length ? compris.join(" ou ") : etat.titre;
  // Onglet souligné : le service choisi, ou le seul service compris dans la phrase.
  const ongletActif =
    SECTEURS.find((s) => s.categorie === etat.filtre.categorie)?.cle ??
    (compris.length === 1 ? SECTEURS.find((s) => s.nom === compris[0])?.cle : undefined) ??
    "tous";

  const chercher = (texte = saisie) => rechercher(texte.trim());

  const dicter = () => {
    if (!Vocale || ecoute) return;
    const r = new Vocale();
    r.lang = "fr-FR";
    r.onresult = (e) => {
      const texte = e.results[0]?.[0]?.transcript ?? "";
      setSaisie(texte);
      if (texte) chercher(texte);
    };
    r.onend = () => setEcoute(false);
    setEcoute(true);
    r.start();
  };

  return (
    <main data-r="resultats-mobile" style={{ paddingBottom: 32, background: "var(--color-bg)" }}>
      {/* ---- Barre de recherche ---- */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          chercher();
        }}
        style={{
          margin: `12px ${GOUTTIERE}px 0`,
          display: "flex",
          alignItems: "center",
          gap: 2,
          minHeight: 56,
          padding: "0 6px 0 4px",
          borderRadius: 999,
          background: "var(--color-neutral-100)",
          boxShadow: "0 1px 3px rgba(26,22,19,.10), 0 4px 14px rgba(26,22,19,.06)",
        }}
      >
        <button type="submit" data-r="search-go" aria-label="Rechercher" style={BOUTON}>
          <Icon name="search" size={21} />
        </button>
        <input
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          aria-label="Quel est votre problème ?"
          placeholder="Rechercher sur TerraClick"
          enterKeyHint="search"
          style={{ flex: 1, minWidth: 0, minHeight: 44, border: 0, outline: "none", background: "none", font: "inherit", fontSize: "17px", color: "var(--color-text)" }}
        />
        {saisie && (
          <button type="button" onClick={() => setSaisie("")} aria-label="Effacer la recherche" style={BOUTON}>
            <Icon name="x" size={20} />
          </button>
        )}
        {Vocale && (
          <>
            <span aria-hidden="true" style={{ width: 1, height: 24, background: "var(--color-divider)" }} />
            <button type="button" onClick={dicter} aria-label={ecoute ? "Écoute en cours" : "Recherche vocale"} style={{ ...BOUTON, color: ecoute ? "var(--color-accent)" : "var(--color-text)" }}>
              <Icon name="mic" size={21} />
            </button>
          </>
        )}
      </form>

      {/* ---- Onglets : Tous, puis chaque service ---- */}
      <nav aria-label="Services" data-r="onglets-resultats" style={{ display: "flex", gap: 22, overflowX: "auto", scrollbarWidth: "none", padding: `14px ${GOUTTIERE + 4}px 0`, borderBottom: "1px solid var(--color-divider)" }}>
        {[{ cle: "tous", nom: "Tous" }, ...SECTEURS].map((s) => {
          const actif = s.cle === ongletActif;
          return (
            <button
              key={s.cle}
              aria-current={actif ? "page" : undefined}
              onClick={() => {
                if (s.cle === "tous") rechercher(demande ?? "");
                else {
                  const secteur = SECTEURS.find((x) => x.cle === s.cle)!;
                  rechercher(secteur.nom, { categorie: secteur.categorie });
                }
              }}
              style={{
                flex: "none",
                padding: "6px 0 10px",
                border: 0,
                borderBottom: `3px solid ${actif ? "var(--color-text)" : "transparent"}`,
                background: "none",
                font: "inherit",
                fontSize: "16px",
                fontWeight: actif ? 700 : 500,
                color: actif ? "var(--color-text)" : GRIS,
                cursor: "pointer",
              }}
            >
              {s.nom}
            </button>
          );
        })}
      </nav>

      {/* ---- Titre, nombre de résultats, Quartier et Trier ---- */}
      <div data-r="results-head" style={{ display: "flex", alignItems: "center", gap: 10, padding: `14px ${GOUTTIERE}px 4px` }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 data-r="results-titre" style={{ margin: 0, fontSize: "18px", fontWeight: 800, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {titre}
          </h1>
          <span role="status" style={{ fontSize: "13px", color: GRIS }}>
            {recherche.chargement ? "Recherche en cours…" : `${total} résultat${total > 1 ? "s" : ""} · ${ville}`}
          </span>
        </div>
        <div data-r="filtres" style={{ flex: "none", display: "flex", gap: 6 }}>
          <PastilleChoix
            icone="map-pin"
            libelle="Quartier"
            actif={!!etat.quartier}
            valeur={String(etat.quartier)}
            options={[
              { valeur: "0", libelle: "Tous les quartiers" },
              ...[...quartiers].sort((a, b) => a.nom.localeCompare(b.nom, "fr")).map((q) => ({ valeur: String(q.id), libelle: q.nom })),
            ]}
            onChange={(v) => set({ quartier: Number(v) })}
            reduite={filtreOuvert !== "quartier"}
            onOuvrir={() => setFiltreOuvert("quartier")}
          />
          <PastilleChoix
            icone="arrow-up-down"
            libelle="Trier"
            actif={!!etat.filtre.tri && etat.filtre.tri !== "pertinence"}
            valeur={etat.filtre.tri ?? "pertinence"}
            options={TRIS}
            onChange={(v) => set({ filtre: { ...etat.filtre, tri: v as Tri } })}
            reduite={filtreOuvert !== "tri"}
            onOuvrir={() => setFiltreOuvert("tri")}
          />
        </div>
      </div>

      {/* ---- Conseil ---- */}
      <p data-r="conseil" style={{ margin: 0, padding: `6px ${GOUTTIERE}px 14px`, fontSize: "15px", lineHeight: 1.5, color: GRIS }}>
        {compris.length > 0 && demande !== titre ? (
          <>
            D'après votre demande « {demande} ». Vous hésitez ?{" "}
          </>
        ) : (
          <>Conseil : </>
        )}
        <button onClick={() => demarrerBesoin()} style={LIEN}>
          laissez TerraClick choisir pour vous
        </button>
        .
      </p>

      {recherche.erreur && (
        <div role="alert" style={{ ...BLOC, textAlign: "center" }}>
          <p style={{ margin: "0 0 12px" }}>La recherche n'a pas abouti. {recherche.erreur}</p>
          <button onClick={() => setEssai((n) => n + 1)} className="sy-btn sy-btn--primary sy-btn--md">
            Réessayer
          </button>
        </div>
      )}

      {/* ---- Résultats ---- */}
      <div aria-busy={recherche.chargement} style={{ opacity: recherche.chargement && resultats.length ? 0.55 : 1 }}>
        {resultats.map((p) => {
          const voirFiche = () => go("fiche", { fiche: p.id ?? null });
          return (
            <article key={p.id ?? p.nom} data-r="resultat" style={BLOC}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 32, height: 32, flex: "none", borderRadius: 999, background: "var(--color-surface)", border: "1px solid var(--color-divider)", display: "grid", placeItems: "center", fontSize: "12px", fontWeight: 700 }}>
                  {p.ini}
                </span>
                <button onClick={voirFiche} style={{ flex: 1, minWidth: 0, padding: 0, border: 0, background: "none", font: "inherit", color: "inherit", textAlign: "left", cursor: "pointer" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "14.5px", fontWeight: 600 }}>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nom}</span>
                    {p.verifie && <Icon name="badge-check" size={15} color="var(--state-success)" style={{ flex: "none" }} />}
                  </span>
                  <span style={{ display: "block", fontSize: "13px", color: GRIS, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {[p.metier, p.quartier, p.dist].filter(Boolean).join(" · ")}
                  </span>
                </button>
                <div style={{ position: "relative", flex: "none" }}>
                  <button onClick={() => setMenu(menu === p.id ? null : (p.id ?? null))} aria-label={`Actions pour ${p.nom}`} aria-expanded={menu === p.id} style={BOUTON}>
                    <Icon name="ellipsis-vertical" size={20} />
                  </button>
                  {menu === p.id && <MenuResultat onFermer={() => setMenu(null)} actions={[
                    { icone: "user", libelle: "Voir le profil", action: voirFiche },
                    { icone: "message-circle", libelle: "Chat", action: () => ouvrirChat(p) },
                    { icone: "phone", libelle: "Appeler", action: () => ouvrirChat(p) },
                  ]} />}
                </div>
              </div>

              <button onClick={voirFiche} data-r="titre-resultat" style={{ display: "block", width: "100%", margin: "10px 0 0", padding: 0, border: 0, background: "none", font: "inherit", textAlign: "left", cursor: "pointer", fontSize: "20px", lineHeight: 1.3, fontWeight: 500, color: "var(--color-accent-700)" }}>
                {p.metier}
                {p.quartier ? ` à ${p.quartier}` : ""} · {p.prix}
              </button>
              {p.desc && (
                <p style={{ margin: "6px 0 0", fontSize: "15px", lineHeight: 1.5, color: GRIS, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.desc}</p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 8, fontSize: "14px", color: GRIS }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <strong style={{ color: "var(--color-text)" }}>{p.note}</strong>
                  <Icon name="star" size={14} fill="var(--rating)" color="var(--rating)" />({p.avis})
                </span>
                {p.delai && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Icon name="clock" size={14} />
                    Répond en {p.delai}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!recherche.chargement && !recherche.erreur && resultats.length === 0 && (
        <div style={{ ...BLOC, textAlign: "center" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: "19px" }}>{etat.quartier ? "Personne dans ce quartier pour l'instant" : "Aucun prestataire pour cette recherche"}</h2>
          <p style={{ margin: "0 0 14px", fontSize: "14.5px", color: GRIS }}>
            {etat.quartier ? "Changez de quartier" : "Essayez un service"}, ou décrivez votre besoin : nous vous proposons les meilleurs techniciens.
          </p>
          <button onClick={() => demarrerBesoin()} className="sy-btn sy-btn--primary sy-btn--md">
            Décrire mon besoin
          </button>
        </div>
      )}
    </main>
  );
}

/** Petit menu ⋮ d'un résultat. */
function MenuResultat({ actions, onFermer }: { actions: { icone: string; libelle: string; action: () => void }[]; onFermer: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const dehors = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onFermer();
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    document.addEventListener("mousedown", dehors);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("mousedown", dehors);
      document.removeEventListener("keydown", echap);
    };
  }, [onFermer]);
  return (
    <div ref={ref} role="menu" style={{ position: "absolute", right: 0, top: 44, zIndex: 30, minWidth: 190, padding: "6px 0", borderRadius: 16, background: "var(--color-neutral-100)", boxShadow: "0 10px 30px rgba(26,22,19,.18)" }}>
      {actions.map((a) => (
        <button
          key={a.libelle}
          role="menuitem"
          onClick={() => {
            onFermer();
            a.action();
          }}
          style={{ width: "100%", minHeight: 48, display: "flex", alignItems: "center", gap: 14, padding: "0 18px", border: 0, background: "none", font: "inherit", fontSize: "15.5px", color: "var(--color-text)", textAlign: "left", cursor: "pointer" }}
        >
          <Icon name={a.icone} size={19} />
          {a.libelle}
        </button>
      ))}
    </div>
  );
}

const BOUTON: React.CSSProperties = {
  width: 44,
  height: 44,
  flex: "none",
  display: "grid",
  placeItems: "center",
  border: 0,
  borderRadius: 999,
  background: "none",
  color: "var(--color-text)",
  cursor: "pointer",
};

/** Chaque résultat sur fond blanc, séparé du suivant par une bande grise. */
const BLOC: React.CSSProperties = {
  padding: `16px ${GOUTTIERE}px 18px`,
  background: "var(--color-neutral-100)",
  borderTop: "8px solid var(--color-surface)",
};

const LIEN: React.CSSProperties = {
  padding: 0,
  border: 0,
  background: "none",
  font: "inherit",
  color: "var(--color-accent-700)",
  fontWeight: 600,
  cursor: "pointer",
};
