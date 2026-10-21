import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useApp } from "../../state/app";
import type { Ecran } from "../../state/types";
import { CONSIGNES, PRO, type Ton } from "../../data/pro";
import { Icon } from "../../components/Icon";
import { useEtatPro } from "./store";

/* Application prestataire, distincte du site public : pas d'en-tête d'annuaire,
   pas de pied de page. Sur ordinateur, une interface de gestion (barre latérale
   sombre, barre supérieure, modules) ; sur téléphone, une application avec barre
   du haut et navigation basse. */

type Entree = { ecran: Ecran; libelle: string; court: string; icone: string };
type Groupe = { titre: string; entrees: Entree[] };

const GROUPES: Groupe[] = [
  {
    titre: "Activité",
    entrees: [
      { ecran: "proDashboard", libelle: "Tableau de bord", court: "Accueil", icone: "layout-dashboard" },
      { ecran: "proConsignes", libelle: "Consignes", court: "Consignes", icone: "clipboard-check" },
      { ecran: "demandesRecues", libelle: "Commandes et demandes reçues", court: "Reçues", icone: "inbox" },
      { ecran: "proDemandes", libelle: "Demandes clients", court: "Demandes", icone: "inbox" },
      { ecran: "proNotifications", libelle: "Notifications", court: "Notifications", icone: "bell" },
    ],
  },
  {
    titre: "Mon profil",
    entrees: [
      { ecran: "proProfil", libelle: "Fiche professionnelle", court: "Profil", icone: "user" },
      { ecran: "proRealisations", libelle: "Réalisations", court: "Réalisations", icone: "images" },
      { ecran: "proVerification", libelle: "Vérification", court: "Vérification", icone: "shield-check" },
      { ecran: "proAvis", libelle: "Avis clients", court: "Avis", icone: "star" },
    ],
  },
  {
    titre: "Compte",
    entrees: [
      { ecran: "proAbonnement", libelle: "Facturation", court: "Factures", icone: "receipt" },
      { ecran: "proMiseEnAvant", libelle: "Mise en avant", court: "Mise en avant", icone: "trending-up" },
    ],
  },
];

const TOUTES = GROUPES.flatMap((g) => g.entrees);

/** Onglets de la barre basse sur téléphone ; le reste passe par « Plus ». */
const ONGLETS_BAS: Ecran[] = ["proDashboard", "demandesRecues", "proDemandes", "proProfil"];

/** Écrans de détail rattachés à une entrée de navigation. */
const RATTACHEMENT: Partial<Record<Ecran, Ecran>> = { proDemande: "proDemandes" };

/* ---- Styles partagés par les écrans de l'espace ---- */

export const OVERLINE: CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--kola-600)",
};

export const TITRE_CARTE: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-heading)",
  fontWeight: 800,
  fontSize: "16px",
  letterSpacing: "-0.02em",
};

export const MONO: CSSProperties = { fontFamily: "var(--font-mono)" };

export const badge = (ton: Ton) => `sy-badge sy-badge--${ton}`;

/** Encadré d'information discret (paiement direct, règles de la plateforme). */
export function Note({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "var(--argile-50)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        gap: 10,
      }}
    >
      <Icon name="info" size={18} color="var(--text-muted)" style={{ marginTop: 1 }} />
      <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: "var(--argile-700)" }}>{children}</p>
    </div>
  );
}

/** Nombre affiché à côté d'une entrée (éléments en attente). */
function useCompteurs(): Partial<Record<Ecran, number>> {
  const { demandes, notificationsLues, consignesFaites } = useEtatPro();
  return {
    proConsignes: CONSIGNES.filter((c) => !consignesFaites.includes(c.ref)).length,
    proDemandes: demandes.filter((d) => d.groupe === "Nouvelles").length,
    proNotifications: notificationsLues ? 0 : 1,
    proAbonnement: 1,
  };
}

function Pastille({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span
      style={{
        ...MONO,
        fontSize: "11px",
        fontWeight: 700,
        lineHeight: 1.3,
        padding: "1px 7px",
        borderRadius: 999,
        background: "var(--kola-500)",
        color: "#fff",
      }}
    >
      {n}
    </span>
  );
}

