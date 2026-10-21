import { useEffect, useRef, useState } from "react";
import { SECTEURS, type Secteur } from "../../data/catalogue";
import { NOTIFICATIONS_CLIENT } from "../../data/client";
import { api, type ActualiteApi } from "../../lib/api";
import { retenirSecteurs, secteursRecents } from "../../lib/recents";
import { useApp } from "../../state/app";
import { Avatar } from "../../components/Avatar";
import { ChoixVille } from "../../components/ChoixVille";
import { Wordmark } from "../../components/Header";
import { Icon } from "../../components/Icon";
import { BandeauInstallation } from "../../components/Installer";
import { useEtatClient } from "../client/store";

/* Accueil sur téléphone, disposition d'une page d'accueil de navigateur (CONFIG.accueilMobile
   = « fil ») : barre du haut (logo ; ville, cloche, photo), grande barre de recherche (logo,
   micro, appareil photo), raccourcis des secteurs cherchés récemment, puis le
   fil d'actualité de la plateforme, qui se charge au fil du défilement. Tons neutres : l'orange
   ne marque que « Click » et les petites touches d'état. */

const GOUTTIERE = 16;
const GRIS = "#5C5248";

const BOUTON_ICONE: React.CSSProperties = {
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

const CARTE: React.CSSProperties = {
  background: "var(--color-neutral-100)",
  borderRadius: 28,
};


/** Reconnaissance vocale du navigateur (Chrome Android), absente ailleurs. */
type Reconnaissance = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
};
const Vocale = (window as unknown as { SpeechRecognition?: new () => Reconnaissance; webkitSpeechRecognition?: new () => Reconnaissance })
  .SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Reconnaissance }).webkitSpeechRecognition;

const secteurDeCategorie = (categorie: string | null) => SECTEURS.find((s) => s.categorie === categorie) ?? null;

