/* Le suivi avancé porte deux parcours, distingués par le type du sujet :
   « etape » — un projet de construction découpé en étapes ;
   « achat » — une commande simple, du questionnaire à la réception. */

export type Sujet = {
  type: "etape" | "achat";
  ref: string;
  titre: string;
  montant: string;
  checklist: string;
  preuves: string[];
  remise: string;
  questTitre: string;
};

export function sujetMaison(): Sujet {
  return {
    type: "etape",
    ref: "Étape 3 · Fondation & gros œuvre",
    titre: "Construction maison · Habitat",
    montant: "1 200 000 F",
    checklist: "fouilles conformes au plan · béton dosé 350 · ferraillage · niveau",
    preuves: ["6 photos du chantier", "Vidéo 30 s", "Rapport de l'agent"],
    remise: "Réception de l'étape sur le chantier",
    questTitre: "Votre projet : construction d'une maison",
  };
}

export function sujetAchat(): Sujet {
  return {
    type: "achat",
    ref: "Commande #A-2841 · Ordinateur 16 Go",
    titre: "Ordinateur 16 Go",
    montant: "340 000 F",
    checklist: "modèle · 16 Go · état neuf · n° de série",
    preuves: ["3 photos", "Vidéo 20 s", "Facture scannée"],
    remise: "Livraison Abidjan vers Yamoussoukro",
    questTitre: "Votre besoin : ordinateur",
  };
}

export type EtatEtape = "fait" | "encours" | "bloque";

export const ETAPES_PROJET: Array<{ n: number; nom: string; etat: EtatEtape; info: string }> = [
  { n: 1, nom: "Terrain & documents", etat: "fait", info: "Terminé · ACD vérifié par l'agent" },
  { n: 2, nom: "Plan & devis architecte", etat: "fait", info: "Terminé · 3 offres reçues, 1 validée" },
  {
    n: 3,
    nom: "Fondation & gros œuvre",
    etat: "encours",
    info: "Action attendue : valider une des 3 offres de maçonnerie.",
  },
  { n: 4, nom: "Élévation des murs", etat: "bloque", info: "S'ouvre après l'étape 3" },
  { n: 5, nom: "Toiture", etat: "bloque", info: "S'ouvre après l'étape 4" },
  { n: 6, nom: "Plomberie & électricité", etat: "bloque", info: "S'ouvre après l'étape 5" },
  { n: 7, nom: "Finitions & peinture", etat: "bloque", info: "S'ouvre après l'étape 6" },
  { n: 8, nom: "Réception du chantier", etat: "bloque", info: "Vérification finale par l'agent" },
];

export type Offre = {
  ini: string;
  nom: string;
  note: string;
  chantiers: number;
  prix: string;
  delai: string;
  tags: string[];
  top: boolean;
};

export const OFFRES_ETAPE: Offre[] = [
  {
    ini: "EB",
    nom: "Ent. Bakayoko",
    note: "4,8",
    chantiers: 34,
    prix: "1 200 000 F",
    delai: "6 semaines",
    tags: ["Matériaux inclus", "Garantie 1 an"],
    top: true,
  },
  {
    ini: "KM",
    nom: "Kone Maçonnerie",
    note: "4,5",
    chantiers: 18,
    prix: "980 000 F",
    delai: "9 semaines",
    tags: ["Matériaux non inclus"],
    top: false,
  },
  {
    ini: "SD",
    nom: "Sidibé & Fils",
    note: "4,3",
    chantiers: 11,
    prix: "1 050 000 F",
    delai: "7 semaines",
    tags: ["Matériaux inclus"],
    top: false,
  },
];

export const OFFRES_ACHAT: Offre[] = [
  {
    ini: "TI",
    nom: "Tech Ivoire · Lenovo 16 Go",
    note: "4,8",
    chantiers: 210,
    prix: "340 000 F",
    delai: "Livré en 2 jours",
    tags: ["Neuf scellé", "Garantie 1 an"],
    top: true,
  },
  {
    ini: "CY",
    nom: "CyberShop · HP 16 Go",
    note: "4,5",
    chantiers: 96,
    prix: "315 000 F",
    delai: "Livré en 4 jours",
    tags: ["Reconditionné A"],
    top: false,
  },
  {
    ini: "AB",
    nom: "Abidjan Info · Dell 16 Go",
    note: "4,3",
    chantiers: 58,
    prix: "368 000 F",
    delai: "Dispo en boutique",
    tags: ["Neuf", "SSD 512 Go"],
    top: false,
  },
];

