import { useState } from "react";
import { REGEX_BTP } from "../data/catalogue";
import { useApp } from "../state/app";
import { api } from "../lib/api";
import { slugifier, versPrestataire } from "../lib/annuaire";
import { useApi } from "../lib/useApi";
import { Icon } from "../components/Icon";
import { MapCanvas } from "../components/MapCanvas";
import { Rating } from "../components/Rating";
import { CARTE, pill, tab } from "../components/ui";

const BLOC_VIDE: React.CSSProperties = {
  textAlign: "center",
  padding: "56px 20px",
  background: "var(--color-surface)",
  borderRadius: "calc(var(--radius-lg) * 1.15)",
};

const AVANTAGES_BTP = [
  { icon: "scale", texte: "Comparez les offres" },
  { icon: "wallet", texte: "Paiement par étapes" },
  { icon: "hard-hat", texte: "Suivi du chantier" },
];

export function Results() {
  const { etat, set, go, rechercher, ouvrirChat, exigerCompte, voirCarte, ville } = useApp();

  const [essai, setEssai] = useState(0);

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
  // Une recherche BTP remplace le bandeau de suivi générique par l'accompagnement construction.
  const estBtp = REGEX_BTP.test(etat.titre || "");

  const ouvrirAssistant = () => exigerCompte(() => go("assistant", { assistStep: 1 }));

  return (
    <main data-r="container" style={{ paddingTop: 26, paddingBottom: 60 }}>
      <button
        onClick={() => go("home")}
        className="sy-btn sy-btn--ghost sy-btn--md"
        style={{ marginBottom: 8, whiteSpace: "nowrap" }}
      >
        ← Retour à l'accueil
      </button>

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
            depuis Servis Yakro.
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
        style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap", marginBottom: 18 }}
      >
        <div>
          <h1 style={{ fontSize: "clamp(26px,4.5vw,34px)", margin: "0 0 2px" }}>{etat.titre}</h1>
          <span role="status" style={{ color: "var(--color-neutral-700)", fontSize: "14px" }}>
            {recherche.chargement ? "Recherche en cours…" : `${total} ${total > 1 ? "pros" : "pro"} · ${ville}`}
          </span>
        </div>
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
      </div>

      {/* Le suivi avancé reste une proposition : le client l'ouvre s'il le souhaite. */}
      {!estBtp && (
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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {quartiers.map(({ id, nom }) => (
          <button key={id} onClick={() => set({ quartier: id })} style={pill(id === etat.quartier)}>
            {nom}
          </button>
        ))}
      </div>

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
        {filtres.map((p) => (
          <div
            key={p.id ?? p.nom}
            data-r="pro-card"
            style={{ ...CARTE, padding: 20, display: "flex", gap: 18, alignItems: "flex-start" }}
          >
            <span
              style={{
                width: 58,
                height: 58,
                flex: "none",
                borderRadius: "999px",
                background: "var(--color-accent-200)",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-heading)",
                fontSize: "19px",
                color: "var(--color-accent-800)",
              }}
            >
              {p.ini}
            </span>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "20px" }}>{p.nom}</span>
                <span style={{ fontSize: "13.5px", color: "var(--color-accent-700)" }}>{p.metier}</span>
                <span style={{ marginLeft: "auto" }}>
                  <Rating value={Number(p.note.replace(",", "."))} count={p.avis} />
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                <span className="sy-badge sy-badge--brand">{p.prix}</span>
                {p.delai && <span className="sy-badge sy-badge--success">Répond en {p.delai}</span>}
                {p.verifie && <span className="sy-badge sy-badge--neutral">Profil vérifié</span>}
                {p.quartier && (
                  <span className="sy-badge sy-badge--neutral">{[p.quartier, p.dist].filter(Boolean).join(" · ")}</span>
                )}
              </div>
              <p style={{ color: "var(--color-neutral-700)", fontSize: "14px", margin: 0 }}>{p.desc}</p>
              <div data-r="chat-actions" style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 2 }}>
                <button
                  onClick={() => go("fiche", { fiche: p.id ?? null })}
                  className="sy-btn sy-btn--outline sy-btn--md"
                  style={{ gap: 7 }}
                >
                  Voir le profil
                </button>
                <button
                  onClick={() => ouvrirChat(p)}
                  className="sy-btn sy-btn--primary sy-btn--md"
                  style={{ gap: 7, paddingInline: 22 }}
                >
                  <Icon name="message-circle" size={16} strokeWidth={2.75} />
                  Chat
                </button>
                <button
                  onClick={() => ouvrirChat(p)}
                  className="sy-btn sy-btn--outline sy-btn--md"
                  style={{ gap: 7, paddingInline: 22 }}
                >
                  <Icon name="phone" size={16} strokeWidth={2.75} />
                  Appeler
                </button>
                <button
                  onClick={() => exigerCompte(() => go("devis", { step: 1 }))}
                  className="sy-btn sy-btn--ghost sy-btn--md"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Demander un devis
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!recherche.chargement && !recherche.erreur && filtres.length === 0 && (
        <div style={BLOC_VIDE}>
          <h3 style={{ margin: "0 0 8px" }}>
            {etat.quartier ? "Personne dans ce quartier pour l'instant" : "Aucun prestataire pour cette recherche"}
          </h3>
          <p style={{ color: "var(--color-neutral-700)", fontSize: "14.5px", margin: "0 0 16px" }}>
            {etat.quartier ? "Changez de quartier" : "Essayez un autre mot"}, ou lancez une demande de devis : les
            prestataires viendront à vous.
          </p>
          <button
            onClick={() => exigerCompte(() => go("devis", { step: 1 }))}
            className="sy-btn sy-btn--primary sy-btn--md"
          >
            Demander un devis
          </button>
        </div>
      )}
    </main>
  );
}
