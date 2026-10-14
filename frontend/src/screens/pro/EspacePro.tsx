import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useApp } from "../../state/app";
import type { Ecran } from "../../state/types";
import { PRO, type Ton } from "../../data/pro";
import { Icon } from "../../components/Icon";
import { useEtatPro } from "./store";

/* Cadre commun de l'espace prestataire : rail de navigation à gauche (onglets
   défilants sous 1080 px), titre de l'écran, puis le contenu. */

type Entree = { ecran: Ecran; libelle: string; icone: string; compte?: number };

const NAVIGATION: Entree[] = [
  { ecran: "proDashboard", libelle: "Tableau de bord", icone: "layout-dashboard" },
  { ecran: "proDemandes", libelle: "Demandes de devis", icone: "inbox", compte: 3 },
  { ecran: "proProfil", libelle: "Mon profil", icone: "user" },
  { ecran: "proRealisations", libelle: "Mes réalisations", icone: "images" },
  { ecran: "proVerification", libelle: "Vérification", icone: "shield-check" },
  { ecran: "proAbonnement", libelle: "Abonnement et factures", icone: "receipt", compte: 1 },
  { ecran: "proMiseEnAvant", libelle: "Mise en avant", icone: "trending-up" },
  { ecran: "proAvis", libelle: "Mes avis", icone: "star" },
  { ecran: "proNotifications", libelle: "Notifications", icone: "bell", compte: 6 },
];

/** Écrans de détail rattachés à une entrée du rail. */
const RATTACHEMENT: Partial<Record<Ecran, Ecran>> = { proDemande: "proDemandes" };

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

export function EspacePro({ titre, sousTitre, children }: { titre: string; sousTitre?: string; children: ReactNode }) {
  const { etat, go } = useApp();
  const { notificationsLues } = useEtatPro();
  const courant = RATTACHEMENT[etat.screen] ?? etat.screen;
  const nav = useRef<HTMLElement>(null);

  // Sur téléphone, les onglets défilent : on amène l'onglet de l'écran ouvert dans la vue.
  useEffect(() => {
    const rangee = nav.current;
    if (!rangee || rangee.scrollWidth <= rangee.clientWidth) return;
    const actif = rangee.querySelector<HTMLElement>('[aria-current="page"]');
    if (actif) rangee.scrollLeft = actif.offsetLeft - (rangee.clientWidth - actif.offsetWidth) / 2;
  }, [courant]);

  return (
    <main data-r="container" style={{ paddingTop: 24, paddingBottom: 64 }}>
      <div data-r="pro-shell">
        <aside data-r="pro-rail" aria-label="Espace prestataire">
          <div data-r="pro-rail-tete" style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 10px 14px" }}>
            <span
              style={{
                width: 40,
                height: 40,
                flex: "none",
                borderRadius: 12,
                background: "var(--kola-100)",
                color: "var(--kola-700)",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                fontSize: "14px",
              }}
            >
              {PRO.initiales}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ ...OVERLINE, fontSize: "10.5px" }}>Espace pro</div>
              <div style={{ fontSize: "14px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {PRO.nom}
              </div>
            </div>
          </div>
          <nav ref={nav} data-r="pro-nav" style={{ display: "flex", flexDirection: "column", gap: 3, position: "relative" }}>
            {NAVIGATION.map((n) => {
              const actif = courant === n.ecran;
              const compte = n.ecran === "proNotifications" && notificationsLues ? 0 : n.compte;
              return (
                <button
                  key={n.ecran}
                  type="button"
                  onClick={() => go(n.ecran)}
                  aria-current={actif ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    minHeight: 44,
                    padding: "0 12px",
                    borderRadius: 12,
                    cursor: "pointer",
                    font: "inherit",
                    fontSize: "14px",
                    fontWeight: 600,
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    border: actif ? "1px solid var(--kola-200)" : "1px solid transparent",
                    background: actif ? "var(--kola-50)" : "transparent",
                    color: actif ? "var(--kola-700)" : "var(--argile-700)",
                  }}
                >
                  <Icon name={n.icone} size={18} />
                  <span style={{ flex: 1 }}>{n.libelle}</span>
                  {compte ? (
                    <span
                      style={{
                        ...MONO,
                        fontSize: "11px",
                        fontWeight: 700,
                        background: "var(--kola-500)",
                        color: "#fff",
                        borderRadius: 999,
                        padding: "2px 7px",
                        lineHeight: 1.3,
                      }}
                    >
                      {compte}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </aside>

        <section style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h1 style={{ margin: "0 0 4px", fontSize: "clamp(24px,3.4vw,30px)" }}>{titre}</h1>
            {sousTitre && <p style={{ margin: 0, fontSize: "15px", color: "var(--argile-700)" }}>{sousTitre}</p>}
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
