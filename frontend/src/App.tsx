import { useEffect, useState } from "react";
import { api } from "./lib/api";
import { appliquerSecteurs } from "./data/catalogue";
import { CONFIG } from "./lib/config";
import { useEstMobile } from "./lib/useEstMobile";
import { appliquerTheme } from "./lib/theme";
import { AppProvider, useApp } from "./state/app";
import { AuthSheet } from "./components/AuthSheet";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { EnvolDemande } from "./components/EnvolDemande";
import { Notifications } from "./components/Notifications";
import { TabBar } from "./components/TabBar";
import { Assistant } from "./screens/Assistant";
import { Avis } from "./screens/Avis";
import { Chat } from "./screens/Chat";
import { Compte } from "./screens/Compte";
import { Connexion } from "./screens/Connexion";
import { Construction } from "./screens/Construction";
import { Contrat } from "./screens/Contrat";
import { Devis } from "./screens/Devis";
import { FichePro } from "./screens/FichePro";
import { Home } from "./screens/Home";
import { Inscription } from "./screens/Inscription";
import { MesProjets } from "./screens/MesProjets";
import { Publie } from "./screens/Publie";
import { Recu } from "./screens/Recu";
import { Results } from "./screens/Results";
import { Urgence } from "./screens/Urgence";
import { Favoris } from "./screens/Favoris";
import { ComposerPack } from "./screens/besoin/ComposerPack";
import { CommandePressing } from "./screens/besoin/CommandePressing";
import { DemandesRecues } from "./screens/pro/DemandesRecues";
import { DevenirPrestataire } from "./screens/prestataire/DevenirPrestataire";
import { AdminCandidatures } from "./screens/admin/AdminCandidatures";
import { AdminApercu } from "./screens/admin/AdminApercu";
import { AdminSignalements } from "./screens/admin/AdminSignalements";
import { AdminDemandes } from "./screens/admin/AdminDemandes";
import { AdminPrestataires } from "./screens/admin/AdminPrestataires";
import { AdminUtilisateurs } from "./screens/admin/AdminUtilisateurs";
import { AdminCatalogue } from "./screens/admin/AdminCatalogue";
import { AdminActivite } from "./screens/admin/AdminActivite";
import { AdminRoles } from "./screens/admin/AdminRoles";
import { AdminSecteurs } from "./screens/admin/AdminSecteurs";
import { AdminZones } from "./screens/admin/AdminZones";
import { premierModule } from "./screens/admin/EspaceAdmin";
import { peut } from "./lib/acces";
import { Historique, OngletAccord, Onglets, OngletsRecents, Parametres, Telechargements } from "./screens/menu/EcransMenu";
import { ConfirmationAccord } from "./components/ConfirmationAccord";
import { Besoin } from "./screens/besoin/Besoin";
import { Confirmation } from "./screens/besoin/Confirmation";
import { DemandeEnvoyee } from "./screens/besoin/DemandeEnvoyee";
import { Recommandations } from "./screens/besoin/Recommandations";
import { ProjLitige } from "./screens/projet/ProjLitige";
import { ProjMode } from "./screens/projet/ProjMode";
import { ProjOffres } from "./screens/projet/ProjOffres";
import { ProjQuest } from "./screens/projet/ProjQuest";
import { ProjSuivi } from "./screens/projet/ProjSuivi";
import { ProjetDashboard } from "./screens/projet/ProjetDashboard";
import { ProAbonnement } from "./screens/pro/ProAbonnement";
import { ProAvis } from "./screens/pro/ProAvis";
import { ProConsignes } from "./screens/pro/ProConsignes";
import { ProDashboard } from "./screens/pro/ProDashboard";
import { ProDemande } from "./screens/pro/ProDemande";
import { ProDemandes } from "./screens/pro/ProDemandes";
import { ProMiseEnAvant } from "./screens/pro/ProMiseEnAvant";
import { ProNotifications } from "./screens/pro/ProNotifications";
import { ProProfil } from "./screens/pro/ProProfil";
import { ProRealisations } from "./screens/pro/ProRealisations";
import { ProVerification } from "./screens/pro/ProVerification";
import { ToastProvider } from "./components/Toast";
import { BandeauMiseAJour } from "./components/MiseAJour";
import { ClientDashboard } from "./screens/client/ClientDashboard";
import { ClientDemandes } from "./screens/client/ClientDemandes";
import { ClientDevis } from "./screens/client/ClientDevis";
import { ClientNotifications } from "./screens/client/ClientNotifications";
import { ClientProfil } from "./screens/client/ClientProfil";
import { ClientSuivi } from "./screens/client/ClientSuivi";
import type { Ecran } from "./state/types";

