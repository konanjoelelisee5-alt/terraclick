/* Données de la page projet : les onze onglets, de la vue d'ensemble à l'entretien. */

export const ONGLETS_PROJET = [
  "Vue d'ensemble",
  "Propositions",
  "Suivi chantier",
  "Pré-réception",
  "Paiements",
  "Matériaux",
  "Équipements",
  "Messages",
  "Documents",
  "Incidents et SAV",
  "Entretien",
];

export const OFFRES_CLE = [
  {
    ini: "EB",
    nom: "Ent. Bakayoko",
    note: "4,8",
    avis: 34,
    zone: "Yamoussoukro et Toumodi",
    delai: "6 mois",
    prix: "38 500 000 F",
    inclus: "Matériaux, main-d'œuvre, coordination, finitions standard",
    exclus: "Climatisation, portail automatique, mobilier",
    garantie: "Garantie décennale · 1 an parfait achèvement",
    paiement: "6 jalons",
  },
  {
    ini: "SD",
    nom: "Sidibé & Fils",
    note: "4,3",
    avis: 11,
    zone: "Yamoussoukro",
    delai: "7 mois",
    prix: "35 200 000 F",
    inclus: "Matériaux, main-d'œuvre, coordination",
    exclus: "Peinture décorative, équipements, aménagement extérieur",
    garantie: "1 an",
    paiement: "5 jalons",
  },
];

export const LOTS_ARTISANS = [
  {
    metier: "Maçonnerie",
    nom: "Koné Maçonnerie",
    note: "4,5",
    avis: 18,
    zone: "Habitat, Kokrenou",
    dispo: "Disponible sous 2 semaines",
    prix: "12 400 000 F",
  },
  {
    metier: "Plomberie",
    nom: "Koffi Tanoh",
    note: "4,8",
    avis: 63,
    zone: "Tout Yakro",
    dispo: "Disponible immédiatement",
    prix: "2 850 000 F",
  },
  {
    metier: "Électricité",
    nom: "Ali Diomandé",
    note: "4,5",
    avis: 21,
    zone: "Assabou",
    dispo: "Disponible sous 1 mois",
    prix: "3 100 000 F",
  },
];

export const CRITERES_COMPARAISON = [
  { cle: "Prix total", a: "38 500 000 F", b: "18 350 000 F (3 lots)" },
  { cle: "Délai", a: "6 mois", b: "8 mois estimés" },
  { cle: "Garantie", a: "Décennale + 1 an", b: "Par lot, 6 mois à 1 an" },
  { cle: "Responsable unique", a: "Oui, l'entreprise", b: "Non, vous coordonnez" },
  { cle: "Flexibilité", a: "Faible", b: "Élevée" },
  { cle: "Suivi de chantier", a: "Inclus", b: "Conducteur de travaux en option" },
  { cle: "Paiement par étapes", a: "6 jalons", b: "Par lot" },
  { cle: "Matériaux inclus", a: "Oui", b: "Non, à votre charge" },
];

export const PHASES_CHANTIER = [
  { nom: "Fondations", etat: "Terminée", info: "Achevée le 12 mai" },
  { nom: "Dallage", etat: "Terminée", info: "Achevée le 3 juin" },
  { nom: "Élévation des murs", etat: "En cours", info: "68 % · fin prévue le 20 septembre" },
  { nom: "Toiture", etat: "À venir", info: "Octobre 2026" },
  { nom: "Électricité et plomberie", etat: "À venir", info: "Novembre 2026" },
  { nom: "Carrelage", etat: "À venir", info: "Décembre 2026" },
  { nom: "Peinture", etat: "À venir", info: "Janvier 2027" },
  { nom: "Installation des équipements", etat: "À venir", info: "Février 2027" },
  { nom: "Nettoyage", etat: "À venir", info: "Février 2027" },
  { nom: "Remise des clés", etat: "À venir", info: "Mars 2027" },
];

export const VALIDATIONS_CLIENT = [
  { nom: "Choix du carrelage", etat: "À valider" },
  { nom: "Choix de peinture", etat: "En attente" },
  { nom: "Choix des sanitaires", etat: "Validé" },
  { nom: "Choix des menuiseries", etat: "En attente" },
];

export const JALONS = [
  {
    nom: "Acompte de démarrage",
    pct: "20 %",
    montant: "7 700 000 F",
    date: "10 avril 2026",
    etat: "Payé",
    cond: "Signature du contrat",
  },
  {
    nom: "Fondations terminées",
    pct: "15 %",
    montant: "5 775 000 F",
    date: "15 mai 2026",
    etat: "Payé",
    cond: "Rapport de l'agent + photos",
  },
  {
    nom: "Gros œuvre",
    pct: "25 %",
    montant: "9 625 000 F",
    date: "30 septembre 2026",
    etat: "À valider",
    cond: "Murs achevés, vérification sur site",
  },
  {
    nom: "Second œuvre",
    pct: "20 %",
    montant: "7 700 000 F",
    date: "30 novembre 2026",
    etat: "En attente",
    cond: "Électricité et plomberie posées",
  },
  {
    nom: "Finitions",
    pct: "15 %",
    montant: "5 775 000 F",
    date: "31 janvier 2027",
    etat: "En attente",
    cond: "Carrelage et peinture achevés",
  },
  {
    nom: "Réception finale",
    pct: "5 %",
    montant: "1 925 000 F",
    date: "mars 2027",
    etat: "En attente",
    cond: "PV de réception sans réserve",
  },
];

