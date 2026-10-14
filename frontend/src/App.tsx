import { useEffect } from "react";
import { CONFIG } from "./lib/config";
import { appliquerTheme } from "./lib/theme";
import { AppProvider, useApp } from "./state/app";
import { AuthSheet } from "./components/AuthSheet";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Notifications } from "./components/Notifications";
import { TabBar } from "./components/TabBar";
import { Assistant } from "./screens/Assistant";
import { Avis } from "./screens/Avis";
import { Chat } from "./screens/Chat";
import { Compte } from "./screens/Compte";
import { Construction } from "./screens/Construction";
import { Contrat } from "./screens/Contrat";
import { Devis } from "./screens/Devis";
import { FichePro } from "./screens/FichePro";
import { Home } from "./screens/Home";
import { MesProjets } from "./screens/MesProjets";
import { Publie } from "./screens/Publie";
import { Recu } from "./screens/Recu";
import { Results } from "./screens/Results";
import { Urgence } from "./screens/Urgence";
import { ProjLitige } from "./screens/projet/ProjLitige";
import { ProjMode } from "./screens/projet/ProjMode";
import { ProjOffres } from "./screens/projet/ProjOffres";
import { ProjQuest } from "./screens/projet/ProjQuest";
import { ProjSuivi } from "./screens/projet/ProjSuivi";
import { ProjetDashboard } from "./screens/projet/ProjetDashboard";
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
};

function Coque() {
  const { etat, set } = useApp();
  const Ecran = ECRANS[etat.screen];

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

  return (
    <div
      data-r="page"
      style={{ minHeight: "100vh", fontFamily: "var(--font-body)", color: "var(--color-text)" }}
    >
      <Header />
      <Ecran />
      <Notifications />
      <AuthSheet />
      <Footer />
      <TabBar />
    </div>
  );
}

export function App() {
  useEffect(() => {
    appliquerTheme(CONFIG.variante);
  }, []);

  return (
    <AppProvider>
      <Coque />
    </AppProvider>
  );
}
