import { useApp } from "../state/app";
import { Icon } from "./Icon";

/* Sous 1080 px la navigation d'en-tête disparaît : cette barre fixe la remplace.
   Cinq destinations, cible tactile pleine hauteur. */
export function TabBar() {
  const { etat, go, exigerCompte, ouvrirChat } = useApp();

  const onglets = [
    {
      nom: "Accueil",
      icon: "home",
      actif: etat.screen === "home" && etat.modeAccueil === "recherche",
      go: () => go("home", { modeAccueil: "recherche" }),
    },
    {
      nom: "Carte",
      icon: "map",
      actif: etat.screen === "home" && etat.modeAccueil === "carte",
      go: () => go("home", { modeAccueil: "carte" }),
    },
    {
      nom: "Projets",
      icon: "route",
      actif: etat.screen.indexOf("proj") === 0 || etat.screen === "mesProjets",
      go: () => exigerCompte(() => go("mesProjets")),
    },
    { nom: "Chat", icon: "message-circle", actif: etat.screen === "chat", go: () => ouvrirChat(etat.active) },
    {
      nom: "Compte",
      icon: "user",
      actif: etat.screen === "compte" || etat.screen === "connexion" || etat.screen === "inscription",
      // Comme « Se connecter » sur ordinateur : la page de connexion, pas la feuille basse.
      go: () => (etat.auth ? go("compte") : go("connexion", { telDraft: "" })),
    },
  ];

  return (
    <nav
      data-r="tabbar"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 25,
        background: "var(--color-bg)",
        borderTop: "1px solid var(--color-divider)",
        padding: "8px 8px calc(8px + env(safe-area-inset-bottom))",
        justifyContent: "space-around",
        alignItems: "stretch",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.05)",
      }}
    >
      {onglets.map((o) => (
        <button
          key={o.nom}
          onClick={o.go}
          aria-current={o.actif ? "page" : undefined}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: 0,
            cursor: "pointer",
            font: "inherit",
            padding: "4px 2px",
            borderRadius: "var(--radius-md)",
            color: o.actif ? "var(--color-accent-700)" : "var(--color-neutral-700)",
          }}
        >
          <Icon name={o.icon} size={21} strokeWidth={2.75} />
          <span style={{ fontSize: "10.5px", letterSpacing: "0.01em" }}>{o.nom}</span>
        </button>
      ))}
    </nav>
  );
}
