import { useState, type ReactNode } from "react";
import { SECTEURS, VILLES } from "../../data/catalogue";
import { api, type PrestataireApi } from "../../lib/api";
import { versPrestataire } from "../../lib/annuaire";
import { CONFIG } from "../../lib/config";
import { useApi } from "../../lib/useApi";
import { useNotifications } from "../../lib/pressing";
import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { BandeauInstallation } from "../../components/Installer";
import { Dialogue } from "../../components/Dialogue";

/* Accueil sur téléphone. Grille de 8 px, marges de 20 px, 32 px entre les sections, un seul
   accent (l'orange) ; le vert est réservé aux badges « Vérifié » et à l'encart d'aide.
   Deux variantes, choisies dans CONFIG.accueilMobile. */

const GOUTTIERE = 20;

/** Texte secondaire : gris foncé, contraste d'environ 7:1 sur le fond crème (AA largement tenu). */
const GRIS = "#5C5248";

const LARGEUR_CARTE = 280;
const ECART_CARTES = 12;

const TITRE_SECTION: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
  fontSize: "20px",
  margin: 0,
};

const LIEN_VOIR_TOUT: React.CSSProperties = {
  minHeight: 44,
  padding: "0 2px",
  background: "none",
  border: 0,
  cursor: "pointer",
  font: "inherit",
  fontSize: "14px",
  fontWeight: 600,
  color: "var(--color-accent-700)",
};

const CARTE_BLANCHE: React.CSSProperties = {
  background: "var(--color-neutral-100)",
  border: "1px solid var(--color-divider)",
  borderRadius: 16,
};

/** Ombre très légère, sans halo coloré (les boutons du design system en ont un, trop fort ici). */
const OMBRE_LEGERE = "0 1px 3px rgba(26,22,19,.06)";

/** Problèmes fréquents (variante riche) : un toucher ouvre l'assistant, problème déjà choisi. */
const PROBLEMES_FREQUENTS = [
  { secteur: "plomberie", probleme: "Fuite d'eau", icone: "droplets" },
  { secteur: "climatisation", probleme: "Clim ne refroidit pas", icone: "snowflake" },
  { secteur: "electricite", probleme: "Panne de courant", icone: "zap" },
  { secteur: "serrurerie", probleme: "Porte bloquée", icone: "key-round" },
  { secteur: "menuiserie", probleme: "Réparation de meuble", icone: "hammer" },
];

/* Promesses tenues aujourd'hui par l'application, sans chiffre invérifiable. */
const CONFIANCE = [
  { icone: "shield-check", texte: "Techniciens vérifiés" },
  { icone: "banknote", texte: "Paiement direct au technicien" },
  { icone: "calendar-check", texte: "Annulation gratuite avant déplacement" },
];

function Section(props: {
  titre: string;
  sousTitre?: string;
  action?: { libelle: string; onClick: () => void };
  children: ReactNode;
}) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ padding: `0 ${GOUTTIERE}px` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 style={TITRE_SECTION}>{props.titre}</h2>
          {props.action && (
            <button onClick={props.action.onClick} style={LIEN_VOIR_TOUT}>
              {props.action.libelle}
            </button>
          )}
        </div>
        {props.sousTitre && <p style={{ margin: "2px 0 0", fontSize: "14px", color: GRIS }}>{props.sousTitre}</p>}
      </div>
      {props.children}
    </section>
  );
}

