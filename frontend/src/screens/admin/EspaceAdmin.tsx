import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { api, type ApercuAdmin } from "../../lib/api";
import { peut } from "../../lib/acces";
import { useApp } from "../../state/app";
import type { Compte, Ecran } from "../../state/types";
import { Icon } from "../../components/Icon";
import { CONFIG } from "../../lib/config";

/* Espace administrateur, d'après la maquette « Servis Yakro » (rôle Administrateur) : une
   application à part, comme l'espace pro — rail sombre sur ordinateur, barre du haut,
   navigation basse et « Plus » sur téléphone. Chaque module s'ouvre à sa permission : un
   manager y voit l'opérationnel, un administrateur tout (rôles et permissions, config/acces.php).
   Les modules sont ceux que l'application fait vivre aujourd'hui ; ceux de la maquette sans
   équivalent (abonnements, paiements plateforme, webhooks, plans) viendront avec leur métier. */

type Entree = { ecran: Ecran; libelle: string; court: string; icone: string; permission: string; compteur?: keyof ApercuAdmin["a_traiter"] };

const GROUPES: { titre: string; entrees: Entree[] }[] = [
  {
    titre: "Pilotage",
    entrees: [
      { ecran: "adminApercu", libelle: "Vue d'ensemble", court: "Accueil", icone: "layout-dashboard", permission: "admin.apercu" },
      { ecran: "adminActivite", libelle: "Journal d'activité", court: "Journal", icone: "history", permission: "admin.activite" },
    ],
  },
  {
    titre: "Vérification et qualité",
    entrees: [
      { ecran: "adminCandidatures", libelle: "Candidatures", court: "Candidatures", icone: "badge-check", permission: "candidatures.voir", compteur: "candidatures" },
      { ecran: "adminSignalements", libelle: "Signalements", court: "Signalements", icone: "flag", permission: "signalements.voir", compteur: "signalements" },
    ],
  },
  {
    titre: "Annuaire",
    entrees: [
      { ecran: "adminDemandes", libelle: "Demandes et commandes", court: "Demandes", icone: "file-text", permission: "demandes.voir_toutes" },
      { ecran: "adminPrestataires", libelle: "Prestataires", court: "Prestataires", icone: "briefcase", permission: "prestataires.voir" },
      { ecran: "adminUtilisateurs", libelle: "Utilisateurs", court: "Utilisateurs", icone: "users", permission: "utilisateurs.voir" },
    ],
  },
  {
    titre: "Configuration",
    entrees: [
      { ecran: "adminSecteurs", libelle: "Secteurs d'activité", court: "Secteurs", icone: "layout-grid", permission: "secteurs.voir" },
      { ecran: "adminCatalogue", libelle: "Catalogue et prix", court: "Prix", icone: "receipt", permission: "catalogue.prix" },
      { ecran: "adminRoles", libelle: "Rôles et permissions", court: "Rôles", icone: "shield-check", permission: "roles.gerer" },
    ],
  },
];


/** Premier module ouvert à ce compte : la page d'arrivée de l'équipe. */
export function premierModule(compte: Compte | null): Ecran {
  return GROUPES.flatMap((g) => g.entrees).find((e) => peut(compte, e.permission))?.ecran ?? "adminApercu";
}

/** Onglets de la barre basse sur téléphone ; le reste passe par « Plus ». */
const ONGLETS_BAS: Ecran[] = ["adminApercu", "adminCandidatures", "adminSignalements", "adminDemandes"];

/* ---- Styles partagés par les écrans de l'espace ---- */

export const TITRE_CARTE: CSSProperties = { margin: 0, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "16px", letterSpacing: "-0.02em" };

export const GRIS = "var(--argile-700)";