export function AccueilFil() {
  const { etat, set, go, rechercher, demarrerBesoin, exigerCompte } = useApp();
  const { notificationsLues } = useEtatClient();
  const nonLues = etat.auth && !notificationsLues ? NOTIFICATIONS_CLIENT.filter((n) => n.nouveau).length : 0;
  const [ecoute, setEcoute] = useState(false);
  const photo = useRef<HTMLInputElement>(null);

  // Raccourcis : les secteurs cherchés récemment d'abord, puis les autres.
  const recents = secteursRecents();
  const raccourcis = [...SECTEURS].sort((a, b) => rang(recents, a.cle) - rang(recents, b.cle));

  const chercher = (texte = etat.query) => {
    const saisi = texte.trim();
    rechercher(saisi);
    // Le secteur compris est retenu pour les raccourcis, sans retarder les résultats.
    if (saisi) api.analyser(saisi).then((a) => retenirSecteurs(a.secteurs.map((s) => s.cle)), () => {});
  };

  const ouvrirSecteur = (s: Secteur) => {
    retenirSecteurs([s.cle]);
    rechercher(s.nom, { categorie: s.categorie });
  };

  const dicter = () => {
    if (!Vocale || ecoute) return;
    const r = new Vocale();
    r.lang = "fr-FR";
    r.interimResults = false;
    r.onresult = (e) => {
      const texte = e.results[0]?.[0]?.transcript ?? "";
      set({ query: texte });
      if (texte) chercher(texte);
    };
    r.onend = () => setEcoute(false);
    setEcoute(true);
    r.start();
  };

  return (
    <main data-r="accueil-fil" style={{ minHeight: "100vh", paddingBottom: 32, background: "var(--color-surface)" }}>
      {/* ---- Barre du haut : logo à gauche ; ville, cloche et photo de profil à droite ---- */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: `calc(10px + env(safe-area-inset-top)) ${GOUTTIERE - 4}px 0 ${GOUTTIERE}px` }}>
        <h1 style={{ margin: 0, display: "flex", fontSize: "inherit" }}>
          <Wordmark size={22} />
        </h1>
        <ChoixVille
          data-r="fil-ville"
          iconeSeule
          style={{ ...BOUTON_ICONE, marginLeft: "auto" }}
        />
        <button
          onClick={() => exigerCompte(() => go("clientNotifications"))}
          aria-label={nonLues ? `Notifications, ${nonLues} non lue${nonLues > 1 ? "s" : ""}` : "Notifications"}
          style={{ ...BOUTON_ICONE, position: "relative" }}
        >
          <Icon name="bell" size={23} strokeWidth={2} />
          {nonLues > 0 && (
            <span aria-hidden="true" style={{ position: "absolute", top: 9, right: 10, width: 9, height: 9, borderRadius: 999, background: "var(--state-danger)", border: "2px solid var(--color-surface)" }} />
          )}
        </button>
        <button
          data-r="fil-avatar"
          onClick={() => (etat.auth ? go("clientDashboard") : go("connexion", { telDraft: "", apresConnexion: "clientDashboard" }))}
          aria-label={etat.auth ? "Mon profil" : "Se connecter"}
          style={BOUTON_ICONE}
        >
          <Avatar compte={etat.auth} taille={34} />
        </button>
      </div>

      <div style={{ padding: `28px ${GOUTTIERE}px 0`, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* ---- Grande barre de recherche : logo, saisie, micro, appareil photo ---- */}
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            chercher();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            minHeight: 64,
            padding: "0 8px 0 18px",
            borderRadius: 999,
            background: "var(--color-neutral-100)",
            boxShadow: "0 1px 3px rgba(26,22,19,.08), 0 4px 14px rgba(26,22,19,.05)",
          }}
        >
          <button type="submit" data-r="search-go" aria-label="Rechercher" style={{ ...BOUTON_ICONE, width: 36, height: 36, marginLeft: -6 }}>
            <img src={`${import.meta.env.BASE_URL}icons/logo-96.png`} alt="" width={30} height={30} style={{ width: 30, height: 30, maxWidth: "none", objectFit: "contain" }} />
          </button>
          <input
            value={etat.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Rechercher sur TerraClick"
            aria-label="Quel est votre problème ?"
            enterKeyHint="search"
            style={{ flex: 1, minWidth: 0, minHeight: 44, padding: "0 6px", border: 0, outline: "none", background: "none", font: "inherit", fontSize: "17px", color: "var(--color-text)" }}
          />
          {Vocale && (
            <button
              type="button"
              onClick={dicter}
              aria-label={ecoute ? "Écoute en cours" : "Recherche vocale"}
              aria-pressed={ecoute}
              style={{ ...BOUTON_ICONE, color: ecoute ? "var(--color-accent)" : "var(--color-text)" }}
            >
              <Icon name="mic" size={22} strokeWidth={2} />
            </button>
          )}
          {/* Une photo du problème ouvre l'assistant de demande, la photo déjà jointe. */}
          <button type="button" onClick={() => photo.current?.click()} aria-label="Montrer le problème en photo" style={BOUTON_ICONE}>
            <Icon name="camera" size={22} strokeWidth={2} />
          </button>
          <input
            ref={photo}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const fichier = e.target.files?.[0];
              e.target.value = "";
              if (fichier) demarrerBesoin({ photos: [fichier] });
            }}
          />
        </form>

        {/* ---- Raccourcis : les secteurs, les plus cherchés récemment d'abord ---- */}
        <section aria-label="Raccourcis" data-r="raccourcis" style={{ ...CARTE, padding: "18px 6px 14px" }}>
          <div style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none" }}>
            {raccourcis.map((s) => (
              <button
                key={s.cle}
                onClick={() => ouvrirSecteur(s)}
                style={{ flex: "0 0 25%", minWidth: 78, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "2px 4px", border: 0, background: "none", font: "inherit", color: "inherit", cursor: "pointer" }}
              >
                <span style={{ width: 56, height: 56, borderRadius: 999, background: "var(--color-surface)", color: "var(--color-text)", display: "grid", placeItems: "center" }}>
                  <Icon name={s.icone} size={24} strokeWidth={2} />
                </span>
                <span style={{ fontSize: "13.5px", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nom}</span>
              </button>
            ))}
          </div>
        </section>

        <BandeauInstallation sobre style={{ borderRadius: 28, border: 0, boxShadow: "none", padding: "14px 16px" }} />

        {/* ---- Entrée des techniciens : ligne compacte, en retrait ---- */}
        <button
          data-r="devenir-partenaire"
          onClick={() => exigerCompte(() => go("proDashboard"))}
          style={{ ...CARTE, display: "flex", alignItems: "center", gap: 12, minHeight: 60, padding: "10px 16px", border: 0, cursor: "pointer", font: "inherit", color: "inherit", textAlign: "left" }}
        >
          <span style={{ width: 40, height: 40, flex: "none", borderRadius: 999, background: "var(--color-surface)", display: "grid", placeItems: "center" }}>
            <Icon name="wrench" size={19} />
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: "14.5px" }}>
            <strong style={{ fontWeight: 600 }}>Vous êtes technicien ?</strong>{" "}
            <span style={{ color: GRIS }}>Devenir partenaire</span>
          </span>
          <Icon name="chevron-right" size={18} color={GRIS} />
        </button>

        {/* ---- Fil d'actualité ---- */}
        <FilActualite />
      </div>
    </main>
  );
}

