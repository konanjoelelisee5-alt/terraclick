/* Client de l'API Laravel (backend/). Les types reprennent les ressources JSON
   de backend/app/Http/Resources ; les noms de champs restent ceux de l'API. */

const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const CLE_JETON = "sy.jeton";

/* ---------- Types renvoyés par l'API ---------- */

export type Position = { lat: number; lng: number };

export type Quartier = { id: number; nom: string; slug: string; ville?: string };

export type Ville = { id: number; nom: string; slug: string; position: Position | null; quartiers: Quartier[] };

export type Categorie = { id: number; nom: string; slug: string };

export type Departement = {
  id: number;
  nom: string;
  slug: string;
  icone: string;
  apercu: string | null;
  nombre_prestataires: number;
  rubriques: { id: number; nom: string; slug: string; categories: Categorie[] }[];
};

export type PrestataireApi = {
  id: number;
  nom: string;
  initiales: string;
  metier: string;
  description: string | null;
  note: number;
  nombre_avis: number;
  prix: { min: number | null; max: number | null; affichage: string | null };
  delai_reponse: { minutes: number | null; affichage: string | null };
  quartier?: Quartier | null;
  position: Position | null;
  distance_km?: number;
  categories?: string[];
  verifie?: boolean;
  accepte_suivi: boolean;
  en_vedette: boolean;
};

export type AvisApi = {
  id: number;
  auteur: { nom: string; initiales: string };
  notes: { ponctualite: number; qualite: number; prix: number };
  note: number;
  commentaire: string | null;
  date: string;
  date_affichage: string;
};

export type FicheApi = PrestataireApi & {
  zone_intervention: string | null;
  experience: { depuis: number; annees: number } | null;
  joignable_par_telephone: boolean;
  /** Visible par tous : un visiteur peut appeler un technicien. */
  telephone: string | null;
  prestations: string[];
  tarifs: { libelle: string; montant: number | null; a_partir_de?: boolean; affichage: string | null }[];
  horaires: { jours: string; ouverture: string | null; fermeture: string | null }[];
  garanties: string[];
  documents: { type: string; libelle: string; statut: "en_attente" | "verifie" | "refuse" }[];
  realisations: { id: number; legende: string; image: string | null }[];
  avis_recents: AvisApi[];
};

export type Utilisateur = {
  id: number;
  telephone: string;
  telephone_affichage: string;
  nom: string | null;
  email: string | null;
  /** Photo de profil (data URL), ou null. */
  photo: string | null;
  ville: { id: number; nom: string } | null;
  quartier: Quartier | null;
  profil_complet: boolean;
  /** Faux pour un compte créé par code seul : il se donne un mot de passe par « Mot de passe oublié ». */
  a_mot_de_passe: boolean;
};

/** Session ouverte par l'API : le jeton à garder et le compte. */
export type Session = { token: string; utilisateur: Utilisateur };

/** Un onglet : relation aboutie avec un technicien, confirmée par le client (GET /api/accords). */
export type AccordApi = {
  id: number;
  reference: string;
  objet: string;
  recherche: string | null;
  canal: "appel" | "whatsapp" | "message" | "demande";
  canal_libelle: string;
  montant: number | null;
  montant_affichage: string | null;
  date_intervention: string | null;
  statut: "conclu" | "termine";
  statut_libelle: string;
  prestation: { slug: string; nom: string; secteur: string } | null;
  prestataire: { id: number; nom: string; initiales: string; metier: string; telephone: string | null; quartier: string | null; categorie: string | null };
  demande_reference: string | null;
  etapes: { libelle: string; date: string }[];
  cree_le: string;
};

/** Une recherche de l'historique (POST /api/recherches, GET /api/moi/recherches). */
export type RechercheApi = {
  id: number;
  texte: string;
  categorie: string | null;
  secteur: string | null;
  ville: string | null;
  appareil_id: string | null;
  appareil: string | null;
  date: string;
};

/** Élément du fil d'actualité de l'accueil (GET /api/actualites). */
export type ActualiteApi = {
  id: string;
  type: "nouveau" | "avis" | "realisation";
  titre: string;
  texte: string | null;
  note: number | null;
  date: string;
  /** « 8 h », « 3 j » : prêt à afficher. */
  date_relative: string;
  prestataire: { id: number; nom: string; metier: string; initiales: string; quartier: string | null; categorie: string | null };
};

export type Page<T> = { data: T[]; meta: { total: number; current_page: number; last_page: number } };