const ECRANS: Record<Ecran, () => JSX.Element> = {
  home: Home,
  results: Results,
  chat: Chat,
  devis: Devis,
  urgence: Urgence,
  construction: Construction,
  assistant: Assistant,
  publie: Publie,
  mesProjets: MesProjets,
  projMode: ProjMode,
  projQuest: ProjQuest,
  projDash: ProjetDashboard,
  projOffres: ProjOffres,
  projSuivi: ProjSuivi,
  projLitige: ProjLitige,
  contrat: Contrat,
  fiche: FichePro,
  compte: Compte,
  recu: Recu,
  avis: Avis,
  connexion: Connexion,
  inscription: Inscription,
  besoin: Besoin,
  recommandations: Recommandations,
  confirmation: Confirmation,
  demandeEnvoyee: DemandeEnvoyee,
  favoris: Favoris,
  pack: ComposerPack,
  commandePressing: CommandePressing,
  onglets: Onglets,
  accord: OngletAccord,
  historique: Historique,
  ongletsRecents: OngletsRecents,
  telechargements: Telechargements,
  parametres: Parametres,
  clientDashboard: ClientDashboard,
  clientDemandes: ClientDemandes,
  clientSuivi: ClientSuivi,
  clientDevis: ClientDevis,
  clientNotifications: ClientNotifications,
  clientProfil: ClientProfil,
  proDashboard: ProDashboard,
  proConsignes: ProConsignes,
  proDemandes: ProDemandes,
  proDemande: ProDemande,
  proProfil: ProProfil,
  proRealisations: ProRealisations,
  proVerification: ProVerification,
  proAbonnement: ProAbonnement,
  proMiseEnAvant: ProMiseEnAvant,
  proAvis: ProAvis,
  proNotifications: ProNotifications,
  demandesRecues: DemandesRecues,
  devenirPrestataire: DevenirPrestataire,
  adminCandidatures: AdminCandidatures,
  adminApercu: AdminApercu,
  adminSignalements: AdminSignalements,
  adminDemandes: AdminDemandes,
  adminPrestataires: AdminPrestataires,
  adminUtilisateurs: AdminUtilisateurs,
  adminCatalogue: AdminCatalogue,
  adminActivite: AdminActivite,
  adminRoles: AdminRoles,
  adminSecteurs: AdminSecteurs,
  adminZones: AdminZones,
};

/** Écrans du module Construction, inaccessibles quand CONFIG.moduleConstruction est coupé (MVP). */
const ECRANS_CONSTRUCTION: Ecran[] = [
  "construction",
  "assistant",
  "publie",
  "mesProjets",
  "projMode",
  "projQuest",
  "projDash",
  "projOffres",
  "projSuivi",
  "projLitige",
  "contrat",
];

function Coque() {
  const { etat, set, go } = useApp();
  const masque = !CONFIG.moduleConstruction && ECRANS_CONSTRUCTION.includes(etat.screen);
  const Ecran = masque ? Home : ECRANS[etat.screen];
  // Sur téléphone, les onglets secondaires (Profil, Favoris) portent leur propre en-tête à
  // grand titre : ni logo ni choix de ville. Messages : l'en-tête est celui de la conversation.
  const estMobile = useEstMobile();
  const sansEntete =
    estMobile && ["home", "clientDashboard", "favoris", "connexion", "inscription", "pack", "chat", ...(CONFIG.ficheMobile === "profil" ? ["fiche"] : [])].includes(etat.screen);

  // Un clic hors du méga-menu le referme. L'écoute porte sur `mousedown` et non
  // sur `click` : le clic qui ouvre le panneau depuis l'en-tête continue de
  // remonter jusqu'au document après que React a posé cet écouteur, et un
  // écouteur `click` refermerait donc le panneau dans la foulée.
  useEffect(() => {
    if (!etat.deptsOpen) return;
    const fermer = (ev: MouseEvent) => {
      const cible = ev.target as HTMLElement;
      if (cible.closest('[data-r="megamenu"]') || cible.closest('[data-r="searchbar"]')) return;
      set({ deptsOpen: false });
    };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, [etat.deptsOpen, set]);

  // Un compte de l'équipe arrive sur son tableau de bord, jamais sur la page de recherche du client.
  const equipe = CONFIG.espaceEquipe === "tableauDeBord" && peut(etat.auth, "admin.acceder");
  const horsTableau = equipe && !/^admin[A-Z]/.test(etat.screen);
  useEffect(() => {
    if (horsTableau) go(premierModule(etat.auth));
  }, [horsTableau, etat.auth, go]);
  if (horsTableau) return null;

  // L'espace prestataire et l'espace administrateur sont des applications à part : ni
  // en-tête d'annuaire, ni pied de page, ni barre d'onglets du site public.
  if (/^(pro|admin)[A-Z]/.test(etat.screen) || etat.screen === "demandesRecues") {
    return (
      <div style={{ fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
        <Ecran />
        <AuthSheet />
        <BandeauMiseAJour />
      </div>
    );
  }

  return (
    <div
      data-r="page"
      style={{ minHeight: "100vh", fontFamily: "var(--font-body)", color: "var(--color-text)" }}
    >
      {!sansEntete && <Header />}
      <Ecran />
      <Notifications />
      <AuthSheet />
      <ConfirmationAccord />
      <EnvolDemande />
      <Footer />
      <TabBar />
      <BandeauMiseAJour />
    </div>
  );
}

export function App() {
  // Les secteurs viennent de l'API (gérés par l'administrateur) : s'ils diffèrent de ceux déjà
  // affichés, l'interface se redessine avec les nouveaux (ordre, noms, icônes, activation).
  const [versionSecteurs, setVersionSecteurs] = useState(0);
  useEffect(() => {
    appliquerTheme(CONFIG.variante);
    api.secteurs().then(
      (liste) => appliquerSecteurs(liste) && setVersionSecteurs((v) => v + 1),
      () => {},
    );
  }, []);

  return (
    <AppProvider>
      <ToastProvider>
        <Coque key={versionSecteurs} />
      </ToastProvider>
    </AppProvider>
  );
}
