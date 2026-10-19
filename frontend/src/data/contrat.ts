/* Devis accepté, contrat, signature électronique et échéancier. */

export const ETAPES_CONTRAT = [
  "Validation du devis",
  "Génération du contrat",
  "Signature électronique",
  "Échéancier de paiement",
  "Suivi activé",
];

export const ETAPES_PV = [
  "Réserves relevées",
  "PV de réserves",
  "Signature électronique",
  "Levée des réserves",
  "Réception définitive",
];

export const LIGNES_DEVIS = [
  { nom: "Fondations et dallage", montant: "9 200 000 F" },
  { nom: "Élévation et chaînage", montant: "11 400 000 F" },
  { nom: "Toiture et charpente", montant: "6 300 000 F" },
  { nom: "Électricité et plomberie", montant: "4 900 000 F" },
  { nom: "Carrelage et peinture", montant: "5 100 000 F" },
  { nom: "Coordination et encadrement", montant: "1 600 000 F" },
];

export const CLAUSES_CONTRAT = [
  {
    titre: "Parties",
    texte: "Aya Konan, Habitat, Yamoussoukro · Ent. Bakayoko, RCCM CI-YAM-2011-B-4482.",
  },
  {
    titre: "Objet des travaux",
    texte:
      "Construction d'une villa R+1 de 180 m², 3 chambres, 2 salles de bain, sur terrain titré à Habitat.",
  },
  {
    titre: "Cahier des charges",
    texte: "Béton dosé 350 pour les fondations, ferraillage complet, finition standard, carrelage 60 × 60.",
  },
  { titre: "Planning prévisionnel", texte: "Démarrage le 10 avril 2026, réception prévue en mars 2027, en 10 phases." },
  { titre: "Budget total", texte: "38 500 000 F, matériaux et main-d'œuvre inclus." },
  { titre: "Échéancier", texte: "6 jalons : 20 % au démarrage, 15 %, 25 %, 20 %, 15 %, 5 % à la réception." },
  { titre: "Garanties", texte: "Garantie décennale, parfait achèvement pendant 1 an." },
  { titre: "Retards", texte: "Pénalité de 0,5 % du montant du jalon par jour de retard, plafonnée à 10 %." },
  {
    titre: "Modifications",
    texte: "Tout changement fait l'objet d'un avenant signé par les deux parties avant exécution.",
  },
  {
    titre: "Litiges",
    texte: "Négociation de 48 h, puis médiation par TerraClick sur la base du rapport de l'agent.",
  },
];

export const MOYENS_SIGNATURE = [
  { nom: "Code par SMS", info: "Envoyé au 07 58 42 19 03", icon: "message-square" },
  { nom: "Confirmation par e-mail", info: "Lien de validation", icon: "mail" },
  { nom: "Signature tracée", info: "Au doigt ou à la souris", icon: "pen-line" },
];

export const JALONS_CONTRAT = [
  { nom: "Acompte de démarrage", pct: "20 %", montant: "7 700 000 F", cond: "Signature du contrat" },
  { nom: "Fondations terminées", pct: "15 %", montant: "5 775 000 F", cond: "Rapport de l'agent" },
  { nom: "Gros œuvre", pct: "25 %", montant: "9 625 000 F", cond: "Murs achevés" },
  { nom: "Second œuvre", pct: "20 %", montant: "7 700 000 F", cond: "Électricité et plomberie posées" },
  { nom: "Finitions", pct: "15 %", montant: "5 775 000 F", cond: "Carrelage et peinture achevés" },
  { nom: "Réception finale", pct: "5 %", montant: "1 925 000 F", cond: "PV sans réserve" },
];

export const MOYENS_PAIEMENT = ["Wave", "Orange Money", "MTN Mobile Money", "Virement bancaire"];
