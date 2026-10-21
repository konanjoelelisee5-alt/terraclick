import { CONVERSATIONS } from "../data/compte";
import { CONFIG } from "../lib/config";
import { useApp } from "../state/app";
import { Icon } from "./Icon";

/* Sous 1080 px la navigation d'en-tête disparaît : cette barre fixe la remplace.
   Accueil · Favoris · Messages · Profil (les demandes sont dans Profil ; Carte et Projets s'ajoutent si CONFIG
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
      actif: /^(compte|connexion|inscription|client[A-Z]|demandeEnvoyee)/.test(etat.screen),
      // Comme « Se connecter » sur ordinateur : la page de connexion, pas la feuille basse.
      go: () => (etat.auth ? go("clientDashboard") : go("connexion", { telDraft: "", apresConnexion: "clientDashboard" })),
    },
  ];

  const bouton = (o: (typeof onglets)[number]) => (
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
      <span style={{ position: "relative", display: "grid", placeItems: "center", width: 52, height: 28 }}>
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
  );

  const BARRE: React.CSSProperties = {
    flex: 1,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "space-around",
    padding: "6px 4px",
    background: "var(--color-neutral-100)",
    borderTop: "1px solid var(--color-divider)",
  };

  // Bouton central (CONFIG.ongletCentral) : les onglets se répartissent de part et d'autre.
  const milieu = Math.ceil(onglets.length / 2);
  const ongletsActif = etat.screen === "onglets" || etat.screen === "accord";

  return (
    <nav
      data-r="tabbar"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 25,
        flexDirection: "column",
        alignItems: "stretch",
        filter: "drop-shadow(0 -2px 6px rgba(26,22,19,.05))",
      }}
    >
      {CONFIG.ongletCentral ? (
        <div style={{ display: "flex", alignItems: "stretch", minHeight: 62 }}>
          <div style={{ ...BARRE, paddingRight: 0 }}>{onglets.slice(0, milieu).map(bouton)}</div>

          {/* Découpe : la ligne de la barre plonge en arrondi sous le bouton, puis repart. */}
          <div style={{ position: "relative", width: 110, flex: "none" }}>
            {/* Fond plein sous la découpe, quelle que soit la hauteur de la barre. */}
            <span aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: 44, bottom: 0, background: "var(--color-neutral-100)" }} />
            <svg aria-hidden="true" width="110" height="62" viewBox="0 0 110 62" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, display: "block" }}>
              <path d="M0 0.5 H10 C24 0.5 23 44 55 44 C87 44 86 0.5 100 0.5 H110 V62 H0 Z" fill="var(--color-neutral-100)" />
              <path d="M0 0.5 H10 C24 0.5 23 44 55 44 C87 44 86 0.5 100 0.5 H110" fill="none" stroke="var(--color-divider)" strokeWidth="1" />
            </svg>
            <button
              data-r="onglet-central"
              onClick={() => go("onglets")}
              aria-label="Mes onglets"
              aria-current={ongletsActif ? "page" : undefined}
              style={{
                position: "absolute",
                left: "50%",
                top: -20,
                transform: "translateX(-50%)",
                width: 56,
                height: 56,
                display: "grid",
                placeItems: "center",
                border: 0,
                borderRadius: 999,
                background: ongletsActif ? "var(--color-accent-700)" : "var(--color-accent)",
                color: "#fff",
                boxShadow: "0 6px 16px rgba(227,90,27,.35)",
                cursor: "pointer",
              }}
            >
              <Icon name="layers" size={25} strokeWidth={2.1} />
            </button>
          </div>

          <div style={{ ...BARRE, paddingLeft: 0 }}>{onglets.slice(milieu).map(bouton)}</div>
        </div>
      ) : (
        <div style={BARRE}>{onglets.map(bouton)}</div>
      )}
      {/* Zone sûre de l'iPhone (barre d'accueil) : le contenu reste au-dessus. */}
      <div style={{ height: "env(safe-area-inset-bottom)", background: "var(--color-neutral-100)" }} />
    </nav>
  );
}