/** Champ de recherche des listes (prestataires, utilisateurs, demandes). */
export function Recherche({ valeur, onChange, placeholder }: { valeur: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="sy-input-wrap" style={{ flex: 1, minWidth: 220 }}>
      <span className="sy-input-wrap__icon">
        <Icon name="search" size={18} />
      </span>
      <input className="sy-input" type="search" value={valeur} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

/** Pastilles de filtre (statuts). */
export function Filtres<T extends string>({ options, valeur, onChange }: { options: { cle: T; nom: string }[]; valeur: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
      {options.map((o) => (
        <button key={o.cle} role="tab" aria-selected={valeur === o.cle} className={`sy-tag${valeur === o.cle ? " sy-tag--selected" : ""}`} onClick={() => onChange(o.cle)} style={{ flex: "none" }}>
          {o.nom}
        </button>
      ))}
    </div>
  );
}

export function Vide({ texte }: { texte: string }) {
  return (
    <div role="status" className="sy-card" style={{ padding: "28px 20px", textAlign: "center", color: GRIS, fontSize: "14.5px" }}>
      {texte}
    </div>
  );
}

const jour = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
export const dateCourte = jour;
export const dateHeure = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).replace(":", " h ");

/* ---- Compteurs du rail (ce qui attend l'équipe), partagés entre les écrans ---- */

let compteursEnMemoire: ApercuAdmin["a_traiter"] | null = null;

function useCompteurs(ecran: Ecran) {
  const [compteurs, setCompteurs] = useState(compteursEnMemoire);
  useEffect(() => {
    const arret = new AbortController();
    api.admin.apercu(arret.signal).then(
      (a) => {
        compteursEnMemoire = a.a_traiter;
        setCompteurs(a.a_traiter);
      },
      () => {},
    );
    return () => arret.abort();
  }, [ecran]);
  return compteurs;
}

function Pastille({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, lineHeight: 1.3, padding: "1px 7px", borderRadius: 999, background: "var(--kola-500)", color: "#fff" }}>{n}</span>
  );
}

