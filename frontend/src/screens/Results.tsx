import { useEffect, useState } from "react";
import { REGEX_BTP, SECTEURS } from "../data/catalogue";
import { useApp } from "../state/app";
import { api, type CriteresRecherche } from "../lib/api";
import { CONFIG } from "../lib/config";
import { slugifier, versPrestataire } from "../lib/annuaire";
import { useApi } from "../lib/useApi";
import { Icon } from "../components/Icon";
import { MapCanvas } from "../components/MapCanvas";
import { CARTE, pill, tab } from "../components/ui";
import { resumeBesoin } from "./besoin/commun";
import { useEstMobile } from "../lib/useEstMobile";
import { ResultatsMobile } from "./ResultatsMobile";
import { noterContact, retenirContexteRecherche } from "../lib/contacts";

const BLOC_VIDE: React.CSSProperties = {
  textAlign: "center",
  padding: "56px 20px",
  background: "var(--color-surface)",
  borderRadius: "calc(var(--radius-lg) * 1.15)",
};

export type Tri = NonNullable<CriteresRecherche["tri"]>;

/** Tris proposés au client ; la distance attend « Autour de moi », masqué dans le MVP. */
export const TRIS: { valeur: Tri; libelle: string }[] = [
  { valeur: "pertinence", libelle: "Pertinence" },
  { valeur: "note", libelle: "Mieux notés" },
  { valeur: "avis", libelle: "Plus d'avis" },
  { valeur: "reponse", libelle: "Répond le plus vite" },
];

const BOUTON_ROND: React.CSSProperties = {
  width: 44,
  height: 44,
  flex: "none",
  display: "grid",
  placeItems: "center",
  borderRadius: "999px",
  border: "1px solid var(--color-divider)",
  background: "var(--color-neutral-100)",
  color: "inherit",
  cursor: "pointer",
};

const LIGNE_DISCRETE: React.CSSProperties = {
  display: "block",
  margin: "2px 0 0",
  fontSize: "13.5px",
  color: "var(--color-neutral-700)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const LIEN_EFFACER: React.CSSProperties = {
  flex: "none",
  minHeight: 40,
  padding: "0 6px",
  background: "none",
  border: 0,
  cursor: "pointer",
  font: "inherit",
  fontSize: "13.5px",
  color: "var(--color-accent-700)",
  textDecoration: "underline",
};

/** Vignette carrée aux coins arrondis, à la place de la photo du prestataire. */
const VIGNETTE: React.CSSProperties = {
  width: 96,
  height: 96,
  flex: "none",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-accent-200)",
  display: "grid",
  placeItems: "center",
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
  fontSize: "26px",
  color: "var(--color-accent-800)",
};

const NOM_PRO: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
  fontSize: "17px",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const PRIX: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
  fontSize: "15px",
  color: "var(--color-accent-700)",
};

const META: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: "13px",
  color: "var(--color-neutral-700)",
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

/**
 * Pastille de filtre (« Quartier ▾ ») : allure de bouton, liste native du téléphone au
 * toucher. Elle s'allume quand un choix autre que celui par défaut est actif. Réduite
 * (`reduite`), elle ne montre que son icône ; la toucher l'ouvre et réduit sa voisine.
 */
