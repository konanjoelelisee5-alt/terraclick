import { CONVERSATIONS } from "../data/compte";
import { CONFIG } from "../lib/config";
import { useApp } from "../state/app";
import { Icon } from "./Icon";

/* Sous 1080 px la navigation d'en-tête disparaît : cette barre fixe la remplace.
   Accueil · Favoris · Réservations · Messages · Profil (Carte et Projets s'ajoutent si CONFIG
   les rebranche), cible tactile pleine hauteur. */
export function TabBar() {
  const { etat, go, exigerCompte, ouvrirChat } = useApp();
  // Connexion et inscription s'affichent en plein écran, sans barre d'onglets.
  if (etat.screen === "connexion" || etat.screen === "inscription") return null;

  const onglets: { nom: string; icon: string; actif: boolean; go: () => void; badge?: number }[] = [
    {
      nom: "Accueil",
      icon: "home",
      actif: etat.screen === "home" && etat.modeAccueil === "recherche",
      go: () => go("home", { modeAccueil: "recherche" }),
    },
    {
      nom: "Favoris",
      icon: "heart",
      actif: etat.screen === "favoris",
      go: () => go("favoris"),
    },
    {
      // Les demandes d'intervention du client et leur suivi.
      nom: "Réservations",
      icon: "calendar-check",
      actif: /^(clientDemandes|clientSuivi|demandeEnvoyee)$/.test(etat.screen),
      go: () => exigerCompte(() => go("clientDemandes")),
    },
    ...(CONFIG.modesAccueil
      ? [
          {
            nom: "Carte",
            icon: "map",
            actif: etat.screen === "home" && etat.modeAccueil === "carte",
            // La carte est réservée aux clients inscrits.
            go: () => exigerCompte(() => go("home", { modeAccueil: "carte" })),
          },
        ]
      : []),
    ...(CONFIG.moduleConstruction
      ? [
          {
            nom: "Projets",
            icon: "route",
            actif: etat.screen.indexOf("proj") === 0 || etat.screen === "mesProjets",
            go: () => exigerCompte(() => go("mesProjets")),
          },
        ]
      : []),
    {
      nom: "Messages",
      icon: "message-circle",
      actif: etat.screen === "chat",
      go: () => ouvrirChat(etat.active),
      // Messagerie encore fictive : les conversations de démonstration comptent comme non lues
      // jusqu'à ce que la messagerie passe par l'API.
      badge: etat.auth ? CONVERSATIONS.length : 0,
    },
    {
      nom: "Profil",
      icon: "user",
      actif: /^(compte|connexion|inscription|client[A-Z])/.test(etat.screen) && !/^client(Demandes|Suivi)$/.test(etat.screen),
      // Comme « Se connecter » sur ordinateur : la page de connexion, pas la feuille basse.
      go: () => (etat.auth ? go("clientDashboard") : go("connexion", { telDraft: "", apresConnexion: "clientDashboard" })),
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
        background: "var(--color-neutral-100)",
        borderTop: "1px solid var(--color-divider)",
        // Zone sûre de l'iPhone (barre d'accueil) : le contenu reste au-dessus.
        padding: "6px 8px calc(6px + env(safe-area-inset-bottom))",
        justifyContent: "space-around",
        alignItems: "stretch",
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
            minHeight: 48,
            padding: "4px 2px",
            borderRadius: "var(--radius-md)",
            // Actif en orange (nuance foncée, lisible en 11 px), les autres en gris moyen ; pas de pastille.
            color: o.actif ? "var(--color-accent-700)" : "var(--color-neutral-700)",
          }}
        >
          <span
            style={{
              position: "relative",
              display: "grid",
              placeItems: "center",
              width: 52,
              height: 28,
            }}
          >
            <Icon name={o.icon} size={24} strokeWidth={o.actif ? 2.25 : 1.75} />
            {!!o.badge && (
              <span
                aria-label={`${o.badge} non lus`}
                style={{
                  position: "absolute",
                  top: -2,
                  right: 6,
                  minWidth: 17,
                  height: 17,
                  padding: "0 4px",
                  borderRadius: 999,
                  background: "var(--color-accent)",
                  color: "#fff",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                  border: "2px solid var(--color-neutral-100)",
                }}
              >
                {o.badge}
              </span>
            )}
          </span>
          <span style={{ fontSize: "11px", fontWeight: o.actif ? 700 : 500, letterSpacing: "0.01em" }}>{o.nom}</span>
        </button>
      ))}
    </nav>
  );
}
