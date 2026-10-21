import { useApp } from "../state/app";
import { GrandTitre } from "../components/GrandTitre";
import { Icon } from "../components/Icon";

/**
 * Favoris. La fonction « Enregistrer un prestataire » n'existe pas encore : l'écran montre son
 * état vide et propose de chercher un technicien, en attendant d'afficher les listes.
 */
export function Favoris() {
  const { go } = useApp();

  return (
    <main data-r="favoris" style={{ paddingBottom: 40 }}>
      <GrandTitre titre="Favoris" onAccueil={() => go("home")} />
      <div
        role="status"
        style={{ minHeight: "52vh", padding: "0 32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 8 }}
      >
        <Icon name="heart" size={48} strokeWidth={1.5} color="#5C5248" />
        <h2 style={{ margin: "8px 0 0", fontSize: "22px" }}>Aucun favori pour l'instant</h2>
        <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.5, color: "#5C5248", maxWidth: "30ch" }}>
          Les techniciens que vous enregistrez apparaîtront ici, pour les retrouver en un geste.
        </p>
        <button onClick={() => go("home")} className="sy-btn sy-btn--outline sy-btn--md" style={{ marginTop: 12, minHeight: 48 }}>
          Trouver un technicien
        </button>
      </div>
    </main>
  );
}