export const FILTRES_OFFRES = ["Prix", "Délai", "Note", "Vérifiés"];

/** Étapes du séquestre, de la validation de l'offre à la confirmation de réception. */
export function etapesSequestre(sujet: Sujet) {
  const maison = sujet.type === "etape";
  return [
    {
      n: "check",
      nom: maison ? "Offre validée" : "Commande validée",
      info: "Hier 14:20 · caractéristiques confirmées",
      etat: "fait" as EtatEtape,
    },
    {
      n: "check",
      nom: "Paiement bloqué en séquestre",
      info: "Hier 14:22 · payé depuis Wave",
      etat: "fait" as EtatEtape,
    },
    {
      n: "3",
      nom: "Vérification par l'agent",
      info: maison ? "Aujourd'hui · agent Traoré sur le chantier" : "Aujourd'hui · agent Traoré à Adjamé",
      etat: "encours" as EtatEtape,
    },
    { n: "4", nom: sujet.remise, info: maison ? "Prévue en fin de semaine" : "Prévue demain", etat: "bloque" as EtatEtape },
    { n: "5", nom: "Votre confirmation de réception", info: "Débloque le paiement", etat: "bloque" as EtatEtape },
  ];
}

/** Questionnaire court, différent selon la sous-catégorie. */
export function questionsSujet(sujet: Sujet) {
  return sujet.type === "etape"
    ? [
        { titre: "Quel type de maison ?", choix: ["2 pièces", "3 pièces", "Duplex", "Villa"], sel: 1 },
        { titre: "Où en êtes-vous ?", choix: ["Pas de terrain", "Terrain acheté", "Fondation faite"], sel: 1 },
      ]
    : [
        { titre: "Quel usage prévoyez-vous ?", choix: ["Bureautique", "Graphisme", "Jeux", "Développement"], sel: 0 },
        { titre: "Mémoire souhaitée", choix: ["8 Go", "16 Go", "32 Go"], sel: 1 },
      ];
}

export const FILTRES_PROJET = [
  "Tous",
  "Brouillon",
  "Recherche de devis",
  "Devis reçus",
  "En attente de choix",
  "Travaux en cours",
  "Terminé",
  "Garantie / SAV",
];

export type TonStatut = "brand" | "success" | "warning" | "info" | "neutral";

export const MES_PROJETS: Array<{
  titre: string;
  ref: string;
  budget: string;
  delai: string;
  statut: string;
  devis: string;
  ton: TonStatut;
}> = [
  {
    titre: "Villa R+1 — Habitat, Yamoussoukro",
    ref: "PROJ-2026-00458",
    budget: "40 000 000 F",
    delai: "7 mois",
    statut: "Devis reçus",
    devis: "3 devis reçus",
    ton: "brand",
  },
  {
    titre: "Rénovation cuisine — Kokrenou",
    ref: "PROJ-2026-00431",
    budget: "3 500 000 F",
    delai: "6 semaines",
    statut: "Travaux en cours",
    devis: "Étape 3 sur 6",
    ton: "success",
  },
  {
    titre: "Extension garage — Assabou",
    ref: "PROJ-2026-00412",
    budget: "8 000 000 F",
    delai: "3 mois",
    statut: "Recherche de devis",
    devis: "Publié il y a 2 jours",
    ton: "neutral",
  },
  {
    titre: "Clôture et portail — Dioulakro",
    ref: "PROJ-2026-00390",
    budget: "2 200 000 F",
    delai: "1 mois",
    statut: "En attente de choix",
    devis: "5 devis à comparer",
    ton: "warning",
  },
  {
    titre: "Aménagement bureau — Centre-ville",
    ref: "PROJ-2026-00355",
    budget: "6 800 000 F",
    delai: "2 mois",
    statut: "Terminé",
    devis: "Réceptionné le 4 juillet",
    ton: "success",
  },
  {
    titre: "Duplex familial — Millionnaire",
    ref: "—",
    budget: "Budget à préciser",
    delai: "Délai à préciser",
    statut: "Brouillon",
    devis: "Étape 3 sur 7 · non publié",
    ton: "neutral",
  },
  {
    titre: "Villa jumelée — N'Zuessy",
    ref: "PROJ-2025-00288",
    budget: "31 000 000 F",
    delai: "Livré",
    statut: "Garantie / SAV",
    devis: "Garantie active jusqu'au 12 mars 2027",
    ton: "info",
  },
];
