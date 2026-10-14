import { POPULAIRES, QUICKIES } from "../data/catalogue";
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
import { ModeCarte } from "./home/ModeCarte";
import { ModeBox } from "./home/ModeBox";

export function Home() {
  const { etat, set, go, rechercher, ouvrirChat, exigerCompte, ville, villeIdx } = useApp();

  const changerVille = () => set({ ville: (villeIdx + 1) % 4 });
  const { donnees: vedettes } = useApi((signal) => api.vedettes(signal), []);
  // Sans vedette (ou si l'API ne répond pas), la section disparaît plutôt que d'afficher un vide.
  const afficherVedettes = CONFIG.afficherVedettes && etat.modeAccueil === "recherche" && !!vedettes?.length;

  return (
    <main>
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
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: "clamp(38px,7vw,64px)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              marginBottom: 16,
            }}
          >
            servis<span style={{ color: "var(--color-accent)" }}>yakro</span>
          </span>
          <p style={{ fontSize: "16px", margin: "0 0 22px", maxWidth: "52ch", color: "var(--color-neutral-700)" }}>
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

              <button
                onClick={changerVille}
                data-r="search-ville"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "none",
                  border: 0,
                  cursor: "pointer",
                  font: "inherit",
                  fontSize: "15px",
                  padding: "10px 16px",
                  borderRadius: "999px",
                  color: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon name="map-pin" size={17} strokeWidth={2.75} color="var(--color-accent)" />
                {ville}
              </button>

              <span data-r="search-sep" style={{ width: 1, height: 26, background: "var(--color-divider)" }} />

              <input
                value={etat.query}
                onChange={(e) => set({ query: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && rechercher()}
                placeholder="Que cherchez-vous ? (ex : plombier, panneau solaire…)"
                aria-label="Que cherchez-vous ?"
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
                onClick={() => rechercher()}
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

          {/* Le groupe se centre tant qu'il tient dans la largeur ; au-delà, les
              marges automatiques retombent à zéro et il se balaye depuis le début
              au lieu d'être rogné des deux côtés. */}
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
              <button onClick={() => set({ modeAccueil: "recherche" })} style={tabIcon(etat.modeAccueil === "recherche")}>
                <Icon name="search" size={15} strokeWidth={2.75} />
                Recherche
              </button>
              <button onClick={() => set({ modeAccueil: "carte" })} style={tabIcon(etat.modeAccueil === "carte")}>
                <Icon name="map" size={15} strokeWidth={2.75} />
                Autour de moi
              </button>
              <button onClick={() => set({ modeAccueil: "box" })} style={tabIcon(etat.modeAccueil === "box")}>
                <Icon name="bot" size={15} strokeWidth={2.75} />
                Box intelligente
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 16 }}>
            <span style={{ fontSize: "12.5px", color: "var(--color-neutral-700)" }}>Recherché en ce moment</span>
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
              {QUICKIES.map((label) => (
                <button
                  key={label}
                  onClick={() => rechercher(`${label}s · ${ville}`, { q: label })}
                  className="sy-tag"
                  style={{ height: 32, fontSize: "13px" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {etat.modeAccueil === "carte" && <ModeCarte />}
      {etat.modeAccueil === "box" && <ModeBox />}

      {/* ---- Recherches populaires ---- */}
      {etat.modeAccueil === "recherche" && (
        <section data-r="container" data-sec="" style={{ paddingTop: 52 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
            <h2 style={{ fontSize: "29px", margin: 0 }}>Recherches populaires</h2>
            <span style={{ color: "var(--color-neutral-700)", fontSize: "14px" }}>à Yamoussoukro cette semaine</span>
          </div>
          <div data-grid="421">
            {POPULAIRES.map(([label, icon]) => (
              <button
                key={label}
                onClick={() => rechercher(label)}
                style={{
                  ...CARTE,
                  cursor: "pointer",
                  padding: "22px 16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  font: "inherit",
                  color: "inherit",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: "999px",
                    background: "var(--color-accent-2-100)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--color-accent-2-700)",
                  }}
                >
                  <Icon name={icon} size={26} strokeWidth={2.75} />
                </span>
                <span style={{ fontSize: "14.5px", lineHeight: 1.3 }}>{label}</span>
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
          <div data-grid="421" style={{ gap: 16 }}>
            {vedettes?.map((v) => (
              <div key={v.id} style={{ ...CARTE, padding: 16, display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 78, height: 78, flex: "none", borderRadius: "999px", overflow: "hidden" }}>
                  <ImageSlot placeholder="Photo" shape="circle" />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "17px" }}>{v.nom}</span>
                    <Rating
                      value={v.note}
                      count={v.nombre_avis}
                      style={{ marginLeft: "auto", whiteSpace: "nowrap" }}
                    />
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
            <h3 style={{ margin: "0 0 8px" }}>Un chantier ? Plusieurs devis.</h3>
            <p style={{ color: "var(--color-neutral-700)", fontSize: "14.5px", margin: "0 0 18px" }}>
              Décrivez votre besoin en 3 étapes, les prestataires vérifiés du quartier vous répondent avec un prix.
            </p>
            <button
              onClick={() => exigerCompte(() => go("devis", { step: 1 }))}
              className="sy-btn sy-btn--primary sy-btn--md"
            >
              Demander un devis
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
