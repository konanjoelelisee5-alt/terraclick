import { CONFIG } from "../lib/config";
import { useApp } from "../state/app";
import { useEstMobile } from "../lib/useEstMobile";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

/** Logo TerraClick : le pictogramme (public/icons/logo-96.png) suivi du nom, Terra foncé et Click orange. */
export function Wordmark({ size = 21 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.3) }}>
      <img
        src={`${import.meta.env.BASE_URL}icons/logo-96.png`}
        alt=""
        width={Math.round(size * 1.7)}
        height={Math.round(size * 1.7)}
        style={{ display: "block", flex: "none" }}
      />
      <span
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 800,
          fontSize: `${size}px`,
          letterSpacing: "-0.028em",
          color: "var(--color-text)",
        }}
      >
        Terra<span style={{ color: "var(--color-accent)" }}>Click</span>
      </span>
    </span>
  );
}

const LIEN: React.CSSProperties = {
  background: "none",
  border: 0,
  padding: 0,
  cursor: "pointer",
  font: "inherit",
  color: "inherit",
};

export function Header() {
  const { etat, set, go, exigerCompte, deconnecter, demarrerBesoin } = useApp();
  const estMobile = useEstMobile();
  const connecte = !!etat.auth;
  const initiales = etat.auth
    ? etat.auth.prenom
        .split(" ")
        .map((x) => x[0])
        .join("")
        .slice(0, 2)
    : "";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-divider)",
      }}
    >
      <div data-r="container" data-bloc="entete" style={{ minHeight: 72, display: "flex", alignItems: "center", gap: 26 }}>
        {/* Le logo mène à l'accueil (sur téléphone, il remplace l'onglet « Accueil »). */}
        <button
          onClick={() => go("home")}
          style={{ ...LIEN, display: "flex", alignItems: "center", gap: 10 }}
          aria-label="TerraClick, retour à l'accueil"
        >
          <Wordmark />
        </button>

        <nav
          data-r="nav-links"
          style={{ display: "flex", flex: "none", alignItems: "center", gap: 22, fontSize: "14.5px", whiteSpace: "nowrap" }}
        >
          <button
            onClick={() => {
              if (etat.screen !== "home") go("home");
              set({ deptsOpen: true });
            }}
            style={LIEN}
          >
            Départements
          </button>
          <button onClick={() => demarrerBesoin()} style={LIEN}>
            Demander une intervention
          </button>
          {CONFIG.moduleConstruction && (
            <>
              <button onClick={() => go("construction")} style={LIEN}>
                Construction
              </button>
              <button onClick={() => exigerCompte(() => go("mesProjets"))} style={LIEN}>
                Mes projets
              </button>
            </>
          )}
          <button onClick={() => go("urgence")} style={{ ...LIEN, color: "var(--color-accent-700)" }}>
            Urgence 24/24
          </button>
        </nav>

        {/* En-tête mobile : notifications à droite (la navigation d'en-tête est masquée). La ville
            se choisit dans la barre de recherche de l'accueil. */}
        <button
          data-r="nav-notif-mobile"
          onClick={() => exigerCompte(() => set({ notifOpen: !etat.notifOpen }))}
          aria-label="Notifications"
          style={{
            marginLeft: "auto",
            width: 44,
            height: 44,
            flex: "none",
            placeItems: "center",
            border: "1px solid var(--color-divider)",
            borderRadius: 999,
            background: "var(--color-neutral-100)",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          <Icon name="bell" size={20} />
        </button>
        {/* Sur téléphone, la photo de profil remplace l'onglet « Profil » de la barre du bas. */}
        {estMobile && (
          <button
            data-r="avatar-entete"
            onClick={() => (etat.auth ? go("clientDashboard") : go("connexion", { telDraft: "", apresConnexion: "clientDashboard" }))}
            aria-label={etat.auth ? "Mon profil" : "Se connecter"}
            style={{ ...LIEN, display: "flex", alignItems: "center", flex: "none", borderRadius: 999, marginLeft: -14 }}
          >
            <Avatar compte={etat.auth} taille={40} />
          </button>
        )}

        <div data-r="nav-auth" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {connecte && (
            <>
              <button
                onClick={() => set({ notifOpen: !etat.notifOpen })}
                aria-label="Notifications"
                style={{
                  position: "relative",
                  width: 44,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "999px",
                  background: "var(--surface-card)",
                  cursor: "pointer",
                  color: "inherit",
                }}
              >
                <Icon name="bell" size={20} />
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 7,
                    minWidth: 17,
                    height: 17,
                    padding: "0 4px",
                    borderRadius: "999px",
                    background: "var(--color-accent)",
                    color: "#fff",
                    fontSize: "10.5px",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  3
                </span>
              </button>
              <button onClick={() => exigerCompte(() => go("clientDashboard"))} className="sy-btn sy-btn--outline sy-btn--md">
                Mon espace
              </button>
              <button
                onClick={deconnecter}
                style={{ ...LIEN, display: "flex", alignItems: "center", gap: 10, padding: "4px 6px" }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "999px",
                    background: "var(--kola-50)",
                    color: "var(--kola-600)",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                >
                  {initiales}
                </span>
                <span style={{ fontSize: "14.5px", whiteSpace: "nowrap" }}>{etat.auth?.prenom}</span>
              </button>
            </>
          )}
          {!connecte && (
            <>
              {/* Pages dédiées ; la feuille basse reste le mur qui monte au moment d'agir. */}
              <button onClick={() => go("connexion", { telDraft: "", apresConnexion: "clientDashboard" })} className="sy-btn sy-btn--outline sy-btn--md">
                Se connecter
              </button>
              <button
                onClick={() => go("inscription", { telDraft: "", apresConnexion: "clientDashboard" })}
                className="sy-btn sy-btn--primary sy-btn--md"
              >
                S'inscrire
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
