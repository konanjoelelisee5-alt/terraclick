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
  /** Présent seulement pour un utilisateur connecté. */
  telephone?: string;
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
  quartier: Quartier | null;
  profil_complet: boolean;
};

export type Page<T> = { data: T[]; meta: { total: number; current_page: number; last_page: number } };

export type CriteresRecherche = {
  q?: string;
  categorie?: string;
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

type Options = { methode?: "GET" | "POST" | "PATCH"; corps?: unknown; signal?: AbortSignal };

async function requete<T>(chemin: string, { methode = "GET", corps, signal }: Options = {}): Promise<T> {
  const entetes: Record<string, string> = { Accept: "application/json" };
  if (corps !== undefined) entetes["Content-Type"] = "application/json";
  const j = jeton.lire();
  if (j) entetes.Authorization = `Bearer ${j}`;

  let reponse: Response;
  try {
    reponse = await fetch(BASE + chemin, {
      method: methode,
      headers: entetes,
      body: corps === undefined ? undefined : JSON.stringify(corps),
      signal,
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new ErreurApi("Impossible de joindre Servis Yakro. Vérifiez votre connexion.", 0);
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
    requete<Page<PrestataireApi>>(`/prestataires${parametres(criteres)}`, { signal }),
  vedettes: (signal?: AbortSignal) =>
    requete<{ data: PrestataireApi[] }>("/prestataires/vedettes", { signal }).then((r) => r.data),
  fiche: (id: number, signal?: AbortSignal) =>
    requete<{ data: FicheApi }>(`/prestataires/${id}`, { signal }).then((r) => r.data),
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
  moi: () => requete<{ data: Utilisateur }>("/moi").then((r) => r.data),
  modifierProfil: (profil: { nom?: string; quartier_id?: number | null }) =>
    requete<{ data: Utilisateur }>("/moi", { methode: "PATCH", corps: profil }).then((r) => r.data),
  deconnexion: () => requete<{ message: string }>("/auth/deconnexion", { methode: "POST" }),
};
