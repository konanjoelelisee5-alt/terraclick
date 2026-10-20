import { useEffect, useState } from "react";
import { Icon } from "./Icon";

/* Bandeau « Installer TerraClick » : l'application est une PWA, ce bandeau la fait poser sur
   l'écran d'accueil en un geste.
   - Android, ordinateur (Chrome, Edge) : le navigateur fournit l'événement beforeinstallprompt ;
     le bouton ouvre sa fenêtre d'installation.
   - iPhone / iPad (Safari) : aucune installation automatique n'existe ; le bouton affiche les
     deux gestes à faire (Partager → Sur l'écran d'accueil).
   - Application déjà installée (ouverte depuis l'icône) : rien ne s'affiche. */

type EvenementInstallation = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const CLE_MASQUE = "tc.installation-masquee";

/* Le navigateur peut proposer l'installation dès le chargement, avant que le bandeau soit
   affiché : la proposition est captée ici, au démarrage de l'application, et gardée. */
let propositionEnAttente: EvenementInstallation | null = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // le bouton de l'application remplace la mini-barre du navigateur
  propositionEnAttente = e as EvenementInstallation;
  window.dispatchEvent(new Event("tc-installable"));
});

function dejaInstallee(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const estIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export function BandeauInstallation({ style }: { style?: React.CSSProperties }) {
  const [evenement, setEvenement] = useState<EvenementInstallation | null>(propositionEnAttente);
  const [installee, setInstallee] = useState(dejaInstallee);
  const [aideIOS, setAideIOS] = useState(false);
  const [masque, setMasque] = useState(() => {
    try {
      return localStorage.getItem(CLE_MASQUE) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const surProposition = () => setEvenement(propositionEnAttente);
    const surInstallee = () => setInstallee(true);
    window.addEventListener("tc-installable", surProposition);
    window.addEventListener("appinstalled", surInstallee);
    return () => {
      window.removeEventListener("tc-installable", surProposition);
      window.removeEventListener("appinstalled", surInstallee);
    };
  }, []);

  const ios = estIOS();
  // Rien à proposer : déjà installée, refusée par le client, ou navigateur incapable d'installer.
  if (installee || masque || (!evenement && !ios)) return null;

  const installer = async () => {
    if (evenement) {
      await evenement.prompt();
      const { outcome } = await evenement.userChoice;
      if (outcome === "accepted") setInstallee(true);
      // Une proposition ne sert qu'une fois ; le navigateur en refait une plus tard si besoin.
      propositionEnAttente = null;
      setEvenement(null);
    } else {
      setAideIOS((v) => !v);
    }
  };

  const fermer = () => {
    setMasque(true);
    try {
      localStorage.setItem(CLE_MASQUE, "1");
    } catch {
      /* stockage indisponible : le bandeau reviendra à la prochaine visite */
    }
  };

  return (
    <div
      data-r="bandeau-installation"
      role="region"
      aria-label="Installer l'application"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 16,
        background: "var(--color-neutral-100)",
        border: "1px solid var(--color-divider)",
        boxShadow: "0 2px 10px rgba(26,22,19,.06)",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" width={44} height={44} style={{ borderRadius: 10, flex: "none" }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 700, fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            TerraClick
          </span>
          <span style={{ display: "block", fontSize: "13px", color: "#5C5248" }}>L'appli sur votre écran d'accueil</span>
        </span>
        <button onClick={installer} className="sy-btn sy-btn--primary sy-btn--md" style={{ flex: "none", minHeight: 44, boxShadow: "none" }}>
          Installer
        </button>
        <button
          onClick={fermer}
          aria-label="Ne plus proposer"
          style={{ flex: "none", width: 36, height: 44, display: "grid", placeItems: "center", border: 0, background: "none", color: "#5C5248", cursor: "pointer" }}
        >
          <Icon name="x" size={18} />
        </button>
      </div>

      {aideIOS && (
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: "14px", lineHeight: 1.6 }}>
          <li>
            Dans Safari, touchez <strong>Partager</strong> <Icon name="share" size={14} style={{ verticalAlign: "-2px" }} /> en bas de l'écran.
          </li>
          <li>
            Choisissez <strong>Sur l'écran d'accueil</strong>, puis <strong>Ajouter</strong>.
          </li>
        </ol>
      )}
    </div>
  );
}