/** Position d'un secteur dans les recherches récentes ; ceux jamais cherchés gardent leur ordre. */
function rang(recents: string[], cle: string) {
  const i = recents.indexOf(cle);
  return i === -1 ? recents.length + SECTEURS.findIndex((s) => s.cle === cle) : i;
}

/** Le fil se charge page par page, à mesure que le bas de la liste approche. */
function FilActualite() {
  const [elements, setElements] = useState<ActualiteApi[]>([]);
  const [suivante, setSuivante] = useState<number | null>(1);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(false);
  const repere = useRef<HTMLDivElement>(null);

  const charger = async (page: number) => {
    setChargement(true);
    setErreur(false);
    try {
      const r = await api.actualites(page);
      setElements((avant) => [...avant, ...r.data.filter((n) => !avant.some((a) => a.id === n.id))]);
      setSuivante(r.meta.suivante);
    } catch {
      setErreur(true);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    const cible = repere.current;
    if (!cible || suivante === null || chargement || erreur) return;
    const observateur = new IntersectionObserver((entrees) => entrees[0]?.isIntersecting && charger(suivante), { rootMargin: "600px" });
    observateur.observe(cible);
    return () => observateur.disconnect();
  }, [suivante, chargement, erreur]);

  return (
    <section aria-label="Actualité" data-r="fil-actualite" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {elements.map((a, i) =>
        a.type === "realisation" || i % 4 === 1 ? <GrandeCarte key={a.id} actualite={a} /> : <CarteActualite key={a.id} actualite={a} />,
      )}
      {!chargement && !erreur && suivante === null && elements.length === 0 && (
        <p style={{ ...CARTE, margin: 0, padding: 20, textAlign: "center", color: GRIS, fontSize: "15px" }}>Pas encore d'actualité. Revenez bientôt !</p>
      )}
      {erreur && (
        <button onClick={() => charger(suivante ?? 1)} className="sy-btn sy-btn--outline sy-btn--md" style={{ alignSelf: "center" }}>
          Réessayer
        </button>
      )}
      {chargement && <p style={{ margin: 0, textAlign: "center", color: GRIS, fontSize: "14px" }}>Chargement…</p>}
      <div ref={repere} aria-hidden="true" style={{ height: 1 }} />
    </section>
  );
}

/** Vignette : la photo du secteur, sinon son icône sur fond neutre. */
function Visuel({ categorie, style }: { categorie: string | null; style: React.CSSProperties }) {
  const s = secteurDeCategorie(categorie);
  return s?.image ? (
    <img src={s.image} alt="" loading="lazy" style={{ objectFit: "cover", display: "block", ...style }} />
  ) : (
    <span style={{ display: "grid", placeItems: "center", background: "var(--color-surface)", color: GRIS, ...style }}>
      <Icon name={s?.icone ?? "wrench"} size={30} strokeWidth={1.75} />
    </span>
  );
}