export function EspaceAdmin({ titre, sousTitre, actions, children }: { titre: string; sousTitre?: string; actions?: ReactNode; children: ReactNode }) {
  const { etat, go, deconnecter } = useApp();
  const compteurs = useCompteurs(etat.screen);
  // Tableau de bord : l'équipe n'a pas d'application client derrière, on en sort en se déconnectant.
  const tableau = CONFIG.espaceEquipe === "tableauDeBord";
  const sortie = tableau ? "Se déconnecter" : "Quitter l'administration";
  const [menuOuvert, setMenuOuvert] = useState(false);
  const courant = etat.screen;
  // Seuls les modules permis à ce compte (le manager n'a ni les rôles ni les prix).
  const groupes = GROUPES.map((g) => ({ ...g, entrees: g.entrees.filter((e) => peut(etat.auth, e.permission)) })).filter((g) => g.entrees.length);
  const TOUTES = groupes.flatMap((g) => g.entrees);
  const ongletsBas = ONGLETS_BAS.filter((e) => TOUTES.some((x) => x.ecran === e));
  const permis = TOUTES.some((e) => e.ecran === courant);
  const administrateur = !!etat.auth?.roles?.includes("admin");
  const entreeCourante = TOUTES.find((e) => e.ecran === courant);
  const groupeCourant = groupes.find((g) => g.entrees.some((e) => e.ecran === courant));
  const [plusOuvert, setPlusOuvert] = useState(false);
  const n = (e: Entree) => (e.compteur && compteurs ? compteurs[e.compteur] : undefined);

  useEffect(() => {
    window.scrollTo(0, 0);
    setPlusOuvert(false);
    setMenuOuvert(false);
  }, [etat.screen]);

  const quitter = () => {
    if (tableau) deconnecter();
    go("home");
  };

  // Réservé à l'équipe : un autre compte voit seulement de quoi revenir à l'application.
  if (!peut(etat.auth, "admin.acceder")) {
    return (
      <main style={{ maxWidth: 520, margin: "0 auto", padding: "48px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", margin: 0 }}>Espace administrateur</h1>
        <p style={{ color: GRIS }}>Réservé à l'équipe TerraClick.</p>
        <button onClick={quitter} className="sy-btn sy-btn--primary sy-btn--md">
          Revenir à l'accueil
        </button>
      </main>
    );
  }

  return (
    <div data-r="pro-app" data-espace="admin" data-mode={tableau ? "tableau" : "application"} data-menu={menuOuvert ? "ouvert" : undefined}>
      {/* ---- Rail sombre (ordinateur ; menu latéral sur téléphone en tableau de bord) ---- */}
      {menuOuvert && <div data-r="admin-voile" onClick={() => setMenuOuvert(false)} />}
      <aside data-r="pro-side" aria-label="Espace administrateur">
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 18px 14px" }}>
          <span style={{ width: 34, height: 34, flex: "none", borderRadius: 9, background: "var(--kola-500)", color: "#fff", display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "13px" }}>
            tc
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "15px", color: "#fff" }}>{administrateur ? "Administration" : "Espace manager"}</div>
            <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,.55)" }}>TerraClick</div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "4px 10px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
          {groupes.map((g) => (
            <div key={g.titre} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.4)", padding: "0 10px 4px" }}>{g.titre}</span>
              {g.entrees.map((e) => {
                const actif = courant === e.ecran;
                return (
                  <button
                    key={e.ecran}
                    type="button"
                    onClick={() => go(e.ecran)}
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
                    <Icon name={e.icone} size={17} />
                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.libelle}</span>
                    <Pastille n={n(e)} />
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 32, height: 32, flex: "none", borderRadius: "50%", background: "rgba(255,255,255,.12)", color: "#fff", display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "12px" }}>
              {(etat.auth?.prenom || "A").slice(0, 2).toUpperCase()}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{etat.auth?.prenom}</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,.55)" }}>{administrateur ? "Administrateur" : "Manager"}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={quitter}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 36, borderRadius: 9, cursor: "pointer", font: "inherit", fontSize: "13px", fontWeight: 600, border: "1px solid rgba(255,255,255,.18)", background: "transparent", color: "rgba(255,255,255,.8)" }}
          >
            <Icon name={tableau ? "log-out" : "x"} size={15} />
            {sortie}
          </button>
        </div>
      </aside>

      <div data-r="pro-main">
        {/* ---- Barre supérieure ---- */}
        <header data-r="pro-top">
          {tableau && (
            <button type="button" className="sy-iconbtn sy-iconbtn--md sy-iconbtn--outline" data-r="admin-menu" aria-label="Menu" aria-expanded={menuOuvert} onClick={() => setMenuOuvert(true)}>
              <Icon name="menu" size={20} />
            </button>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              {groupeCourant?.titre ?? "Administration"}
              {entreeCourante && ` / ${entreeCourante.libelle}`}
            </div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "17px", letterSpacing: "-0.02em", lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {titre}
            </h1>
          </div>
          {actions}
          {!tableau && (
            <button type="button" className="sy-iconbtn sy-iconbtn--md sy-iconbtn--outline" aria-label="Quitter l'administration" onClick={quitter} data-r="admin-quitter-haut">
              <Icon name="x" size={18} />
            </button>
          )}
        </header>

        <main data-r="pro-content">
          {permis ? (
            <>
              {sousTitre && <p style={{ margin: 0, fontSize: "14px", color: GRIS }}>{sousTitre}</p>}
              {children}
            </>
          ) : (
            <Vide texte="Votre rôle n'ouvre pas ce module. Demandez l'accès à un administrateur." />
          )}
        </main>
      </div>

      {/* ---- Navigation basse (téléphone, mode « application » seulement) ---- */}
      {!tableau && (
      <nav data-r="pro-bottom" aria-label="Navigation de l'administration">
        {ongletsBas.map((ecran) => {
          const e = TOUTES.find((x) => x.ecran === ecran)!;
          const actif = courant === ecran;
          return (
            <button key={ecran} type="button" onClick={() => go(ecran)} aria-current={actif ? "page" : undefined} style={{ color: actif ? "var(--kola-600)" : "var(--argile-700)" }}>
              <span style={{ position: "relative", display: "flex" }}>
                <Icon name={e.icone} size={21} />
                {n(e) ? (
                  <span style={{ position: "absolute", top: -6, right: -12 }}>
                    <Pastille n={n(e)} />
                  </span>
                ) : null}
              </span>
              {e.court}
            </button>
          );
        })}
        <button type="button" onClick={() => setPlusOuvert(true)} aria-expanded={plusOuvert} style={{ color: ongletsBas.includes(courant) ? "var(--argile-700)" : "var(--kola-600)" }}>
          <Icon name="layout-grid" size={21} />
          Plus
        </button>
      </nav>
      )}

      {!tableau && plusOuvert && (
        <div className="sy-dialog__scrim" style={{ alignItems: "flex-end", padding: 0 }} onClick={(e) => e.target === e.currentTarget && setPlusOuvert(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Modules de l'administration"
            style={{ width: "100%", background: "var(--surface-card)", borderRadius: "20px 20px 0 0", padding: "16px 16px calc(16px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 6 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "17px" }}>Modules</span>
              <button type="button" className="sy-iconbtn sy-iconbtn--sm" aria-label="Fermer" onClick={() => setPlusOuvert(false)}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {TOUTES.filter((e) => !ongletsBas.includes(e.ecran)).map((e) => (
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
              Quitter l'administration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
