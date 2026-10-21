import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PROS, VILLES, type Prestataire } from "../data/catalogue";
import { sujetAchat, sujetMaison, type Sujet } from "../data/projet";
import { api, jeton, type Utilisateur } from "../lib/api";
import type { Filtre } from "../lib/annuaire";
import { CONFIG } from "../lib/config";
import { enregistrerRecherche } from "../lib/historique";
import type { Besoin, Compte, Ecran, Etat, Navigation } from "./types";

// Premier lancement ou session terminée sur cet appareil : on commence par la connexion.
const sansSession = CONFIG.connexionAuDemarrage && !jeton.lire();

const ETAT_INITIAL: Etat = {
  screen: sansSession ? "connexion" : "home",
  ville: null,
  query: "",
  titre: "Plombiers",
  filtre: {},
  quartier: 0,
  carte: null,
  deptsOpen: false,
  deptHover: 0,
  modeAccueil: "recherche",
  filtreCarte: 0,
  boxDraft: "",

  active: PROS[0],
  messages: [],
  draft: "",

  step: 1,
  cat: 0,
  quand: 0,

  auth: null,
  // Depuis l'ouverture, on entre ensuite dans l'application ; depuis « Se connecter », dans son espace.
  apresConnexion: sansSession ? "home" : "clientDashboard",
  authOpen: false,
  authStep: "tel",
  authCanal: "sms",
  telDraft: "",
  code: "",
  prenomDraft: "",
  quartierDraft: "Habitat",
  notifOpen: false,
  canaux: { app: true, sms: true, wa: true, mail: true, push: false },

  notes: { ponct: 0, qual: 0, prix: 0 },
  avisTexte: "",

  sujet: sujetAchat(),
  mode: "cle",
  rep: [],
  triOffres: 0,
  filtreProjet: 0,
  onglet: 0,
  sousProp: 0,

  assistStep: 1,
  accepte: false,
  form: { equip: [], entretien: [] },

  contratStep: 1,
  signMoyen: 0,
  sujetPv: false,
  signCode: "",
  signe: false,

  fiche: null,

  besoin: besoinVide(),
  besoinEtape: 0,
  demandeEnvoyee: null,
};

function besoinVide(): Besoin {
  return {
    secteur: null,
    suggestions: [],
    probleme: null,
    precision: "",
    quartier: null,
    repere: "",
    quand: null,
    date: "",
    photos: [],
    pack: [],
    mode: null,
    prestataire: null,
    paiement: "especes",
    service: "lavage",
    express: false,
    depot: null,
    heure: "",
    adresse: "",
  };
}

function instantane(e: Etat): Navigation {
  return {
    screen: e.screen,
    sujet: e.sujet,
    onglet: e.onglet,
    titre: e.titre,
    filtre: e.filtre,
    quartier: e.quartier,
    carte: e.carte,
    assistStep: e.assistStep,
    contratStep: e.contratStep,
    sujetPv: e.sujetPv,
    modeAccueil: e.modeAccueil,
    fiche: e.fiche,
    besoinEtape: e.besoinEtape,
  };
}

function versCompte(u: Utilisateur): Compte {
  return { prenom: u.nom ?? "", tel: u.telephone_affichage, quartier: u.quartier?.nom ?? "", photo: u.photo ?? null };
}

type Contexte = {
  etat: Etat;
  /** Fusionne un correctif dans l'état, à la manière d'un `setState` partiel. */
  set: (patch: Partial<Etat> | ((e: Etat) => Partial<Etat>)) => void;
  /** Change d'écran, ferme le méga-menu et remonte en haut de page. */
  go: (screen: Ecran, patch?: Partial<Etat>) => void;
  /** Exige un compte avant d'agir : sinon la feuille d'authentification monte. */
  exigerCompte: (action: () => void) => void;
  /**
   * Ouvre les résultats sous `titre`. Sans filtre explicite, le titre (ou la saisie
   * de la barre de recherche) sert de texte libre.
   */
  rechercher: (titre?: string, filtre?: Filtre) => void;
  ouvrirChat: (p: Prestataire) => void;
  envoyerMessage: (texte: string) => void;
  /** Enregistre le compte vérifié, ferme la feuille et rejoue l'action interrompue. */
  terminerAuth: (utilisateur: Utilisateur) => void;
  /** Révoque le jeton côté serveur et oublie la session. */
  deconnecter: () => void;
  /** Ville courante, résolue depuis la configuration tant qu'aucun choix n'est fait. */
  ville: string;
  villeIdx: number;
  /** Vue des résultats, résolue depuis la configuration tant qu'aucun choix n'est fait. */
  voirCarte: boolean;
  poserSujetMaison: (patch?: Partial<Etat>) => void;
  poserSujetAchat: (patch?: Partial<Etat>) => void;
  /**
   * Ouvre l'assistant de besoin sur une demande neuve, pré-remplie au besoin (service,
   * problème, urgence, technicien). Sans service connu, il commence par le demander.
   */
  demarrerBesoin: (patch?: Partial<Besoin>) => void;
  /** Complète le besoin en cours, sans changer d'écran. */
  modifierBesoin: (patch: Partial<Besoin>) => void;
};