/** Un service ouvert et ses problèmes types (première question de l'assistant). */
export type SecteurApi = { cle: string; nom: string; problemes: string[] };

/** Ce que la barre de recherche a compris d'une saisie libre. */
export type Analyse = { secteurs: { cle: string; nom: string }[]; probleme: string | null };

export type DemandeApi = {
  id: number;
  reference: string;
  secteur: { cle: string; nom: string };
  probleme: string;
  precision: string | null;
  quartier: Quartier | null;
  repere: string | null;
  quand: "maintenant" | "aujourdhui" | "demain" | "date";
  date_souhaitee: string | null;
  /** « Plomberie · Fuite d'eau · Habitat · Maintenant » */
  resume: string;
  mode: "recommande" | "choisi";
  prestataire: PrestataireApi | null;
  paiement: "especes" | "mobile_money";
  photos: string[];
  /** Pack pressing : articles, pièces et total estimé (prix indicatifs du catalogue). */
  pack: { articles: { cle: string; nom: string; quantite: number; prix_unitaire: number; total: number }[]; pieces: number; total: number; total_affichage: string } | null;
  statut: StatutDemande;
  /** « Envoyée », « Marquée terminée »… */
  statut_libelle: string;
  /** Réponse du technicien quand il accepte. */
  estimation: number | null;
  creneau: string | null;
  /** Journal de suivi (présent sur le détail d'une demande). */
  evenements?: { statut: StatutDemande; libelle: string; auteur: "client" | "technicien" | "systeme"; message: string | null; date: string }[];
  cree_le: string;
};

/** Article du pack pressing et son prix indicatif par pièce. */
export type ArticlePressing = { cle: string; nom: string; prix: number; prix_affichage: string; categorie: string; categorie_nom: string };

export type StatutDemande = "envoyee" | "acceptee" | "refusee" | "en_cours" | "terminee" | "confirmee" | "annulee";

/** Résultats de recherche, avec les secteurs que le serveur a reconnus dans la demande. */
/** Une prestation du catalogue et son prix (indicatif, ou celui du technicien). */
export type PrestationApi = { slug: string; nom: string; prix: { min: number | null; max: number | null; affichage: string | null } };

export type Resultats = Page<PrestataireApi & { prestation?: PrestationApi | null }> & {
  analyse?: {
    secteurs: string[];
    /** Secteur en jeu (recherche, prestation ou catégorie choisie). */
    secteur?: { cle: string; nom: string; categorie: string } | null;
    /** Prestation reconnue dans la recherche (« tuyau cassé ») ou choisie en onglet. */
    prestation?: PrestationApi | null;
    /** Prestations du secteur en jeu, proposées en onglets. */
    prestations?: PrestationApi[];
  };
};

export type CriteresRecherche = {
  q?: string;
  categorie?: string;
  /** Slug d'une prestation : techniciens qui la proposent, avec leur prix pour elle. */
  prestation?: string;
  departement?: string;
  ville?: string;
  quartier?: number;
  lat?: number;
  lng?: number;
  rayon_km?: number;
  tri?: "pertinence" | "note" | "avis" | "distance" | "reponse";
  par_page?: number;
};

/* ---------- Erreurs ---------- */

export class ErreurApi extends Error {
  constructor(
    message: string,
    public statut: number,
    /** Erreurs de validation par champ, telles que Laravel les renvoie. */
    public champs: Record<string, string[]> = {},
  ) {
    super(message);
  }

  /** Premier message d'un champ, sinon le message général. */
  pour(champ: string): string {
    return this.champs[champ]?.[0] ?? this.message;
  }
}

export function messageErreur(e: unknown): string {
  return e instanceof ErreurApi ? e.message : "Une erreur inattendue est survenue.";
}

/* ---------- Jeton de session ---------- */

// Le stockage peut être indisponible (navigation privée) : l'application fonctionne
// alors sans mémoriser la session.
export const jeton = {
  lire(): string | null {
    try {
      return localStorage.getItem(CLE_JETON);
    } catch {
      return null;
    }
  },
  ecrire(valeur: string) {
    try {
      localStorage.setItem(CLE_JETON, valeur);
    } catch {
      /* session limitée à l'onglet */
    }
  },
  effacer() {
    try {
      localStorage.removeItem(CLE_JETON);
    } catch {
      /* rien à effacer */
    }
  },
};

/* ---------- Requêtes ---------- */

type Options = { methode?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; corps?: unknown; signal?: AbortSignal };

