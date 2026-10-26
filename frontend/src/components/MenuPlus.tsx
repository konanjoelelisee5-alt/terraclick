import { useEffect, useState } from "react";
import { CONFIG } from "../lib/config";
import { effacerHistorique } from "../lib/historique";
import { useApp } from "../state/app";
import type { Ecran } from "../state/types";
import { Dialogue } from "./Dialogue";
import { Icon } from "./Icon";
import { dejaInstallee, proposerInstallation } from "./Installer";
import { useToast } from "./Toast";

/* Menu ⋮ de l'accueil sur téléphone : une fenêtre blanche ancrée en haut à droite, les
   entrées par groupes séparés d'un trait fin. Avec CONFIG.menuNavigateur, il reprend le menu
   d'un navigateur : rangée d'icônes (retour, suivant, favoris, installation, actualiser),
   données de navigation, téléchargements, onglets récents et entrées « Bientôt ». */

/** `navigateur` : entrée du menu façon navigateur, masquée sans CONFIG.menuNavigateur. */
type Entree = { icone: string; libelle: string; ecran?: Ecran; action?: () => void; bientot?: boolean; compte?: boolean; navigateur?: boolean };

const ROND: React.CSSProperties = {
  width: 52,
  height: 52,
  display: "grid",
  placeItems: "center",
  border: 0,
  borderRadius: 999,
  background: "var(--color-surface)",
  color: "var(--color-text)",
  cursor: "pointer",
};

export function MenuPlus({ onFermer }: { onFermer: () => void }) {
  const { etat, go, exigerCompte } = useApp();
  const toast = useToast();
  const [confirmerEffacement, setConfirmerEffacement] = useState(false);

  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    document.addEventListener("keydown", echap);
    return () => document.removeEventListener("keydown", echap);
  }, [onFermer]);

  const ouvrir = (entree: Entree) => {
    if (entree.bientot) return;
    if (entree.action) return entree.action();
    onFermer();
    if (entree.ecran) {
      const ecran = entree.ecran;
      if (entree.compte) exigerCompte(() => go(ecran));
      else go(ecran);
    }
  };

  const installer = async () => {
    onFermer();
    if (!(await proposerInstallation())) go("parametres");
  };

  const tous: Entree[][] = [
    // Les commandes et demandes en cours, puis leur historique.
    [{ icone: "square-plus", libelle: "Mes commandes", ecran: "onglets" }],
    [
      { icone: "history", libelle: CONFIG.menuNavigateur ? "Historique" : "Historique des recherches", ecran: "historique" },
      { icone: "trash-2", libelle: "Supprimer les données de navigation", action: () => setConfirmerEffacement(true), navigateur: true },
    ],
    [
      { icone: "download", libelle: "Téléchargements", ecran: "telechargements", navigateur: true },
      { icone: "star", libelle: "Favoris", ecran: "favoris" },
      // Les recherches faites sur ses autres appareils : il faut un compte.
      { icone: "monitor-smartphone", libelle: "Onglets récents", ecran: "ongletsRecents", compte: true, navigateur: true },
    ],
    [
      { icone: "settings", libelle: "Paramètres", ecran: "parametres" },
      { icone: "pen-line", libelle: "Personnaliser la page", bientot: true, navigateur: true },
      { icone: "circle-help", libelle: "Aide et commentaires", bientot: true, navigateur: true },
    ],
  ];
  const groupes = tous.map((groupe) => groupe.filter((e) => CONFIG.menuNavigateur || !e.navigateur)).filter((groupe) => groupe.length > 0);

  // La confirmation d'effacement prend la place du menu, au premier plan.
  if (confirmerEffacement) {
    return (
      <Dialogue
        titre="Supprimer les données de navigation ?"
        description="Votre historique de recherche sera effacé de vos appareils."
        icone="trash-2"
        fond="var(--state-danger-soft)"
        encre="var(--state-danger)"
        confirmer="Supprimer"
        onConfirmer={async () => {
          await effacerHistorique(!!etat.auth).catch(() => {});
          onFermer();
          toast("Données de navigation supprimées", "Votre historique de recherche est vide.");
        }}
        onFermer={onFermer}
      />
    );
  }

  return (
    <>
      {/* Fond transparent : un toucher en dehors referme le menu. */}
      <div onClick={onFermer} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
      <div
        data-r="menu-plus"
        role="menu"
        aria-label="Menu TerraClick"
        style={{
          position: "fixed",
          top: "calc(8px + env(safe-area-inset-top))",
          right: 8,
          zIndex: 71,
          width: "min(calc(100vw - 48px), 380px)",
          maxHeight: "calc(100vh - 24px)",
          overflowY: "auto",
          background: "var(--color-neutral-100)",
          borderRadius: 24,
          boxShadow: "0 12px 40px rgba(26,22,19,.22), 0 2px 8px rgba(26,22,19,.08)",
          padding: "14px 0 10px",
          transformOrigin: "top right",
          animation: "tc-menu .16s ease-out",
        }}
      >
        <style>{"@keyframes tc-menu { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: none; } }"}</style>

        {/* Rangée d'icônes. */}
        {CONFIG.menuNavigateur && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 18px 10px" }}>
            <button role="menuitem" aria-label="Retour" onClick={() => (onFermer(), history.back())} style={ROND}>
              <Icon name="arrow-left" size={22} />
            </button>
            <button role="menuitem" aria-label="Suivant" onClick={() => (onFermer(), history.forward())} style={ROND}>
              <Icon name="arrow-right" size={22} />
            </button>
            <button role="menuitem" aria-label="Favoris" onClick={() => (onFermer(), go("favoris"))} style={ROND}>
              <Icon name="star" size={22} />
            </button>
            <button
              role="menuitem"
              aria-label="Télécharger l'application"
              onClick={installer}
              disabled={dejaInstallee()}
              style={{ ...ROND, opacity: dejaInstallee() ? 0.4 : 1 }}
            >
              <Icon name="download" size={22} />
            </button>
            <button role="menuitem" aria-label="Actualiser" onClick={() => window.location.reload()} style={ROND}>
              <Icon name="rotate-cw" size={22} />
            </button>
          </div>
        )}

        {groupes.map((groupe, i) => (
          <div key={i} style={{ borderTop: i === 0 && !CONFIG.menuNavigateur ? 0 : "1px solid var(--color-divider)", margin: i === 0 && CONFIG.menuNavigateur ? "4px 0 0" : 0, padding: "6px 0" }}>
            {groupe.map((e) => (
              <button
                key={e.libelle}
                role="menuitem"
                aria-disabled={e.bientot || undefined}
                onClick={() => ouvrir(e)}
                style={{
                  width: "100%",
                  minHeight: 54,
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  padding: "0 22px",
                  border: 0,
                  background: "none",
                  font: "inherit",
                  fontSize: "16.5px",
                  color: e.bientot ? "#5C5248" : "var(--color-text)",
                  textAlign: "left",
                  cursor: e.bientot ? "default" : "pointer",
                }}
              >
                <Icon name={e.icone} size={22} strokeWidth={1.9} />
                <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.libelle}</span>
                {e.bientot && (
                  <span style={{ flex: "none", fontSize: "12px", fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: "var(--color-surface)", color: "#5C5248" }}>
                    Bientôt
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
