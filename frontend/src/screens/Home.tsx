import { SECTEURS } from "../data/catalogue";
import { api } from "../lib/api";
import { versPrestataire } from "../lib/annuaire";
import { CONFIG } from "../lib/config";
import { useApi } from "../lib/useApi";
import { useApp } from "../state/app";
import { Icon } from "../components/Icon";
import { ImageSlot } from "../components/ImageSlot";
import { MegaMenu } from "../components/MegaMenu";
import { Rating } from "../components/Rating";
import { CARTE, tabIcon } from "../components/ui";
import { ChoixVille } from "../components/ChoixVille";
import { VisuelSecteur } from "../components/VisuelSecteur";
import { ModeCarte } from "./home/ModeCarte";
import { ModeBox } from "./home/ModeBox";
import { AccueilMobile } from "./home/AccueilMobile";
import { BandeauInstallation } from "../components/Installer";
import { useEstMobile } from "../lib/useEstMobile";

export function Home() {
  const { etat, set, go, rechercher, ouvrirChat, exigerCompte, ville, demarrerBesoin } = useApp();

  /**
   * « Quel est votre problème ? » mène droit aux résultats, sans passer par l'assistant :
   * le serveur comprend la phrase (« ma douche fuit » → plombiers) ou le nom d'un technicien.
   */
  const lancerRecherche = () => rechercher();

  // « Autour de moi » et la Box intelligente sont réservés aux clients inscrits,
  // et masqués dans le MVP.
  const mode = CONFIG.modesAccueil && etat.auth ? etat.modeAccueil : "recherche";
  const ouvrirMode = (m: typeof etat.modeAccueil) =>
    m === "recherche" ? set({ modeAccueil: m }) : exigerCompte(() => set({ modeAccueil: m }));
  const { donnees: vedettes } = useApi((signal) => api.vedettes(signal), []);
  // Sans vedette (ou si l'API ne répond pas), la section disparaît plutôt que d'afficher un vide.
  const afficherVedettes = CONFIG.afficherVedettes && mode === "recherche" && !!vedettes?.length;

  // Téléphone et tablette : un accueil propre au format mobile (logo seulement dans l'en-tête).
  const estMobile = useEstMobile();
  if (estMobile) return <AccueilMobile />;

  return (
    <main>
      {/* Proposition d'installer l'application, sur ordinateur (Chrome, Edge). */}
      <div data-r="container">
        <BandeauInstallation style={{ marginTop: 16 }} />
      </div>
      {/* ---- Accroche : mot-symbole centré, recherche, bascule des trois modes ---- */}
      <section style={{ position: "relative", background: "var(--color-accent-100)" }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
          <div
            style={{
              position: "absolute",
              right: -90,
              top: -120,
              width: 420,
              height: 420,
              borderRadius: "999px",
              background: "var(--color-accent-200)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 180,
              bottom: -160,
              width: 280,
              height: 280,
              borderRadius: "999px",
              background: "var(--color-accent-2-200)",
            }}
          />
        </div>

        <div
          data-r="container"
          data-sec="hero"
          style={{
            position: "relative",
            zIndex: 1,
            paddingTop: 52,
            paddingBottom: 44,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <span
            data-r="hero-marque"
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: "clamp(38px,7vw,64px)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              marginBottom: 16,
            }}
          >
            Terra<span style={{ color: "var(--color-accent)" }}>Click</span>
          </span>
          {/* Accroche, juste sous le nom de l'application. */}
          <h1 data-r="hero-titre" style={{ fontSize: "clamp(20px,2.6vw,26px)", lineHeight: 1.2, margin: "0 0 6px" }}>
            Trouvez le bon technicien
          </h1>
          <p data-r="hero-sous-titre" style={{ fontSize: "16px", margin: "0 0 22px", maxWidth: "52ch", color: "var(--color-neutral-700)" }}>
            Les prestataires vérifiés de votre ville, en une recherche.
          </p>

          <div style={{ position: "relative", maxWidth: 760, width: "100%", textAlign: "left" }}>
            <div
              data-r="searchbar"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                background: "var(--color-neutral-100)",
                borderRadius: "999px",
                padding: 8,
                boxShadow: "var(--shadow-md)",
              }}
            >
              <button
                onClick={() => set({ deptsOpen: !etat.deptsOpen })}
                aria-expanded={etat.deptsOpen}
                data-r="search-depts"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--color-accent-200)",
                  border: 0,
                  cursor: "pointer",
                  font: "inherit",
                  fontSize: "15px",
                  padding: "10px 18px",
                  borderRadius: "999px",
                  color: "var(--color-accent-900)",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon name="layout-grid" size={17} strokeWidth={2.75} />
                <span>Départements</span>
                <Icon name="chevron-down" size={15} strokeWidth={2.75} />
              </button>

              <ChoixVille
                data-r="search-ville"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "15px",
                  padding: "10px 16px",
                  borderRadius: "999px",
                  whiteSpace: "nowrap",
                }}
              />

              <span data-r="search-sep" style={{ width: 1, height: 26, background: "var(--color-divider)" }} />

              <input
                value={etat.query}
                onChange={(e) => set({ query: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && lancerRecherche()}
                placeholder="Quel est votre problème ?"
                aria-label="Quel est votre problème ?"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 0,
                  background: "none",
                  font: "inherit",
                  fontSize: "15px",
                  padding: "10px 18px",
                  outline: "none",
                  color: "inherit",
                }}
              />

              <button
                onClick={() => lancerRecherche()}
                data-r="search-go"
                aria-label="Rechercher"
                className="sy-btn sy-btn--primary sy-btn--md"
                style={{ gap: 8, padding: "12px 26px", fontSize: "15px" }}
              >
                <Icon name="search" size={17} strokeWidth={2.75} />
                <span>Rechercher</span>
              </button>
            </div>

            <MegaMenu />
          </div>

          {/* Les deux entrées directes de l'assistant : l'urgence, ou une intervention à prévoir. */}
          <div
            data-r="actions-principales"
            style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 760, marginTop: 16 }}
          >
            <button
              onClick={() => demarrerBesoin({ quand: "maintenant" })}
              className="sy-btn sy-btn--primary sy-btn--md"
              style={{ flex: "1 1 200px", maxWidth: 320, minHeight: 50, gap: 8, justifyContent: "center" }}
            >
              <Icon name="siren" size={18} strokeWidth={2.5} />
              Urgence maintenant
            </button>
            <button
              onClick={() => demarrerBesoin()}
              className="sy-btn sy-btn--outline sy-btn--md"
              style={{ flex: "1 1 200px", maxWidth: 320, minHeight: 50, gap: 8, justifyContent: "center", background: "var(--color-neutral-100)" }}
            >
              <Icon name="calendar" size={18} strokeWidth={2.5} />
              Programmer une intervention
            </button>
          </div>

          {/* Le groupe se centre tant qu'il tient dans la largeur ; au-delà, les
              marges automatiques retombent à zéro et il se balaye depuis le début
              au lieu d'être rogné des deux côtés. */}
          {CONFIG.modesAccueil && (
            <div
              data-r="modes"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 10,
                marginTop: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 3,
                  padding: 4,
                  margin: "0 auto",
                  borderRadius: "999px",
                  background: "var(--color-neutral-100)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <button onClick={() => ouvrirMode("recherche")} style={tabIcon(mode === "recherche")}>
                  <Icon name="search" size={15} strokeWidth={2.75} />
                  Recherche
                </button>
                <button onClick={() => ouvrirMode("carte")} style={tabIcon(mode === "carte")}>
                  <Icon name="map" size={15} strokeWidth={2.75} />
                  Autour de moi
                  {!etat.auth && <Icon name="lock" size={13} style={{ opacity: 0.6 }} />}
                </button>
                <button onClick={() => ouvrirMode("box")} style={tabIcon(mode === "box")}>
                  <Icon name="bot" size={15} strokeWidth={2.75} />
                  Box intelligente
                  {!etat.auth && <Icon name="lock" size={13} style={{ opacity: 0.6 }} />}
                </button>
              </div>
            </div>
          )}

          {/* Raccourcis métiers. Sur téléphone, ils deviennent des tuiles à icône sur une
              ligne qui défile, et remplacent la grille « Recherches populaires ». */}
          <div data-r="secteurs-rapides" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 16 }}>
            <span data-r="secteurs-rapides-titre" style={{ fontSize: "12.5px", color: "var(--color-neutral-700)" }}>
              Recherché en ce moment
            </span>
            <div data-r="secteurs-rapides-liste" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
              {SECTEURS.map((s) => (
                <button
                  key={s.categorie}
                  onClick={() => demarrerBesoin({ secteur: s.cle })}
                  className="sy-tag"
                  style={{ height: 32, fontSize: "13px", gap: 6 }}
                >
                  <span data-r="secteur-visuel" style={{ display: "none" }}>
                    <VisuelSecteur secteur={s} hauteur={84} tailleIcone={26} />
                  </span>
                  {s.metier}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {mode === "carte" && <ModeCarte />}
      {mode === "box" && <ModeBox />}

      {/* ---- Recherches populaires ---- */}
      {mode === "recherche" && (
        <section data-r="container" data-sec="" data-bloc="populaires" style={{ paddingTop: 52 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
            <h2 style={{ fontSize: "29px", margin: 0 }}>Recherches populaires</h2>
            <span style={{ color: "var(--color-neutral-700)", fontSize: "14px" }}>à {ville} cette semaine</span>
          </div>
          {/* Colonnes automatiques : les cinq secteurs tiennent sur une ligne en grand écran. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16 }}>
            {SECTEURS.map((s) => (
              <button
                key={s.categorie}
                onClick={() => demarrerBesoin({ secteur: s.cle })}
                style={{
                  ...CARTE,
                  cursor: "pointer",
                  padding: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  font: "inherit",
                  color: "inherit",
                  textAlign: "left",
                }}
              >
                <VisuelSecteur secteur={s} hauteur={150} tailleIcone={40} />
                <span style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px" }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "15.5px" }}>{s.nom}</span>
                  <Icon name="chevron-right" size={16} style={{ marginLeft: "auto", opacity: 0.5 }} />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ---- Prestataires à la une ---- */}
      {afficherVedettes && (
        <section data-r="container" data-sec="" style={{ paddingTop: 52 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
            <h2 style={{ fontSize: "29px", margin: 0 }}>Prestataires à la une</h2>
          </div>
          <p style={{ color: "var(--color-neutral-700)", fontSize: "14.5px", margin: "0 0 20px" }}>
            Des prestataires recommandés et vérifiés près de chez vous.
          </p>
          <div data-grid="421" data-bloc="carrousel" style={{ gap: 16 }}>
            {vedettes?.map((v) => (
              <div key={v.id} style={{ ...CARTE, padding: 16, display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 78, height: 78, flex: "none", borderRadius: "999px", overflow: "hidden" }}>
                  <ImageSlot placeholder="Photo" shape="circle" />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* Nom sur sa propre ligne, note dessous : rien ne se coupe, même en carrousel. */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "17px" }}>{v.nom}</span>
                    <Rating value={v.note} count={v.nombre_avis} style={{ whiteSpace: "nowrap" }} />
                  </div>
                  <span style={{ fontSize: "13.5px", color: "var(--color-accent-700)" }}>{v.metier}</span>
                  {v.quartier && (
                    <span style={{ color: "var(--color-neutral-700)", fontSize: "12.5px" }}>
                      {v.quartier.nom}, {ville}
                    </span>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                    {v.verifie && <span className="sy-badge sy-badge--success">Profil vérifié</span>}
                    {v.delai_reponse.affichage && (
                      <span className="sy-badge sy-badge--neutral">Répond en {v.delai_reponse.affichage}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button
                      onClick={() => ouvrirChat(versPrestataire(v))}
                      className="sy-btn sy-btn--primary sy-btn--md"
                      style={{ fontSize: "13px", padding: "7px 16px" }}
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => ouvrirChat(versPrestataire(v))}
                      className="sy-btn sy-btn--outline sy-btn--md"
                      style={{ fontSize: "13px", padding: "7px 16px" }}
                    >
                      Appeler
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Deux entrées : devis côté client, inscription côté prestataire ---- */}
      <section id="departements" data-r="container" data-sec="" style={{ paddingTop: 52 }}>
        <div data-r="promo" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div
            style={{
              background: "var(--color-accent-2-100)",
              borderRadius: "calc(var(--radius-lg) * 1.15)",
              padding: 30,
            }}
          >
            <h3 style={{ margin: "0 0 8px" }}>Une panne ? Un technicien vérifié.</h3>
            <p style={{ color: "var(--color-neutral-700)", fontSize: "14.5px", margin: "0 0 18px" }}>
              Décrivez votre besoin en 4 questions : nous vous proposons les meilleurs techniciens près de chez vous.
            </p>
            <button
              onClick={() => demarrerBesoin()}
              className="sy-btn sy-btn--primary sy-btn--md"
            >
              Décrire mon besoin
            </button>
          </div>
          <div
            style={{ background: "var(--color-surface)", borderRadius: "calc(var(--radius-lg) * 1.15)", padding: 30 }}
          >
            <h3 style={{ margin: "0 0 8px" }}>Vous êtes prestataire ?</h3>
            <p style={{ color: "var(--color-neutral-700)", fontSize: "14.5px", margin: "0 0 18px" }}>
              Créez votre fiche, faites vérifier votre CNI et recevez les demandes de votre quartier.
            </p>
            <button
              onClick={() => exigerCompte(() => go("proDashboard"))}
              className="sy-btn sy-btn--outline sy-btn--md"
            >
              Devenir partenaire
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