export function AccueilMobile() {
  const { etat, set, go, ville, villeIdx, demarrerBesoin, rechercher, ouvrirChat, exigerCompte } = useApp();
  const riche = CONFIG.accueilMobile === "riche";
  const { donnees: vedettes } = useApi((signal) => api.vedettes(signal), []);
  const [carteVisible, setCarteVisible] = useState(0);
  const [filtres, setFiltres] = useState(false);
  const [villeFiltre, setVilleFiltre] = useState(villeIdx);
  const prenom = etat.auth?.prenom.split(" ")[0] ?? "";
  // Le badge de la cloche ne s'affiche qu'une fois connecté.
  const { nonLues } = useNotifications(!!etat.auth);

  // La recherche mène droit aux résultats, sans passer par l'assistant : le serveur comprend
  // la phrase (« ma douche fuit » → plombiers).
  const lancerRecherche = () => rechercher();

  /** Le numéro n'est donné que par la fiche : on la charge, puis on compose ; sans numéro, la fiche s'ouvre. */
  const appeler = async (v: PrestataireApi) => {
    const fiche = await api.fiche(v.id).catch(() => null);
    if (fiche?.telephone) window.location.href = `tel:+225${fiche.telephone.replace(/\D/g, "")}`;
    else go("fiche", { fiche: v.id });
  };

  return (
    <main data-r="accueil-mobile" style={{ display: "flex", flexDirection: "column", gap: 32, paddingBottom: 32 }}>
      {/* ---- En-tête orange : salutation, cloche, recherche et filtres ---- */}
      <header
        data-r="entete-accueil"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: `calc(20px + env(safe-area-inset-top)) ${GOUTTIERE}px 28px`,
          borderRadius: "0 0 32px 32px",
          background: "linear-gradient(135deg, #E35A1B 0%, #F08A4B 100%)",
          color: "#fff",
        }}
      >
        {/* Vagues décoratives très discrètes. */}
        <svg aria-hidden="true" viewBox="0 0 390 220" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.18 }}>
          <path d="M-10 40 C 90 10, 170 70, 270 34 S 400 20, 410 30" fill="none" stroke="#fff" strokeWidth="1.5" />
          <path d="M-10 190 C 80 160, 190 215, 290 180 S 400 170, 410 176" fill="none" stroke="#fff" strokeWidth="1.5" />
        </svg>

        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <button
            data-r="salutation"
            onClick={() => (etat.auth ? go("clientDashboard") : go("connexion", { telDraft: "", apresConnexion: "clientDashboard" }))}
            style={{ flex: 1, minWidth: 0, padding: 0, border: 0, background: "none", color: "inherit", font: "inherit", textAlign: "left", cursor: "pointer" }}
          >
            <h1 style={{ margin: 0, fontSize: "28px", lineHeight: 1.2, color: "#fff" }}>
              Salut{prenom ? `, ${prenom}` : ""} <span aria-hidden="true">👋</span>
            </h1>
            <span style={{ display: "block", marginTop: 4, fontSize: "16px", fontStyle: "italic", fontWeight: 600 }}>
              Trouvez l'artisan qu'il vous faut !
            </span>
          </button>
          <button
            onClick={() => exigerCompte(() => go("clientNotifications"))}
            aria-label={nonLues ? `Notifications, ${nonLues} non lue${nonLues > 1 ? "s" : ""}` : "Notifications"}
            style={{ position: "relative", width: 52, height: 52, flex: "none", display: "grid", placeItems: "center", border: 0, borderRadius: 18, background: "rgba(255,255,255,.22)", color: "#fff", cursor: "pointer" }}
          >
            <Icon name="bell" size={24} strokeWidth={2} />
            {nonLues > 0 && (
              <span
                aria-hidden="true"
                style={{ position: "absolute", top: 6, right: 6, minWidth: 20, height: 20, padding: "0 5px", borderRadius: 999, background: "var(--state-danger)", color: "#fff", fontSize: "12px", fontWeight: 700, display: "grid", placeItems: "center" }}
              >
                {nonLues}
              </span>
            )}
          </button>
        </div>

        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            lancerRecherche();
          }}
          style={{ position: "relative", display: "flex", gap: 12, marginTop: 20 }}
        >
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6, minHeight: 60, padding: "0 16px 0 6px", borderRadius: 20, background: "#fff", boxShadow: "0 6px 18px rgba(120,40,0,.18)" }}>
            <button
              type="submit"
              data-r="search-go"
              aria-label="Rechercher"
              style={{ width: 44, height: 44, flex: "none", display: "grid", placeItems: "center", border: 0, background: "none", color: "var(--color-text)", cursor: "pointer" }}
            >
              <Icon name="search" size={24} strokeWidth={2} />
            </button>
            <input
              value={etat.query}
              onChange={(e) => set({ query: e.target.value })}
              placeholder="Rechercher un artisan..."
              aria-label="Quel est votre problème ?"
              enterKeyHint="search"
              style={{ flex: 1, minWidth: 0, minHeight: 44, border: 0, background: "none", outline: "none", font: "inherit", fontSize: "16px", color: "var(--color-text)" }}
            />
          </div>
          <button
            type="button"
            data-r="ouvrir-filtres"
            onClick={() => {
              setVilleFiltre(villeIdx);
              setFiltres(true);
            }}
            aria-label={`Filtres (ville : ${ville})`}
            style={{ width: 60, height: 60, flex: "none", display: "grid", placeItems: "center", border: 0, borderRadius: 20, background: "#fff", color: "var(--color-text)", boxShadow: "0 6px 18px rgba(120,40,0,.18)", cursor: "pointer" }}
          >
            <Icon name="sliders-horizontal" size={24} strokeWidth={2} />
          </button>
        </form>
      </header>

      {/* Filtres : la ville où l'on cherche un technicien. */}
      {filtres && (
        <Dialogue
          titre="Filtres"
          description="Choisissez la ville où vous cherchez un technicien."
          icone="map-pin"
          fond="var(--color-accent-100)"
          encre="var(--color-accent-700)"
          confirmer="Appliquer"
          onConfirmer={() => {
            set({ ville: villeFiltre, quartier: 0 });
            setFiltres(false);
          }}
          onFermer={() => setFiltres(false)}
        >
          <div role="radiogroup" aria-label="Ville" data-r="filtre-villes" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {VILLES.map((nom, i) => (
              <button
                key={nom}
                type="button"
                role="radio"
                aria-checked={villeFiltre === i}
                onClick={() => setVilleFiltre(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 48,
                  padding: "0 14px",
                  borderRadius: 14,
                  border: `1.5px solid ${villeFiltre === i ? "var(--color-accent)" : "var(--color-divider)"}`,
                  background: villeFiltre === i ? "var(--color-accent-100)" : "var(--color-neutral-100)",
                  font: "inherit",
                  fontSize: "15.5px",
                  fontWeight: 600,
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <Icon name="map-pin" size={18} color="var(--color-accent)" />
                {nom}
              </button>
            ))}
          </div>
        </Dialogue>
      )}

      {/* ---- Installation et deux actions ---- */}
      <section style={{ padding: `0 ${GOUTTIERE}px`, display: "flex", flexDirection: "column", gap: 16, marginTop: -8 }}>
        {/* Proposition d'installer l'application (icône sur l'écran d'accueil). */}
        <BandeauInstallation />

        {CONFIG.actionsAccueilMobile && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button
            onClick={() => demarrerBesoin({ quand: "maintenant" })}
            className="sy-btn sy-btn--primary sy-btn--md"
            style={{ minHeight: 52, gap: 8, justifyContent: "center", borderRadius: 14, boxShadow: OMBRE_LEGERE }}
          >
            <Icon name="siren" size={18} strokeWidth={2.5} />
            Urgence
          </button>
          <button
            onClick={() => demarrerBesoin()}
            className="sy-btn sy-btn--outline sy-btn--md"
            style={{ minHeight: 52, gap: 8, justifyContent: "center", borderRadius: 14, background: "var(--color-neutral-100)" }}
          >
            <Icon name="calendar" size={18} strokeWidth={2.5} />
            Programmer
          </button>
        </div>
        )}
      </section>

      {/* ---- Services : 4 colonnes, icône en pastille douce, libellé dessous ---- */}
      <Section titre="Services" action={{ libelle: "Voir tout", onClick: () => demarrerBesoin() }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, padding: `0 ${GOUTTIERE - 4}px` }}>
          {SECTEURS.slice(0, 4).map((s) => (
            <button
              key={s.cle}
              onClick={() => demarrerBesoin({ secteur: s.cle })}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minHeight: 92, padding: "4px 2px", background: "none", border: 0, cursor: "pointer", font: "inherit", color: "inherit" }}
            >
              <span style={{ width: 60, height: 60, borderRadius: 18, background: "var(--color-accent-100)", color: "var(--color-accent-700)", display: "grid", placeItems: "center" }}>
                <Icon name={s.icone} size={26} strokeWidth={2} />
              </span>
              <span style={{ fontSize: "12.5px", fontWeight: 600, textAlign: "center", lineHeight: 1.25 }}>{s.nom}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* ---- Variante riche : problèmes fréquents, en raccourcis ---- */}
      {riche && (
        <Section titre="Problèmes fréquents">
          <div data-r="defilement" style={{ display: "flex", gap: 8, overflowX: "auto", padding: `0 ${GOUTTIERE}px 2px`, scrollbarWidth: "none" }}>
            {PROBLEMES_FREQUENTS.map((p) => (
              <button
                key={p.probleme}
                onClick={() => demarrerBesoin({ secteur: p.secteur, probleme: p.probleme })}
                style={{ ...CARTE_BLANCHE, flex: "none", display: "flex", alignItems: "center", gap: 8, minHeight: 44, padding: "0 14px", borderRadius: 999, cursor: "pointer", font: "inherit", fontSize: "14px", color: "inherit" }}
              >
                <Icon name={p.icone} size={16} color="var(--color-accent-700)" />
                {p.probleme}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* ---- Prestataires à la une : carrousel, la carte suivante dépasse ---- */}
      {!!vedettes?.length && (
        <Section
          titre="Prestataires à la une"
          sousTitre="Recommandés et bien notés près de chez vous."
          action={{ libelle: "Voir tout", onClick: () => rechercher("Tous les prestataires", {}) }}
        >
          <div
            data-r="defilement"
            onScroll={(e) => setCarteVisible(Math.round(e.currentTarget.scrollLeft / (LARGEUR_CARTE + ECART_CARTES)))}
            style={{ display: "flex", gap: ECART_CARTES, overflowX: "auto", scrollSnapType: "x mandatory", scrollPaddingInline: GOUTTIERE, padding: `0 ${GOUTTIERE}px 4px`, scrollbarWidth: "none" }}
          >
            {vedettes.map((v) => (
              <CarteVedette key={v.id} v={v} ouvrir={() => go("fiche", { fiche: v.id })} chat={() => ouvrirChat(versPrestataire(v))} appeler={() => appeler(v)} />
            ))}
          </div>
          {vedettes.length > 1 && (
            <div aria-hidden="true" style={{ display: "flex", justifyContent: "center", gap: 6 }}>
              {vedettes.map((v, i) => (
                <span
                  key={v.id}
                  style={{
                    width: i === carteVisible ? 18 : 6,
                    height: 6,
                    borderRadius: 999,
                    background: i === carteVisible ? "var(--color-accent)" : "var(--color-neutral-300)",
                    transition: "width var(--dur-fast, .15s)",
                  }}
                />
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ---- Besoin guidé : la carte principale de la page ---- */}
      <section style={{ padding: `0 ${GOUTTIERE}px` }}>
        <div data-r="besoin-guide" style={{ borderRadius: 20, padding: 20, background: "var(--color-accent-2-100)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ ...TITRE_SECTION, fontSize: "19px", lineHeight: 1.25 }}>Une panne ? Un technicien vérifié.</h2>
              <p style={{ margin: "6px 0 0", fontSize: "14px", color: "var(--color-text)" }}>
                Décrivez votre besoin en 4 questions : nous vous proposons les meilleurs techniciens près de chez vous.
              </p>
            </div>
            {/* Emplacement d'illustration : une icône en attendant le visuel définitif. */}
            <span
              data-r="illustration-besoin"
              style={{ width: 64, height: 64, flex: "none", borderRadius: 18, background: "var(--color-neutral-100)", color: "var(--color-accent-2-800)", display: "grid", placeItems: "center" }}
            >
              <Icon name="clipboard-check" size={30} strokeWidth={1.75} />
            </span>
          </div>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", alignItems: "center", gap: 6, fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-2-800)" }}>
            {["Décrire", "Comparer", "Réserver"].map((e, i) => (
              <li key={e} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {i > 0 && <Icon name="chevron-right" size={14} />}
                {e}
              </li>
            ))}
          </ol>
          <button
            onClick={() => demarrerBesoin()}
            className="sy-btn sy-btn--primary sy-btn--md"
            style={{ minHeight: 48, gap: 8, justifyContent: "center", boxShadow: OMBRE_LEGERE }}
          >
            Décrire mon besoin
            <Icon name="arrow-right" size={18} strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {/* ---- Bandeau de confiance ---- */}
      <section style={{ padding: `0 ${GOUTTIERE}px` }}>
        <div data-r="confiance" style={{ ...CARTE_BLANCHE, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, padding: "16px 8px", background: "var(--color-surface)" }}>
          {CONFIANCE.map((c) => (
            <div key={c.texte} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
              <Icon name={c.icone} size={22} color="var(--color-accent-700)" />
              <span style={{ fontSize: "12px", fontWeight: 600, lineHeight: 1.3 }}>{c.texte}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Devenir partenaire : rang secondaire, ligne compacte ---- */}
      <section style={{ padding: `0 ${GOUTTIERE}px` }}>
        <button
          data-r="devenir-partenaire"
          onClick={() => exigerCompte(() => go(CONFIG.devenirPrestataire === "formulaire" ? "devenirPrestataire" : "proDashboard"))}
          style={{ ...CARTE_BLANCHE, width: "100%", display: "flex", alignItems: "center", gap: 12, minHeight: 64, padding: "12px 14px", background: "var(--color-bg)", cursor: "pointer", font: "inherit", color: "inherit", textAlign: "left" }}
        >
          <span style={{ width: 40, height: 40, flex: "none", borderRadius: 12, background: "var(--color-surface)", color: "var(--color-text)", display: "grid", placeItems: "center" }}>
            <Icon name="wrench" size={20} />
          </span>
          {/* Sur 390 px, le lien passe sous le texte : titre et description restent chacun sur une ligne. */}
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 700, fontSize: "15px" }}>Vous êtes prestataire ?</span>
            <span style={{ display: "block", fontSize: "13px", color: GRIS }}>Recevez les demandes de votre quartier.</span>
            <span style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 4, fontSize: "14px", fontWeight: 600, color: "var(--color-accent-700)" }}>
              Devenir partenaire
              <Icon name="chevron-right" size={16} />
            </span>
          </span>
        </button>
      </section>
    </main>
  );
}

/** Carte d'un prestataire à la une : 280 px, avatar et badge, infos en une ligne, deux actions égales. */
function CarteVedette(props: { v: PrestataireApi; ouvrir: () => void; chat: () => void; appeler: () => void }) {
  const { v } = props;
  return (
    <article
      data-r="carte-vedette"
      onClick={props.ouvrir}
      style={{
        ...CARTE_BLANCHE,
        flex: `0 0 ${LARGEUR_CARTE}px`,
        scrollSnapAlign: "start",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: OMBRE_LEGERE,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {/* Avatar 56 px : initiales tant que le prestataire n'a pas de photo ; badge « Vérifié » en coin. */}
        <span style={{ position: "relative", flex: "none" }}>
          <span
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: "var(--color-accent-100)",
              color: "var(--color-accent-700)",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: "19px",
            }}
          >
            {v.initiales}
          </span>
          {v.verifie && (
            <span
              title="Vérifié"
              style={{ position: "absolute", right: -2, bottom: -2, width: 22, height: 22, borderRadius: 999, background: "var(--color-neutral-100)", display: "grid", placeItems: "center" }}
            >
              <Icon name="badge-check" size={20} color="var(--state-success)" />
            </span>
          )}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 600, fontSize: "16px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.nom}</span>
          <span style={{ display: "block", fontSize: "14px", color: "var(--color-accent-700)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {v.metier}
          </span>
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: "13px", color: GRIS }}>
        <Icon name="star" size={14} fill="var(--rating)" color="var(--rating)" />
        <strong style={{ color: "var(--color-text)" }}>{v.note.toFixed(1).replace(".", ",")}</strong>({v.nombre_avis})
        {v.quartier && (
          <>
            <span aria-hidden="true">·</span>
            {v.quartier.nom}
          </>
        )}
        {v.verifie && (
          <span className="sy-badge sy-badge--success" style={{ marginLeft: "auto" }}>
            Vérifié
          </span>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button onClick={props.chat} className="sy-btn sy-btn--primary sy-btn--md" style={{ minHeight: 44, gap: 6, justifyContent: "center", boxShadow: "none" }}>
          <Icon name="message-circle" size={16} strokeWidth={2.5} />
          Chat
        </button>
        <button onClick={props.appeler} className="sy-btn sy-btn--outline sy-btn--md" style={{ minHeight: 44, gap: 6, justifyContent: "center" }}>
          <Icon name="phone" size={16} strokeWidth={2.5} />
          Appeler
        </button>
      </div>
    </article>
  );
}