export function EspacePro({ titre, sousTitre, children }: { titre: string; sousTitre?: string; children: ReactNode }) {
  const { etat, go } = useApp();
  const compteurs = useCompteurs();
  const courant = RATTACHEMENT[etat.screen] ?? etat.screen;
  const entreeCourante = TOUTES.find((e) => e.ecran === courant);
  const groupeCourant = GROUPES.find((g) => g.entrees.some((e) => e.ecran === courant));
  const [plusOuvert, setPlusOuvert] = useState(false);

  // Le défilement repart du haut à chaque écran, comme dans une application.
  useEffect(() => {
    window.scrollTo(0, 0);
    setPlusOuvert(false);
  }, [etat.screen]);

  const quitter = () => go("home");

  return (
    <div data-r="pro-app">
      {/* ---- Barre latérale (ordinateur) ---- */}
      <aside data-r="pro-side" aria-label="Espace prestataire">
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 18px 14px" }}>
          <span
            style={{
              width: 34,
              height: 34,
              flex: "none",
              borderRadius: 9,
              background: "var(--kola-500)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: "13px",
            }}
          >
            tc
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "15px", color: "#fff" }}>
              TerraClick Pro
            </div>
            <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,.55)" }}>Gestion de l'activité</div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "4px 10px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
          {GROUPES.map((g) => (
            <div key={g.titre} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,.4)",
                  padding: "0 10px 4px",
                }}
              >
                {g.titre}
              </span>
              {g.entrees.map((n) => {
                const actif = courant === n.ecran;
                return (
                  <button
                    key={n.ecran}
                    type="button"
                    onClick={() => go(n.ecran)}
                    aria-current={actif ? "page" : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      height: 38,
                      padding: "0 10px",
                      borderRadius: 9,
                      cursor: "pointer",
                      font: "inherit",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      textAlign: "left",
                      border: actif ? "1px solid rgba(226,91,26,.5)" : "1px solid transparent",
                      background: actif ? "rgba(226,91,26,.16)" : "transparent",
                      color: actif ? "#fff" : "rgba(255,255,255,.72)",
                    }}
                  >
                    <Icon name={n.icone} size={17} />
                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.libelle}</span>
                    <Pastille n={compteurs[n.ecran]} />
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 32,
                height: 32,
                flex: "none",
                borderRadius: "50%",
                background: "rgba(255,255,255,.12)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                fontSize: "12px",
              }}
            >
              {PRO.initiales}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{PRO.nom}</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,.55)" }}>
                {PRO.metier} · plan {PRO.plan}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={quitter}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              height: 36,
              borderRadius: 9,
              cursor: "pointer",
              font: "inherit",
              fontSize: "13px",
              fontWeight: 600,
              border: "1px solid rgba(255,255,255,.18)",
              background: "transparent",
              color: "rgba(255,255,255,.8)",
            }}
          >
            <Icon name="x" size={15} />
            Quitter l'espace pro
          </button>
        </div>
      </aside>

      <div data-r="pro-main">
        {/* ---- Barre supérieure ---- */}
        <header data-r="pro-top">
          <div style={{ minWidth: 0, flex: 1 }}>
            <div data-r="pro-fil" style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              {groupeCourant?.titre ?? "Espace pro"}
              {entreeCourante && ` / ${entreeCourante.libelle}`}
            </div>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                fontSize: "17px",
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {titre}
            </h1>
          </div>
          <span data-r="pro-plan" className="sy-badge sy-badge--success">
            Profil vérifié
          </span>
          <button
            type="button"
            className="sy-iconbtn sy-iconbtn--md sy-iconbtn--outline"
            aria-label="Notifications"
            onClick={() => go("proNotifications")}
            style={{ position: "relative" }}
          >
            <Icon name="bell" size={18} />
            {compteurs.proNotifications ? (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: 7,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--kola-500)",
                }}
              />
            ) : null}
          </button>
        </header>

        <main data-r="pro-content">
          {sousTitre && (
            <p style={{ margin: 0, fontSize: "14px", color: "var(--argile-700)" }}>{sousTitre}</p>
          )}
          {children}
        </main>
      </div>

      {/* ---- Navigation basse (téléphone) ---- */}
      <nav data-r="pro-bottom" aria-label="Navigation de l'espace pro">
        {ONGLETS_BAS.map((ecran) => {
          const e = TOUTES.find((x) => x.ecran === ecran)!;
          const actif = courant === ecran;
          return (
            <button
              key={ecran}
              type="button"
              onClick={() => go(ecran)}
              aria-current={actif ? "page" : undefined}
              style={{ color: actif ? "var(--kola-600)" : "var(--argile-700)" }}
            >
              <span style={{ position: "relative", display: "flex" }}>
                <Icon name={e.icone} size={21} />
                {compteurs[ecran] ? (
                  <span style={{ position: "absolute", top: -6, right: -12 }}>
                    <Pastille n={compteurs[ecran]} />
                  </span>
                ) : null}
              </span>
              {e.court}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setPlusOuvert(true)}
          aria-expanded={plusOuvert}
          style={{ color: ONGLETS_BAS.includes(courant) ? "var(--argile-700)" : "var(--kola-600)" }}
        >
          <Icon name="layout-grid" size={21} />
          Plus
        </button>
      </nav>

      {plusOuvert && (
        <div
          className="sy-dialog__scrim"
          style={{ alignItems: "flex-end", padding: 0 }}
          onClick={(e) => e.target === e.currentTarget && setPlusOuvert(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Autres modules"
            style={{
              width: "100%",
              background: "var(--surface-card)",
              borderRadius: "20px 20px 0 0",
              padding: "16px 16px calc(16px + env(safe-area-inset-bottom))",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "17px" }}>Modules</span>
              <button type="button" className="sy-iconbtn sy-iconbtn--sm" aria-label="Fermer" onClick={() => setPlusOuvert(false)}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {TOUTES.filter((e) => !ONGLETS_BAS.includes(e.ecran)).map((e) => (
                <button
                  key={e.ecran}
                  type="button"
                  onClick={() => go(e.ecran)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "14px 6px",
                    borderRadius: 14,
                    border: "1px solid var(--border-subtle)",
                    background: courant === e.ecran ? "var(--kola-50)" : "var(--surface-card)",
                    color: courant === e.ecran ? "var(--kola-700)" : "var(--argile-800)",
                    cursor: "pointer",
                    font: "inherit",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  <Icon name={e.icone} size={22} />
                  {e.court}
                </button>
              ))}
            </div>
            <button type="button" className="sy-btn sy-btn--ghost sy-btn--md" onClick={quitter} style={{ marginTop: 6 }}>
              Quitter l'espace pro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
