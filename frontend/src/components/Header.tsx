import { useApp } from "../state/app";
import { Icon } from "./Icon";

/** Mot-symbole de la marque : aucun logo n'existe, la marque s'écrit. */
export function Wordmark({ size = 21 }: { size?: number }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-heading)",
        fontWeight: 800,
        fontSize: `${size}px`,
        letterSpacing: "-0.028em",
        color: "var(--color-text)",
      }}
    >
      servis<span style={{ color: "var(--color-accent)" }}>yakro</span>
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
  const { etat, set, go, exigerCompte, deconnecter, ville, villeIdx } = useApp();
  const connecte = !!etat.auth;
  const initiales = etat.auth
    ? etat.auth.prenom
        .split(" ")
        .map((x) => x[0])
        .join("")
        .slice(0, 2)
    : "";

  const changerVille = () => set({ ville: (villeIdx + 1) % 4 });

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
      <div data-r="container" style={{ minHeight: 72, display: "flex", alignItems: "center", gap: 26 }}>
        <button
          onClick={() => go("home")}
          style={{ ...LIEN, display: "flex", alignItems: "center", gap: 10 }}
          aria-label="Servis Yakro, retour à l'accueil"
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
          <button onClick={() => exigerCompte(() => go("devis", { step: 1 }))} style={LIEN}>
            Demander un devis
          </button>
          <button onClick={() => go("construction")} style={LIEN}>
            Construction
          </button>
          <button onClick={() => exigerCompte(() => go("mesProjets"))} style={LIEN}>
            Mes projets
          </button>
          <button onClick={() => go("urgence")} style={{ ...LIEN, color: "var(--color-accent-700)" }}>
            Urgence 24/24
          </button>
        </nav>

        <button
          onClick={changerVille}
          data-r="nav-ville"
          style={{
            display: "none",
            marginLeft: "auto",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "1px solid var(--color-divider)",
            borderRadius: "999px",
            padding: "6px 12px",
            cursor: "pointer",
            font: "inherit",
            fontSize: "13px",
            color: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="map-pin" size={15} strokeWidth={2.75} color="var(--color-accent)" />
          {ville}
        </button>

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
              <button onClick={() => exigerCompte(() => go("compte"))} className="sy-btn sy-btn--outline sy-btn--md">
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
              <button
                onClick={() => set({ authOpen: true, authStep: "tel", telDraft: "", code: "" })}
                className="sy-btn sy-btn--outline sy-btn--md"
              >
                Se connecter
              </button>
              <button
                onClick={() => set({ authOpen: true, authStep: "tel", telDraft: "", code: "" })}
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