export const MATERIAUX = [
  {
    mat: "Ciment CPJ 45",
    fourn: "Cimenterie du Bandama",
    qte: "420 sacs",
    pu: "5 200 F",
    total: "2 184 000 F",
    etat: "Livré",
  },
  {
    mat: "Fer à béton 12",
    fourn: "Quincaillerie Yakro",
    qte: "3,2 t",
    pu: "620 000 F/t",
    total: "1 984 000 F",
    etat: "Livré",
  },
  {
    mat: "Carrelage 60×60",
    fourn: "Déco Habitat",
    qte: "180 m²",
    pu: "9 500 F",
    total: "1 710 000 F",
    etat: "En attente",
  },
];

export const EQUIPEMENTS_PROJET = [
  {
    nom: "Climatisation",
    info: "3 splits 1,5 CV · installation avant la peinture finale",
    prix: "1 250 000 F",
    etat: "Validé",
  },
  {
    nom: "Panneaux solaires",
    info: "3 kWc · à câbler avant la toiture",
    prix: "4 800 000 F",
    etat: "À valider",
  },
  {
    nom: "Alarme et vidéosurveillance",
    info: "À installer avant la remise des clés",
    prix: "890 000 F",
    etat: "En attente",
  },
];

export const DOCUMENTS_PROJET = [
  { nom: "Contrat signé", meta: "PDF · signé le 8 avril 2026", icon: "file-signature" },
  { nom: "Plan-RDC.pdf", meta: "PDF · 2,4 Mo", icon: "file-text" },
  { nom: "Devis Ent. Bakayoko", meta: "PDF · 38 500 000 F", icon: "receipt" },
  { nom: "Rapport agent · semaine 34", meta: "PDF · 6 photos", icon: "clipboard-check" },
];

export const TICKETS = [
  { titre: "Fissure sur le mur nord", cat: "Maçonnerie", prio: "Haute", etat: "En cours", quand: "il y a 2 jours" },
  { titre: "Prise absente dans la chambre 2", cat: "Électricité", prio: "Moyenne", etat: "Ouvert", quand: "hier" },
  { titre: "Infiltration sous la fenêtre", cat: "Menuiserie", prio: "Haute", etat: "Résolu", quand: "il y a 3 semaines" },
];

export const ENTRETIEN_PROJET = [
  { nom: "Femme de ménage", info: "Hebdomadaire · à partir de 25 000 F/mois", icon: "brush" },
  { nom: "Jardinier", info: "Bimensuel · à partir de 15 000 F/mois", icon: "sprout" },
  { nom: "Entretien climatisation", info: "Rappel tous les 6 mois", icon: "wind" },
  { nom: "Désinsectisation", info: "Rappel tous les 6 mois", icon: "bug" },
];

/* ---- Pré-réception ---- */

export const LOTS_RECEPTION = [
  { lot: "Gros œuvre", faits: "8 sur 8", ok: true, detail: "Fondations, élévation, chaînage, dalle" },
  { lot: "Toiture", faits: "5 sur 5", ok: true, detail: "Charpente, couverture, gouttières" },
  { lot: "Plomberie", faits: "6 sur 7", ok: false, detail: "Pression insuffisante à l'étage" },
  { lot: "Électricité", faits: "9 sur 9", ok: true, detail: "Tableau, prises, éclairage, terre" },
  { lot: "Carrelage", faits: "4 sur 5", ok: false, detail: "Joints irréguliers dans la chambre 2" },
  { lot: "Peinture", faits: "3 sur 4", ok: false, detail: "Reprises visibles dans le couloir" },
];

export const RESERVES = [
  {
    ref: "RES-01",
    titre: "Pression d'eau insuffisante à l'étage",
    lot: "Plomberie",
    resp: "Koffi Tanoh",
    delai: "sous 7 jours",
    slot: "sy-res1",
    gravite: "Bloquante",
  },
  {
    ref: "RES-02",
    titre: "Joints de carrelage irréguliers · chambre 2",
    lot: "Carrelage",
    resp: "Ent. Bakayoko",
    delai: "sous 14 jours",
    slot: "sy-res2",
    gravite: "Mineure",
  },
  {
    ref: "RES-03",
    titre: "Reprises de peinture visibles · couloir",
    lot: "Peinture",
    resp: "Ent. Bakayoko",
    delai: "sous 14 jours",
    slot: "sy-res3",
    gravite: "Mineure",
  },
];
