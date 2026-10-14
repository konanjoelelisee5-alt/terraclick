/* Espace prestataire : données de démonstration reprises de la maquette
   servis-yakro-app, adaptées au prestataire Koffi Tanoh de la base de démo.
   Rien n'est encore relié à l'API : ces écrans montrent les interfaces. */

export const PRO = {
  nom: "Koffi Tanoh",
  initiales: "KT",
  metier: "Plombier",
  quartier: "Habitat",
  telephone: "07 58 42 19 03",
  description: "Fuites, chauffe-eau, installation sanitaire. Déplacement dans tout Yakro.",
  plan: "Standard",
  expiration: "30 avril 2026",
};

/** Correspondance statut → classe de badge du design system. */
export type Ton = "brand" | "neutral" | "info" | "success" | "warning" | "danger";

export type Controle = { libelle: string; ok: boolean };

export const CONTROLES_OBLIGATOIRES: Controle[] = [
  { libelle: "Nom de l'activité", ok: true },
  { libelle: "Téléphone vérifiable", ok: true },
  { libelle: "Au moins un service", ok: true },
  { libelle: "Au moins un quartier d'intervention", ok: true },
];

export const CONTROLES_RECOMMANDES: Controle[] = [
  { libelle: "Description de l'activité", ok: true },
  { libelle: "Photo ou logo", ok: false },
  { libelle: "Réalisations", ok: true },
  { libelle: "Prix indicatif", ok: true },
  { libelle: "Années d'expérience", ok: false },
];

export const STATS = [
  { icone: "inbox", libelle: "Nouvelles demandes", valeur: "3", aide: "depuis hier", fond: "var(--kola-100)", encre: "var(--kola-700)" },
  { icone: "reply", libelle: "À répondre", valeur: "2", aide: "sous 2 h", fond: "var(--kola-100)", encre: "var(--kola-700)" },
  { icone: "calendar-check", libelle: "Rendez-vous", valeur: "1", aide: "14 avril", fond: "var(--state-success-soft)", encre: "var(--lagune-700)" },
  { icone: "clipboard-check", libelle: "À confirmer", valeur: "1", aide: "hier", fond: "var(--state-warning-soft)", encre: "var(--state-warning)" },
  { icone: "star", libelle: "Note moyenne", valeur: "4,8", aide: "63 avis", fond: "var(--argile-100)", encre: "var(--argile-700)" },
  { icone: "receipt", libelle: "Facture à payer", valeur: "1", aide: "18 avril", fond: "var(--state-warning-soft)", encre: "var(--state-warning)" },
];

export type Demande = {
  ref: string;
  client: string;
  categorie: string;
  quartier: string;
  date: string;
  besoin: string;
  statut: string;
  groupe: string;
  ton: Ton;
};

export const FILTRES_DEMANDES = ["Toutes", "Nouvelles", "Vues", "Répondues", "Acceptées", "À confirmer", "Terminées"];

export const DEMANDES: Demande[] = [
  { ref: "DEV-2026-00128", client: "Awa", categorie: "Plomberie", quartier: "Habitat", date: "mardi 14 avril", besoin: "Fuite sous l'évier de la cuisine depuis hier soir.", statut: "Nouvelle", groupe: "Nouvelles", ton: "brand" },
  { ref: "DEV-2026-00126", client: "Serge", categorie: "Plomberie", quartier: "Kokrenou", date: "mercredi 15 avril", besoin: "Remplacer un chauffe-eau de 50 litres.", statut: "Vue", groupe: "Vues", ton: "neutral" },
  { ref: "DEV-2026-00124", client: "Mariam", categorie: "Plomberie", quartier: "Millionnaire", date: "jeudi 16 avril", besoin: "Installer deux robinets dans une cour commune.", statut: "Répondue", groupe: "Répondues", ton: "info" },
  { ref: "DEV-2026-00121", client: "Yao", categorie: "Plomberie", quartier: "Assabou", date: "lundi 13 avril", besoin: "Débouchage de canalisation dans une boutique.", statut: "Rendez-vous accepté", groupe: "Acceptées", ton: "success" },
  { ref: "DEV-2026-00118", client: "Fatou", categorie: "Plomberie", quartier: "Morofe", date: "samedi 11 avril", besoin: "Recherche de fuite dans la salle de bain.", statut: "À confirmer", groupe: "À confirmer", ton: "warning" },
  { ref: "DEV-2026-00112", client: "Ibrahim", categorie: "Plomberie", quartier: "Centre-ville", date: "jeudi 9 avril", besoin: "Remplacement de siphon.", statut: "Terminée", groupe: "Terminées", ton: "neutral" },
];

/** Détail ouvert depuis la boîte de réception (une seule demande détaillée en démonstration). */
export const DEMANDE_DETAIL = {
  ...DEMANDES[0],
  description: "Fuite sous l'évier de la cuisine depuis hier soir. L'eau coule dès qu'on ouvre le robinet.",
  souhait: "mardi 14 avril",
  budget: "25 000 F",
  contact: "appel",
  photos: ["Photo 1", "Photo 2"],
};