async function requete<T>(chemin: string, { methode = "GET", corps, signal }: Options = {}): Promise<T> {
  const entetes: Record<string, string> = { Accept: "application/json" };
  // Un FormData (photos jointes) fixe lui-même son type multipart et sa frontière.
  const multipart = corps instanceof FormData;
  if (corps !== undefined && !multipart) entetes["Content-Type"] = "application/json";
  const j = jeton.lire();
  if (j) entetes.Authorization = `Bearer ${j}`;

  let reponse: Response;
  try {
    reponse = await fetch(BASE + chemin, {
      method: methode,
      headers: entetes,
      body: corps === undefined ? undefined : multipart ? corps : JSON.stringify(corps),
      signal,
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new ErreurApi("Impossible de joindre TerraClick. Vérifiez votre connexion.", 0);
  }

  const contenu = await reponse.json().catch(() => null);

  if (!reponse.ok) {
    // Jeton expiré ou révoqué : on l'oublie, la prochaine action redemandera un code.
    if (reponse.status === 401) jeton.effacer();
    const message =
      contenu?.message && reponse.status < 500 ? contenu.message : "Le service est momentanément indisponible.";
    throw new ErreurApi(message, reponse.status, contenu?.errors ?? {});
  }

  return contenu as T;
}

function parametres(criteres: CriteresRecherche): string {
  const p = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(criteres)) {
    if (valeur !== undefined && valeur !== null && valeur !== "") p.set(cle, String(valeur));
  }
  const texte = p.toString();
  return texte ? `?${texte}` : "";
}

/* Les référentiels changent rarement : une seule requête par session. */
const memoire = new Map<string, Promise<unknown>>();
function memoriser<T>(cle: string, charger: () => Promise<T>): Promise<T> {
  if (!memoire.has(cle)) {
    memoire.set(
      cle,
      charger().catch((e) => {
        memoire.delete(cle);
        throw e;
      }),
    );
  }
  return memoire.get(cle) as Promise<T>;
}

export const api = {
  /* Annuaire */
  villes: () => memoriser("villes", () => requete<{ data: Ville[] }>("/villes").then((r) => r.data)),
  departements: () =>
    memoriser("departements", () => requete<{ data: Departement[] }>("/departements").then((r) => r.data)),
  rechercher: (criteres: CriteresRecherche, signal?: AbortSignal) =>
    requete<Resultats>(`/prestataires${parametres(criteres)}`, { signal }),
  vedettes: (signal?: AbortSignal) =>
    requete<{ data: PrestataireApi[] }>("/prestataires/vedettes", { signal }).then((r) => r.data),
  accords: (signal?: AbortSignal) => requete<{ data: AccordApi[] }>("/accords", { signal }).then((r) => r.data),
  accord: (id: number, signal?: AbortSignal) => requete<{ data: AccordApi }>(`/accords/${id}`, { signal }).then((r) => r.data),
  creerAccord: (accord: {
    prestataire_id: number;
    canal: AccordApi["canal"];
    prestation?: string | null;
    objet?: string | null;
    recherche?: string | null;
    montant?: number | null;
    date_intervention?: string | null;
  }) => requete<{ data: AccordApi }>("/accords", { methode: "POST", corps: accord }).then((r) => r.data),
  terminerAccord: (id: number) => requete<{ data: AccordApi }>(`/accords/${id}/terminer`, { methode: "POST" }).then((r) => r.data),
  enregistrerRecherche: (recherche: { texte: string; categorie?: string | null; ville?: string | null; appareil_id: string; appareil: string }) =>
    requete<{ data: RechercheApi }>("/recherches", { methode: "POST", corps: recherche }).then((r) => r.data),
  mesRecherches: (signal?: AbortSignal) => requete<{ data: RechercheApi[] }>("/moi/recherches", { signal }).then((r) => r.data),
  effacerRecherches: () => requete<{ message: string }>("/moi/recherches", { methode: "DELETE" }),
  actualites: (page: number, signal?: AbortSignal) =>
    requete<{ data: ActualiteApi[]; meta: { page: number; suivante: number | null } }>(`/actualites?page=${page}`, { signal }),
  fiche: (id: number, signal?: AbortSignal) =>
    requete<{ data: FicheApi }>(`/prestataires/${id}`, { signal }).then((r) => r.data),
  /* Assistant de besoin et demandes */
  secteurs: () => memoriser("secteurs", () => requete<{ data: SecteurApi[] }>("/secteurs").then((r) => r.data)),
  analyser: (q: string) => requete<Analyse>(`/analyse?${new URLSearchParams({ q })}`),
  recommandations: (criteres: { secteur: string; quartier?: number | null; exclure?: number[] }, signal?: AbortSignal) => {
    const p = new URLSearchParams({ secteur: criteres.secteur });
    if (criteres.quartier) p.set("quartier", String(criteres.quartier));
    criteres.exclure?.forEach((id) => p.append("exclure[]", String(id)));
    return requete<{ data: PrestataireApi[] }>(`/recommandations?${p}`, { signal }).then((r) => r.data);
  },
  creerDemande: (formulaire: FormData) =>
    requete<{ data: DemandeApi; message: string }>("/demandes", { methode: "POST", corps: formulaire }),
  articlesPressing: () =>
    requete<{ data: ArticlePressing[] }>("/pressing/articles").then((r) => r.data),
  mesDemandes: (signal?: AbortSignal) => requete<Page<DemandeApi>>("/demandes?par_page=100", { signal }).then((r) => r.data),
  demande: (id: number, signal?: AbortSignal) => requete<{ data: DemandeApi }>(`/demandes/${id}`, { signal }).then((r) => r.data),
  annulerDemande: (id: number, motif: string | null) =>
    requete<{ data: DemandeApi }>(`/demandes/${id}/annuler`, { methode: "POST", corps: { motif } }).then((r) => r.data),
  confirmerDemande: (id: number) => requete<{ data: DemandeApi }>(`/demandes/${id}/confirmer`, { methode: "POST" }).then((r) => r.data),

  publierAvis: (id: number, avis: { ponctualite: number; qualite: number; prix: number; commentaire?: string }) =>
    requete<{ data: AvisApi }>(`/prestataires/${id}/avis`, { methode: "POST", corps: avis }).then((r) => r.data),

  /* Compte */
  demanderCode: (telephone: string, canal: "sms" | "whatsapp") =>
    requete<{
      message: string;
      /** Canal réellement utilisé : SMS si WhatsApp n'a pas pu être joint. */
      canal: "sms" | "whatsapp";
      repli: boolean;
      expire_dans_secondes: number;
    }>("/auth/code", {
      methode: "POST",
      corps: { telephone, canal },
    }),
  verifierCode: (telephone: string, code: string) =>
    requete<{ token: string; nouveau_compte: boolean; utilisateur: Utilisateur }>("/auth/verifier", {
      methode: "POST",
      corps: { telephone, code, appareil: navigator.userAgent.slice(0, 100) },
    }),
  inscrire: (compte: {
    telephone: string;
    /** Seulement si la vérification du numéro est activée. */
    code?: string;
    nom: string;
    email: string | null;
    ville_id: number | null;
    quartier_id: number | null;
    mot_de_passe: string;
    mot_de_passe_confirmation: string;
  }) =>
    requete<Session>("/auth/inscription", {
      methode: "POST",
      corps: { ...compte, appareil: navigator.userAgent.slice(0, 100) },
    }),
  connecter: (telephone: string, mot_de_passe: string) =>
    requete<Session>("/auth/connexion", {
      methode: "POST",
      corps: { telephone, mot_de_passe, appareil: navigator.userAgent.slice(0, 100) },
    }),
  reinitialiserMotDePasse: (telephone: string, code: string, mot_de_passe: string, mot_de_passe_confirmation: string) =>
    requete<Session>("/auth/mot-de-passe", {
      methode: "POST",
      corps: { telephone, code, mot_de_passe, mot_de_passe_confirmation, appareil: navigator.userAgent.slice(0, 100) },
    }),
  moi: () => requete<{ data: Utilisateur }>("/moi").then((r) => r.data),
  modifierProfil: (profil: {
    nom?: string;
    email?: string | null;
    ville_id?: number | null;
    quartier_id?: number | null;
  }) =>
    requete<{ data: Utilisateur }>("/moi", { methode: "PATCH", corps: profil }).then((r) => r.data),
  modifierPhoto: (photo: string) =>
    requete<{ data: Utilisateur }>("/moi/photo", { methode: "PUT", corps: { photo } }).then((r) => r.data),
  supprimerPhoto: () => requete<{ data: Utilisateur }>("/moi/photo", { methode: "DELETE" }).then((r) => r.data),
  deconnexion: () => requete<{ message: string }>("/auth/deconnexion", { methode: "POST" }),
};
