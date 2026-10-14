import type { CSSProperties } from "react";

/* Emplacement de photographie. Le design system ne fournit aucune image :
   les écrans réservent la place et affichent un bloc neutre chaud en attendant
   les vraies photos (chantiers, réalisations, réserves). Dès qu'une URL est
   disponible, elle est affichée en `cover`, rayon hérité du conteneur. */

type Props = {
  /** URL de la photo lorsqu'elle existe. */
  src?: string;
  /** Texte affiché à la place de la photo, et texte alternatif de l'image. */
  placeholder: string;
  shape?: "circle" | "rounded";
  radius?: number;
  style?: CSSProperties;
};

export function ImageSlot({ src, placeholder, shape = "rounded", radius = 12, style }: Props) {
  const borderRadius = shape === "circle" ? "999px" : `${radius}px`;

  if (src) {
    return (
      <img
        src={src}
        alt={placeholder}
        style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", borderRadius, ...style }}
      />
    );
  }

  return (
    <div className="sy-slot" style={{ borderRadius, width: "100%", height: "100%", ...style }} role="img" aria-label={placeholder}>
      {placeholder}
    </div>
  );
}