export const SERVICES = ["Plomberie", "Électricité", "Carrelage", "Peinture", "Climatisation", "Menuiserie", "Maçonnerie", "Ménage"];
export const SERVICES_ACTIFS = ["Plomberie"];

export const QUARTIERS_YAKRO = ["Habitat", "Kokrenou", "Millionnaire", "Dioulakro", "N'Zuessy", "Morofe", "Assabou", "Centre-ville", "Kpangbassou"];
export const ZONES_ACTIVES = ["Habitat", "Dioulakro", "Centre-ville"];

export type Realisation = { legende: string; date: string };
export const REALISATIONS_MAX = 5;
export const REALISATIONS: Realisation[] = [
  { legende: "Salle de bain rénovée, Habitat", date: "mars 2026" },
  { legende: "Installation chauffe-eau, Dioulakro", date: "février 2026" },
  { legende: "Réseau d'eau, cour commune", date: "janvier 2026" },
];

export const PLANS = [
  { nom: "Gratuit", prix: "0 F / mois", actuel: false, action: "Choisir ce plan", avantages: ["1 réponse par jour", "Profil visible après vérification", "Aucune mise en avant"] },
  { nom: "Standard", prix: "15 000 F / mois", actuel: true, action: "Renouveler", avantages: ["5 réponses par jour", "Badge de réactivité", "Support par ticket"] },
  { nom: "Pro", prix: "30 000 F / mois", actuel: false, action: "Choisir ce plan", avantages: ["Réponses illimitées", "Priorité de classement", "1 mise en avant par mois"] },
];

/** Factures plateforme : seule une facture en attente ou échouée propose « Payer ». */
export const FACTURES = [
  { ref: "FAC-2026-00042", type: "Abonnement Standard", montant: "15 000 F", statut: "Vérification en cours", ton: "warning" as Ton, echeance: "18 avril 2026", payable: false },
  { ref: "FAC-2026-00031", type: "Abonnement Standard", montant: "15 000 F", statut: "Payée", ton: "success" as Ton, echeance: "18 mars 2026", payable: false },
  { ref: "FAC-2026-00025", type: "Mise en avant 7 jours", montant: "8 000 F", statut: "En attente", ton: "neutral" as Ton, echeance: "22 avril 2026", payable: true },
  { ref: "FAC-2026-00019", type: "Abonnement Standard", montant: "15 000 F", statut: "Échouée", ton: "danger" as Ton, echeance: "18 février 2026", payable: true },
];

export const MISES_EN_AVANT = [
  { duree: "7 jours", prix: "8 000 F", portee: "Plomberie · Habitat" },
  { duree: "14 jours", prix: "14 000 F", portee: "Plomberie · Habitat et Dioulakro" },
  { duree: "30 jours", prix: "25 000 F", portee: "Plomberie · Yamoussoukro" },
];

export const AVIS_RECUS = [
  { nom: "Awa K.", note: 5, date: "mardi 14 avril", ponctualite: 5, qualite: 5, prix: 5, texte: "Intervention rapide à Habitat, fuite réglée en une heure." },
  { nom: "Serge B.", note: 4, date: "jeudi 2 avril", ponctualite: 3, qualite: 5, prix: 4, texte: "Travail propre sur le chauffe-eau, une heure de retard annoncée." },
  { nom: "Mariam D.", note: 5, date: "lundi 23 mars", ponctualite: 5, qualite: 5, prix: 5, texte: "Devis après visite très clair, aucune mauvaise surprise." },
];

export const NOTIFICATIONS_PRO = [
  { icone: "inbox", titre: "Nouvelle demande de devis", texte: "Awa · Plomberie · Habitat · DEV-2026-00128", date: "il y a 20 minutes", nouveau: true, fond: "var(--kola-100)", encre: "var(--kola-700)" },
  { icone: "shield-check", titre: "Profil vérifié", texte: "Votre profil est publié et visible par les visiteurs.", date: "hier, 16:04", nouveau: false, fond: "var(--state-success-soft)", encre: "var(--lagune-700)" },
  { icone: "calendar-check", titre: "Réponse acceptée", texte: "Yao a accepté votre créneau de mardi 14 avril.", date: "hier, 10:22", nouveau: false, fond: "var(--state-success-soft)", encre: "var(--lagune-700)" },
  { icone: "receipt", titre: "Facture créée", texte: "FAC-2026-00042 · Abonnement Standard · 15 000 F", date: "lundi 13 avril", nouveau: false, fond: "var(--argile-100)", encre: "var(--argile-700)" },
  { icone: "credit-card", titre: "Paiement en cours de vérification", texte: "Le statut de FAC-2026-00042 sera mis à jour automatiquement.", date: "lundi 13 avril", nouveau: false, fond: "var(--state-warning-soft)", encre: "var(--state-warning)" },
  { icone: "clock", titre: "Abonnement bientôt expiré", texte: "Votre plan Standard expire le 30 avril 2026.", date: "samedi 11 avril", nouveau: false, fond: "var(--state-warning-soft)", encre: "var(--state-warning)" },
];

export const MOYENS_PAIEMENT_DIRECT = ["Espèces", "Wave", "Orange Money", "MTN Mobile Money", "Virement"];
