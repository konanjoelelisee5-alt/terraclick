import type { Secteur } from "../data/catalogue";
import { Icon } from "./Icon";

type Props = {
  secteur: Secteur;
  /** Hauteur du visuel ; il occupe toute la largeur de son conteneur. */
  hauteur: number | string;
  /** Taille de l'icône de secours. */
  tailleIcone?: number;
  style?: React.CSSProperties;
};

/**
 * Visuel d'un secteur : sa photo recadrée, ou, tant qu'il n'en a pas, son icône sur un
 * fond de la couleur d'accent. Les deux occupent exactement la même place, si bien qu'une
 * photo ajoutée plus tard ne décale rien.
 */
export function VisuelSecteur({ secteur, hauteur, tailleIcone = 28, style }: Props) {
  const cadre: React.CSSProperties = {
    display: "block",
    width: "100%",
    height: hauteur,
    overflow: "hidden",
    background: "var(--color-accent-2-100)",
    ...style,
  };

  if (secteur.image) {
    return (
      <span style={cadre}>
        <img
          src={secteur.image}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
        />
      </span>
    );
  }

  // Couleur choisie par l'administrateur : l'icône dans sa teinte, sur un fond pâle de la même.
  const teinte = secteur.couleur ? { color: secteur.couleur, background: `${secteur.couleur}1F` } : { color: "var(--color-accent-2-700)" };

  return (
    <span style={{ ...cadre, display: "grid", placeItems: "center", ...teinte }}>
      <Icon name={secteur.icone} size={tailleIcone} strokeWidth={2} />
    </span>
  );
}