const AppContext = createContext<Contexte | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<Etat>(ETAT_INITIAL);
  /** Action interrompue par le mur d'authentification, rejouée après connexion. */
  const enAttente = useRef<(() => void) | null>(null);
  /** Vrai le temps d'un retour navigateur, pour ne pas réempiler l'historique. */
  const retourEnCours = useRef(false);

  const set = useCallback<Contexte["set"]>((patch) => {
    setEtat((e) => ({ ...e, ...(typeof patch === "function" ? patch(e) : patch) }));
  }, []);

  const go = useCallback<Contexte["go"]>((screen, patch) => {
    setEtat((e) => ({ ...e, screen, deptsOpen: false, ...(patch ?? {}) }));
    window.scrollTo(0, 0);
  }, []);

  // L'écran courant est empilé dans l'historique : le bouton « Précédent » du
  // navigateur et le geste de retour Android reviennent à l'écran précédent.
  useEffect(() => {
    if (retourEnCours.current) {
      retourEnCours.current = false;
      return;
    }
    const nav = instantane(etat);
    const courant = window.history.state?.nav;
    // Chaque question de l'assistant de besoin est une entrée : « Précédent » revient à la question d'avant.
    if (courant?.screen === nav.screen && courant?.onglet === nav.onglet && courant?.besoinEtape === nav.besoinEtape) return;
    window.history.pushState({ nav }, "");
    // Seuls les champs de navigation déclenchent un empilement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat.screen, etat.onglet, etat.assistStep, etat.contratStep, etat.besoinEtape]);

  useEffect(() => {
    const surRetour = (ev: PopStateEvent) => {
      const nav = ev.state?.nav as Navigation | undefined;
      if (!nav) return;
      retourEnCours.current = true;
      setEtat((e) => ({ ...e, ...nav, deptsOpen: false }));
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", surRetour);
    return () => window.removeEventListener("popstate", surRetour);
  }, []);

  const exigerCompte = useCallback<Contexte["exigerCompte"]>(
    (action) => {
      if (etat.auth) {
        action();
        return;
      }
      enAttente.current = action;
      setEtat((e) => ({ ...e, authOpen: true, authStep: "tel", telDraft: "", code: "" }));
    },
    [etat.auth],
  );

  // Feuille de connexion refermée sans se connecter : l'action interrompue est abandonnée,
  // pour ne pas la rejouer plus tard lors d'une connexion faite pour autre chose.
  useEffect(() => {
    if (!etat.authOpen && !etat.auth) enAttente.current = null;
  }, [etat.authOpen, etat.auth]);

  // Une session mémorisée est reprise au chargement ; un jeton refusé est oublié par le client API.
  useEffect(() => {
    if (!jeton.lire()) return;
    api
      .moi()
      .then((u) => {
        if (u.profil_complet) setEtat((e) => ({ ...e, auth: versCompte(u) }));
      })
      .catch(() => {});
  }, []);

  const rechercher = useCallback<Contexte["rechercher"]>(
    (titre, filtre) => {
      const texte = (titre ?? etat.query).trim();
      // Historique : sur l'appareil, et au serveur (relié au compte s'il y en a un).
      enregistrerRecherche(texte, filtre?.categorie ?? null, etat.ville === null ? CONFIG.villeParDefaut : VILLES[etat.ville]);
      go("results", {
        titre: texte || "Tous les prestataires",
        filtre: filtre ?? (texte ? { q: texte } : {}),
        quartier: 0,
        carte: false,
      });
    },
    [go, etat.query, etat.ville],
  );

  const ouvrirChat = useCallback<Contexte["ouvrirChat"]>(
    (p) => {
      exigerCompte(() =>
        go("chat", {
          active: p,
          messages: [
            { moi: true, texte: "Bonjour, ma douche fuit depuis hier à Habitat." },
            {
              moi: false,
              texte: "Bonjour ! Je peux passer ce soir vers 17h. La réparation, c'est 12 000 F avec le joint.",
            },
            { moi: true, texte: "D'accord, je vous envoie une photo." },
          ],
        }),
      );
    },
    [exigerCompte, go],
  );

  const envoyerMessage = useCallback<Contexte["envoyerMessage"]>((texte) => {
    if (!texte || !texte.trim()) return;
    setEtat((e) => ({ ...e, messages: [...e.messages, { moi: true, texte: texte.trim() }], draft: "" }));
    window.setTimeout(() => {
      setEtat((e) => ({
        ...e,
        messages: [...e.messages, { moi: false, texte: "Bien reçu, je vous confirme dans un instant." }],
      }));
    }, 700);
  }, []);

  const poserSujetMaison = useCallback<Contexte["poserSujetMaison"]>(
    (patch) => {
      go("projDash", { sujet: sujetMaison(), ...(patch ?? {}) });
    },
    [go],
  );

  const poserSujetAchat = useCallback<Contexte["poserSujetAchat"]>(
    (patch) => {
      go("projSuivi", { sujet: sujetAchat(), ...(patch ?? {}) });
    },
    [go],
  );

  const demarrerBesoin = useCallback<Contexte["demarrerBesoin"]>(
    (patch) => {
      const besoin = { ...besoinVide(), ...(patch ?? {}) };
      go("besoin", { besoin, besoinEtape: besoin.secteur ? 1 : 0 });
    },
    [go],
  );

  const modifierBesoin = useCallback<Contexte["modifierBesoin"]>((patch) => {
    setEtat((e) => ({ ...e, besoin: { ...e.besoin, ...patch } }));
  }, []);

  const terminerAuth = useCallback<Contexte["terminerAuth"]>((utilisateur) => {
    setEtat((e) => ({ ...e, auth: versCompte(utilisateur), authOpen: false, code: "" }));
    // L'action interrompue reprend une fois la feuille refermée.
    const action = enAttente.current;
    enAttente.current = null;
    if (action) window.setTimeout(action, 60);
  }, []);

  const deconnecter = useCallback<Contexte["deconnecter"]>(() => {
    // La session locale tombe tout de suite, même si le serveur ne répond pas.
    api
      .deconnexion()
      .catch(() => {})
      .finally(() => jeton.effacer());
    setEtat((e) => ({ ...e, auth: null }));
  }, []);

  const villeIdx = etat.ville === null ? Math.max(0, VILLES.indexOf(CONFIG.villeParDefaut)) : etat.ville;
  // La carte (localisation) est réservée aux clients inscrits : un visiteur reste en liste.
  const voirCarte = CONFIG.carteResultats && !!etat.auth && (etat.carte === null ? CONFIG.vueResultats === "Carte" : etat.carte);

  const valeur = useMemo<Contexte>(
    () => ({
      etat,
      set,
      go,
      exigerCompte,
      rechercher,
      ouvrirChat,
      envoyerMessage,
      terminerAuth,
      deconnecter,
      ville: VILLES[villeIdx],
      villeIdx,
      voirCarte,
      poserSujetMaison,
      poserSujetAchat,
      demarrerBesoin,
      modifierBesoin,
    }),
    [
      demarrerBesoin,
      modifierBesoin,
      etat,
      set,
      go,
      exigerCompte,
      rechercher,
      ouvrirChat,
      envoyerMessage,
      terminerAuth,
      deconnecter,
      villeIdx,
      voirCarte,
      poserSujetMaison,
      poserSujetAchat,
    ],
  );

  return <AppContext.Provider value={valeur}>{children}</AppContext.Provider>;
}

export function useApp(): Contexte {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp doit être utilisé dans <AppProvider>");
  return ctx;
}

export { ETAT_INITIAL, type Sujet };
