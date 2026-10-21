import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

/* Bouton « Télécharger l'application » : TerraClick est une PWA, ce bouton la pose sur l'écran
   d'accueil (téléphone) ou sur le bureau (ordinateur), selon l'appareil.
   - Navigateur capable d'installer seul (Chrome, Edge, Samsung Internet sur Android et ordinateur) :
     un toucher ouvre sa fenêtre d'installation (événement beforeinstallprompt).
   - Sinon, le bouton affiche les gestes exacts pour l'appareil : iPhone (Safari), Android, ordinateur.
   - Application déjà installée (ouverte depuis l'icône) : rien ne s'affiche. */

type EvenementInstallation = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Appareil = "iphone" | "android" | "ordinateur";

const CLE_MASQUE = "tc.installation-masquee";

/* Le navigateur peut proposer l'installation dès le chargement, avant que le bouton soit
   affiché : la proposition est captée ici, au démarrage de l'application, et gardée. */
let propositionEnAttente: EvenementInstallation | null = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // le bouton de l'application remplace la mini-barre du navigateur
  propositionEnAttente = e as EvenementInstallation;
  window.dispatchEvent(new Event("tc-installable"));
});

/**
 * Ouvre la fenêtre d'installation du navigateur si elle est disponible (menu ⋮ de l'accueil).
 * Renvoie faux sinon : l'appelant montre alors les gestes à faire (page Paramètres).
 */
export async function proposerInstallation(): Promise<boolean> {
  if (!propositionEnAttente) return false;
  const proposition = propositionEnAttente;
  propositionEnAttente = null;
  await proposition.prompt();
  await proposition.userChoice;
  return true;
}

export function dejaInstallee(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function appareil(): Appareil {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iphone";
  if (/android/i.test(ua)) return "android";
  return "ordinateur";
}

/** Gestes à faire quand le navigateur ne sait pas installer d'un seul toucher. */
const CONSIGNES: Record<Appareil, ReactNode[]> = {
  iphone: [
    <>
      Ouvrez ce lien dans <strong>Safari</strong> (sur iPhone, seul Safari installe les applications web).
    </>,
    <>
      Touchez <strong>Partager</strong> <Icon name="share" size={14} style={{ verticalAlign: "-2px" }} /> en bas de l'écran.
    </>,
    <>
      Choisissez <strong>Sur l'écran d'accueil</strong>, puis <strong>Ajouter</strong>.
    </>,
  ],
  android: [
    <>
      Ouvrez ce lien dans <strong>Chrome</strong>.
    </>,
    <>
      Touchez le menu <strong>⋮</strong> en haut à droite.
    </>,
    <>
      Touchez <strong>Installer l'application</strong> (ou <strong>Ajouter à l'écran d'accueil</strong>), puis confirmez.
    </>,
  ],
  ordinateur: [
    <>
      Ouvrez ce lien dans <strong>Chrome</strong> ou <strong>Edge</strong>.
    </>,
    <>
      Cliquez sur l'icône d'installation à droite de la barre d'adresse (un écran avec une flèche).
    </>,
    <>
      Cliquez sur <strong>Installer</strong> : TerraClick s'ouvre dans sa propre fenêtre, avec son icône sur le bureau.
    </>,
  ],
};

/** `sobre` : bouton neutre au lieu d'orange, pour les pages où l'orange doit rester rare. */
export function BandeauInstallation({ style, sobre = false }: { style?: React.CSSProperties; sobre?: boolean }) {
  const [evenement, setEvenement] = useState<EvenementInstallation | null>(propositionEnAttente);
  const [installee, setInstallee] = useState(dejaInstallee);
  const [consignes, setConsignes] = useState(false);
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

  if (installee || masque) return null;

  const type = appareil();
  const telecharger = async () => {
    if (evenement) {
      await evenement.prompt();
      const { outcome } = await evenement.userChoice;
      if (outcome === "accepted") setInstallee(true);
      // Une proposition ne sert qu'une fois ; le navigateur en refait une plus tard si besoin.
      propositionEnAttente = null;
      setEvenement(null);
    } else {
      setConsignes((v) => !v);
    }
  };

  const fermer = () => {
    setMasque(true);
    try {
      localStorage.setItem(CLE_MASQUE, "1");
    } catch {
      /* stockage indisponible : le bouton reviendra à la prochaine visite */
    }
  };

  return (
    <div
      data-r="bandeau-installation"
      role="region"
      aria-label="Télécharger l'application"
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
          <span style={{ display: "block", fontSize: "13px", color: "#5C5248" }}>
            {type === "ordinateur" ? "L'appli sur votre ordinateur" : "L'appli sur votre écran d'accueil"}
          </span>
        </span>
        <button
          onClick={fermer}
          aria-label="Ne plus proposer"
          style={{ flex: "none", width: 36, height: 44, display: "grid", placeItems: "center", border: 0, background: "none", color: "#5C5248", cursor: "pointer" }}
        >
          <Icon name="x" size={18} />
        </button>
      </div>

      {/* Pleine largeur : le bouton reste lisible et facile à toucher, même sur petit écran. */}
      <button
        onClick={telecharger}
        aria-expanded={evenement ? undefined : consignes}
        className={`sy-btn ${sobre ? "sy-btn--outline" : "sy-btn--primary"} sy-btn--md`}
        style={{ minHeight: 46, gap: 8, justifyContent: "center", boxShadow: "none" }}
      >
        <Icon name="download" size={18} strokeWidth={2.25} />
        Télécharger l'application
      </button>

      {consignes && (
        <ol data-r="consignes-installation" style={{ margin: 0, paddingLeft: 20, fontSize: "14px", lineHeight: 1.6 }}>
          {CONSIGNES[type].map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
