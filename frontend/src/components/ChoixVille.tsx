import { VILLES } from "../data/catalogue";
import { useApp } from "../state/app";
import { Icon } from "./Icon";

type Props = {
  /** Repère du système responsive (`search-ville`, `nav-ville`), qui affiche ou masque le choix. */
  "data-r": string;
  /** Habillage de la pastille visible, propre à chaque emplacement. */
  style: React.CSSProperties;
  /** Icônes réduites, pour l'en-tête. */
  compact?: boolean;
};

/**
 * Choix de la ville en un geste : la pastille garde l'allure d'un bouton, mais un
 * `<select>` natif transparent la recouvre. Sur Android, c'est la liste du système
 * qui s'ouvre ; au clavier, les flèches suffisent. Toutes les villes sont visibles
 * d'emblée, au lieu de les faire défiler une à une.
 */
export function ChoixVille({ style, compact = false, ...props }: Props) {
  const { set, ville, villeIdx } = useApp();

  return (
    <label data-r={props["data-r"]} style={{ position: "relative", cursor: "pointer", ...style }}>
      <Icon name="map-pin" size={compact ? 15 : 17} strokeWidth={2.75} color="var(--color-accent)" />
      <span data-r="ville-nom">{ville}</span>
      <Icon name="chevron-down" size={14} strokeWidth={2.75} style={{ opacity: 0.6 }} />
      <select
        value={villeIdx}
        onChange={(e) => set({ ville: Number(e.target.value), quartier: 0 })}
        aria-label="Votre ville"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          cursor: "pointer",
          font: "inherit",
          // Sans apparence native, la liste déroulante garde tout de même son rendu système.
          appearance: "none",
        }}
      >
        {VILLES.map((nom, i) => (
          <option key={nom} value={i}>
            {nom}
          </option>
        ))}
      </select>
    </label>
  );
}