export function PastilleChoix(props: {
  icone: string;
  libelle: string;
  actif: boolean;
  valeur: string;
  options: { valeur: string; libelle: string }[];
  onChange: (valeur: string) => void;
  reduite?: boolean;
  onOuvrir?: () => void;
}) {
  const choisi = props.options.find((o) => o.valeur === props.valeur);
  const reduite = !!props.reduite;
  return (
    <label
      data-r="pastille-filtre"
      data-reduite={reduite ? "oui" : "non"}
      title={reduite ? props.libelle : undefined}
      style={{
        ...pill(props.actif),
        position: "relative",
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: reduite ? 0 : 7,
        minHeight: 40,
        minWidth: 40,
        padding: reduite ? 0 : "0 14px",
        transition: "padding var(--dur-fast, .2s) ease, gap var(--dur-fast, .2s) ease",
      }}
    >
      <Icon name={props.icone} size={16} strokeWidth={2.25} />
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          maxWidth: reduite ? 0 : 160,
          overflow: "hidden",
          whiteSpace: "nowrap",
          opacity: reduite ? 0 : 1,
          transition: "max-width var(--dur-fast, .2s) ease, opacity var(--dur-fast, .2s) ease",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{props.actif && choisi ? choisi.libelle : props.libelle}</span>
        <Icon name="chevron-down" size={14} strokeWidth={2.25} style={{ opacity: 0.7, flex: "none" }} />
      </span>
      <select
        value={props.valeur}
        onChange={(e) => props.onChange(e.target.value)}
        // Le toucher ouvre la liste du téléphone et, en même temps, déplie la pastille.
        onPointerDown={props.onOuvrir}
        onFocus={props.onOuvrir}
        aria-label={props.libelle}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", font: "inherit" }}
      >
        {props.options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Deux lignes au plus : la fiche donne le détail. */
const DESCRIPTION: React.CSSProperties = {
  color: "var(--color-neutral-700)",
  fontSize: "14px",
  lineHeight: 1.5,
  margin: 0,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const AVANTAGES_BTP = [
  { icon: "scale", texte: "Comparez les offres" },
  { icon: "wallet", texte: "Paiement par étapes" },
  { icon: "hard-hat", texte: "Suivi du chantier" },
];

export function Results() {
  // Sur téléphone : page de résultats façon moteur de recherche (CONFIG.resultatsMobile).
  const estMobile = useEstMobile();
  return estMobile && CONFIG.resultatsMobile === "moteur" ? <ResultatsMobile /> : <ResultatsCartes />;
}

function ResultatsCartes() {
  const { etat, set, go, rechercher, ouvrirChat, exigerCompte, voirCarte, ville, demarrerBesoin } = useApp();
  // Le client compare après avoir décrit son besoin (« Choisir moi-même ») : on le lui rappelle.
  const besoinEnCours = !!etat.besoin.secteur && !!etat.besoin.quartier && etat.besoin.mode === "choisi";

  const [essai, setEssai] = useState(0);
  // Pastille dépliée à droite du titre : Quartier d'abord, Trier réduit à son icône.
  const [filtreOuvert, setFiltreOuvert] = useState<"quartier" | "tri">("quartier");

  const villeSlug = slugifier(ville);
  const { donnees: villes } = useApi(() => api.villes(), []);
  const quartiers = [{ id: 0, nom: "Tous" }, ...(villes?.find((v) => v.slug === villeSlug)?.quartiers ?? [])];

  const recherche = useApi(
    (signal) =>
      api.rechercher({ ...etat.filtre, ville: villeSlug, quartier: etat.quartier || undefined, par_page: 50 }, signal),
    [JSON.stringify(etat.filtre), etat.quartier, villeSlug, essai],
  );
  const filtres = recherche.donnees?.data.map(versPrestataire) ?? [];
  const total = recherche.donnees?.meta.total ?? 0;
  // Demande en texte libre (« ma douche fuit ») : le serveur en déduit le secteur, qui sert
  // de titre ; la phrase du client est rappelée dessous.
  const demande = etat.filtre.q;
  const compris = demande ? (recherche.donnees?.analyse?.secteurs ?? []) : [];
  const titre = recherche.donnees?.analyse?.prestation?.nom ?? (compris.length ? compris.join(" ou ") : etat.titre);
  // La recherche accompagne le technicien qui sera contacté (onglets).
  const prestationReconnue = recherche.donnees?.analyse?.prestation ?? null;
  useEffect(() => retenirContexteRecherche(demande ?? etat.titre ?? null, prestationReconnue), [demande, etat.titre, prestationReconnue]);
  // Une recherche BTP remplace le bandeau de suivi générique par l'accompagnement construction.
  // L'un et l'autre mènent au module Construction : sans lui (MVP), aucun des deux n'apparaît.
  const estBtp = CONFIG.moduleConstruction && REGEX_BTP.test(etat.titre || "");
  const proposerSuivi = CONFIG.moduleConstruction && !estBtp;

  const ouvrirAssistant = () => exigerCompte(() => go("assistant", { assistStep: 1 }));

  return (
    <main data-r="container" style={{ paddingTop: 26, paddingBottom: 60 }}>

      {estBtp && (
        <div
          className="sy-weave"
          style={{
            marginBottom: 20,
            padding: "22px 24px",
            border: "1px solid var(--border-subtle)",
            borderRadius: "calc(var(--radius-lg) * 1.15)",
            background: "var(--kola-50)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <span
            style={{
              alignSelf: "flex-start",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "5px 12px",
              borderRadius: "999px",
              background: "var(--surface-card)",
              color: "var(--kola-600)",
            }}
          >
            Accompagnement BTP
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: "clamp(21px,3vw,27px)",
              letterSpacing: "-0.02em",
            }}
          >
            Vous construisez ou rénovez ?
          </span>
          <p style={{ fontSize: "14.5px", lineHeight: 1.55, margin: 0, maxWidth: "66ch", color: "var(--text-muted)" }}>
            Trouvez des professionnels vérifiés, comparez plusieurs devis et suivez chaque étape de votre chantier
            depuis TerraClick.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 26px" }}>
            {AVANTAGES_BTP.map((a) => (
              <div key={a.texte} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    flex: "none",
                    borderRadius: "999px",
                    background: "var(--surface-card)",
                    color: "var(--kola-600)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Icon name={a.icon} size={17} />
                </span>
                <span style={{ fontSize: "14.5px" }}>{a.texte}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={ouvrirAssistant} className="sy-btn sy-btn--primary sy-btn--md">
              Créer mon projet
            </button>
            <button
              onClick={() => rechercher("Construction & travaux", { categorie: "entreprises-de-construction" })}
              className="sy-btn sy-btn--outline sy-btn--md"
              style={{ background: "var(--surface-card)" }}
            >
              Trouver un professionnel
            </button>
          </div>
        </div>
      )}

      <div
        data-r="results-head"
        style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}
      >
        {/* En-tête de recherche : retour rond, puis ce qui est cherché et combien de résultats. */}
        <button onClick={() => go("home")} aria-label="Retour à l'accueil" style={BOUTON_ROND}>
          <Icon name="arrow-left" size={20} strokeWidth={2.25} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 data-r="results-titre" style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 800, margin: 0, lineHeight: 1.15 }}>
            {titre}
          </h1>
          {compris.length > 0 && demande !== titre && (
            <p data-r="demande-comprise" style={LIGNE_DISCRETE}>
              D'après votre demande : « {demande} »
            </p>
          )}
          <span role="status" style={LIGNE_DISCRETE}>
            {recherche.chargement ? "Recherche en cours…" : `${total} ${total > 1 ? "prestataires" : "prestataire"} · ${ville}`}
          </span>
        </div>
        {/* Quartier et Trier à droite du titre : une pastille dépliée, l'autre réduite à son icône. */}
        <div data-r="filtres" style={{ flex: "none", display: "flex", alignItems: "center", gap: 6 }}>
          <PastilleChoix
            icone="map-pin"
            libelle="Quartier"
            actif={!!etat.quartier}
            valeur={String(etat.quartier)}
            options={[
              { valeur: "0", libelle: "Tous les quartiers" },
              ...quartiers
                .filter((q) => q.id)
                .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
                .map((q) => ({ valeur: String(q.id), libelle: q.nom })),
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
        {/* Bascule Liste / Carte, masquée dans le MVP : les résultats restent en liste. */}
        {CONFIG.carteResultats && (
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 3,
              padding: 4,
              borderRadius: "999px",
              background: "var(--color-surface)",
            }}
          >
            <button onClick={() => set({ carte: false })} style={tab(!voirCarte)}>
              Liste
            </button>
            {/* La carte est réservée aux clients inscrits. */}
            <button onClick={() => exigerCompte(() => set({ carte: true }))} style={tab(voirCarte)}>
              Carte
              {!etat.auth && <Icon name="lock" size={12} style={{ marginLeft: 5, opacity: 0.6, verticalAlign: "-1px" }} />}
            </button>
          </div>
        )}
      </div>

      {/* Le suivi avancé reste une proposition : le client l'ouvre s'il le souhaite. */}
      {proposerSuivi && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            border: "2px solid var(--color-accent)",
            background: "var(--color-accent-100)",
            borderRadius: "calc(var(--radius-lg) * 1.15)",
            padding: "16px 20px",
            marginBottom: 18,
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              flex: "none",
              borderRadius: "999px",
              background: "var(--color-accent)",
              color: "var(--color-bg)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="route" size={20} strokeWidth={2.75} />
          </span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "17px" }}>
                Suivi avancé disponible pour ce besoin
              </span>
              <span className="sy-badge sy-badge--neutral">Optionnel</span>
            </div>
            <div style={{ color: "var(--color-neutral-700)", fontSize: "13.5px" }}>
              Si vous le souhaitez, votre commande est suivie étape par étape : l'argent reste bloqué jusqu'à votre
              confirmation. Vous décidez, rien n'est imposé.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={ouvrirAssistant} className="sy-btn sy-btn--primary sy-btn--md" style={{ whiteSpace: "nowrap" }}>
              Ouvrir un suivi avancé
            </button>
            <button
              onClick={() => rechercher(etat.titre, etat.filtre)}
              className="sy-btn sy-btn--ghost sy-btn--md"
              style={{ whiteSpace: "nowrap" }}
            >
              Non merci
            </button>
          </div>
        </div>
      )}

      {besoinEnCours && (
        <div
          data-r="rappel-besoin"
          style={{ ...CARTE, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, background: "var(--color-accent-100)" }}
        >
          <Icon name="file-text" size={18} color="var(--color-accent-700)" />
          <span style={{ flex: 1, minWidth: 0, fontSize: "14px" }}>
            <strong>Votre demande :</strong> {resumeBesoin(etat.besoin, quartiers.find((q) => q.id === etat.besoin.quartier)?.nom)}.
            Ouvrez un profil puis « Demander ce technicien ».
          </span>
        </div>
      )}

      {/* Un quartier choisi : on peut revenir à tous les quartiers en un toucher. */}
      {!!etat.quartier && (
        <div style={{ marginTop: -10, marginBottom: 12 }}>
          <button onClick={() => set({ quartier: 0 })} style={LIEN_EFFACER}>
            Effacer le quartier
          </button>
        </div>
      )}

      {voirCarte && <MapCanvas pros={filtres} hauteur={360} onPin={ouvrirChat} />}

      {recherche.erreur && (
        <div role="alert" style={BLOC_VIDE}>
          <h3 style={{ margin: "0 0 8px" }}>La recherche n'a pas abouti</h3>
          <p style={{ color: "var(--color-neutral-700)", fontSize: "14.5px", margin: "0 0 16px" }}>
            {recherche.erreur}
          </p>
          <button onClick={() => setEssai((n) => n + 1)} className="sy-btn sy-btn--primary sy-btn--md">
            Réessayer
          </button>
        </div>
      )}

      <div
        aria-busy={recherche.chargement}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          opacity: recherche.chargement && filtres.length ? 0.55 : 1,
          transition: "opacity var(--dur-fast)",
        }}
      >
        {filtres.map((p) => {
          const voirFiche = () => go("fiche", { fiche: p.id ?? null });
          return (
            // Toute la carte mène à la fiche (convention des places de marché) ; les
            // boutons d'action arrêtent le clic pour ne pas l'ouvrir en plus.
            <article
              key={p.id ?? p.nom}
              data-r="pro-card"
              onClick={voirFiche}
              style={{ ...CARTE, padding: 14, display: "flex", gap: 16, alignItems: "flex-start", cursor: "pointer" }}
            >
              {/* Vignette : la photo du prestataire quand elle existera, ses initiales d'ici là. */}
              <span data-r="pro-vignette" style={VIGNETTE}>
                {p.ini}
              </span>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={NOM_PRO}>{p.nom}</span>
                  {p.verifie && <Icon name="badge-check" size={17} color="var(--state-success)" style={{ flex: "none" }} />}
                </div>
                <span style={{ fontSize: "13.5px", color: "var(--color-accent-700)", marginTop: -3 }}>{p.metier}</span>
                <span style={PRIX}>{p.prestation ? `${p.prestation} · ${p.prix}` : p.prix}</span>
                <span style={META}>
                  <Icon name="star" size={14} fill="var(--rating)" color="var(--rating)" />
                  <strong style={{ color: "var(--color-text)" }}>{p.note}</strong> ({p.avis} avis)
                </span>
                {p.quartier && (
                  <span style={META}>
                    <Icon name="map-pin" size={14} />
                    {[p.quartier, p.dist].filter(Boolean).join(" · ")}
                  </span>
                )}
                {p.delai && (
                  <span style={META}>
                    <Icon name="clock" size={14} />
                    Répond en {p.delai}
                  </span>
                )}
                <p data-r="pro-desc" style={DESCRIPTION}>
                  {p.desc}
                </p>
                <div
                  data-r="chat-actions"
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}
                >
                  <button onClick={() => (noterContact(p, "message"), ouvrirChat(p))} className="sy-btn sy-btn--primary sy-btn--md" style={{ gap: 7 }}>
                    <Icon name="message-circle" size={16} strokeWidth={2.75} />
                    Chat
                  </button>
                  <button onClick={() => ouvrirChat(p)} className="sy-btn sy-btn--outline sy-btn--md" style={{ gap: 7 }}>
                    <Icon name="phone" size={16} strokeWidth={2.75} />
                    Appeler
                  </button>
                  <button
                    data-r="voir-profil"
                    onClick={voirFiche}
                    className="sy-btn sy-btn--ghost sy-btn--md"
                    style={{ marginLeft: "auto", gap: 4, whiteSpace: "nowrap" }}
                  >
                    Voir le profil
                    <Icon name="chevron-right" size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              {/* Sur téléphone, la flèche dit que la carte s'ouvre ; les boutons sont sur la fiche. */}
              <span data-r="pro-chevron" style={{ display: "none", alignSelf: "center", opacity: 0.45 }}>
                <Icon name="chevron-right" size={20} />
              </span>
            </article>
          );
        })}
      </div>

      {/* Un seul appel à l'action, sous la liste : laisser TerraClick choisir, ou décrire son besoin. */}
      {!recherche.chargement && filtres.length > 0 && (
        <div data-r="devis-bas" style={{ ...CARTE, marginTop: 18, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", background: "var(--color-surface)" }}>
          <div style={{ flex: "1 1 240px", minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "16px" }}>Vous hésitez ?</div>
            <div style={{ fontSize: "14px", color: "var(--color-neutral-700)" }}>
              Nous vous proposons les 3 meilleurs techniciens disponibles près de chez vous.
            </div>
          </div>
          <button
            onClick={() => (besoinEnCours ? go("recommandations") : demarrerBesoin())}
            className="sy-btn sy-btn--primary sy-btn--md"
          >
            Trouver pour moi
          </button>
        </div>
      )}

      {!recherche.chargement && !recherche.erreur && filtres.length === 0 && (
        <div style={BLOC_VIDE}>
          <h3 style={{ margin: "0 0 8px" }}>
            {etat.quartier ? "Personne dans ce quartier pour l'instant" : "Aucun prestataire pour cette recherche"}
          </h3>
          <p style={{ color: "var(--color-neutral-700)", fontSize: "14.5px", margin: "0 0 16px" }}>
            {etat.quartier ? "Changez de quartier" : "Choisissez un service"}, ou décrivez votre besoin : nous vous
            proposons les meilleurs techniciens près de chez vous.
          </p>
          {!etat.quartier && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 16 }}>
              {SECTEURS.map((s) => (
                <button
                  key={s.categorie}
                  onClick={() => demarrerBesoin({ secteur: s.cle })}
                  className="sy-tag"
                  style={{ height: 32, fontSize: "13px" }}
                >
                  {s.nom}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => demarrerBesoin()} className="sy-btn sy-btn--primary sy-btn--md">
            Décrire mon besoin
          </button>
        </div>
      )}
    </main>
  );
}