/** Ligne du bas : secteur, quartier, date, et partage. */
function PiedCarte({ actualite: a }: { actualite: ActualiteApi }) {
  const s = secteurDeCategorie(a.prestataire.categorie);
  const partager = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const donnees = { title: "TerraClick", text: a.titre, url: window.location.origin };
    try {
      if (navigator.share) await navigator.share(donnees);
      else await navigator.clipboard.writeText(`${a.titre} — ${donnees.url}`);
    } catch {
      /* partage annulé */
    }
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
      <span style={{ width: 24, height: 24, flex: "none", borderRadius: 999, background: "var(--color-surface)", display: "grid", placeItems: "center", color: "var(--color-text)" }}>
        <Icon name={s?.icone ?? "wrench"} size={13} strokeWidth={2.25} />
      </span>
      <span style={{ flex: 1, minWidth: 0, fontSize: "13.5px", color: GRIS, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        <strong style={{ color: "var(--color-text)", fontWeight: 600 }}>{s?.nom ?? a.prestataire.metier}</strong>
        {a.prestataire.quartier ? ` · ${a.prestataire.quartier}` : ""} · {a.date_relative}
      </span>
      <button onClick={partager} aria-label="Partager" style={{ ...BOUTON_ICONE, width: 40, height: 40, color: GRIS }}>
        <Icon name="share" size={19} strokeWidth={2} />
      </button>
    </div>
  );
}

function Etoiles({ note }: { note: number }) {
  return (
    <span aria-label={`${String(note).replace(".", ",")} sur 5`} style={{ display: "inline-flex", gap: 2, color: "var(--rating)" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={15} strokeWidth={2} style={{ fill: n <= Math.round(note) ? "currentColor" : "none" }} />
      ))}
    </span>
  );
}

/** Carte compacte : texte à gauche, vignette carrée à droite. */
function CarteActualite({ actualite: a }: { actualite: ActualiteApi }) {
  const { go } = useApp();
  return (
    <article data-r="actualite" onClick={() => go("fiche", { fiche: a.prestataire.id })} style={{ ...CARTE, padding: "18px 14px 8px 20px", cursor: "pointer" }}>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 style={{ margin: 0, fontSize: "19px", lineHeight: 1.3, fontWeight: 600, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {a.titre}
          </h2>
          {a.note !== null && <Etoiles note={a.note} />}
          {a.texte && (
            <p style={{ margin: 0, fontSize: "14.5px", lineHeight: 1.45, color: GRIS, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {a.texte}
            </p>
          )}
        </div>
        <Visuel categorie={a.prestataire.categorie} style={{ width: 92, height: 92, flex: "none", borderRadius: 18 }} />
      </div>
      <PiedCarte actualite={a} />
    </article>
  );
}

/** Grande carte : photo pleine largeur en haut, texte dessous. */
function GrandeCarte({ actualite: a }: { actualite: ActualiteApi }) {
  const { go } = useApp();
  return (
    <article data-r="actualite" onClick={() => go("fiche", { fiche: a.prestataire.id })} style={{ ...CARTE, overflow: "hidden", cursor: "pointer" }}>
      <Visuel categorie={a.prestataire.categorie} style={{ width: "100%", height: 190 }} />
      <div style={{ padding: "16px 14px 8px 20px" }}>
        <h2 style={{ margin: 0, fontSize: "19px", lineHeight: 1.3, fontWeight: 600 }}>{a.titre}</h2>
        {a.note !== null && (
          <div style={{ marginTop: 6 }}>
            <Etoiles note={a.note} />
          </div>
        )}
        {a.texte && <p style={{ margin: "6px 0 0", fontSize: "14.5px", lineHeight: 1.45, color: GRIS }}>{a.texte}</p>}
        <PiedCarte actualite={a} />
      </div>
    </article>
  );
}
