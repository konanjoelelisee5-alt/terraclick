import type { Prestataire } from "../data/catalogue";
import { Icon } from "./Icon";

/* Carte schématique de Yamoussoukro : voies, rond-point de la Basilique et
   pastilles numérotées. Elle tient lieu de fond tant qu'aucun fournisseur de
   cartographie n'est branché — les pastilles portent déjà l'interaction. */

type Props = {
  pros: Prestataire[];
  hauteur: number;
  /** Variante d'accueil : repère de la Basilique et bouton de localisation. */
  reperes?: boolean;
  onPin: (p: Prestataire) => void;
};

export function MapCanvas({ pros, hauteur, reperes = false, onPin }: Props) {
  const taillePin = reperes ? 36 : 34;
  const pasX = reperes ? 15 : 16;
  const baseY = reperes ? 20 : 22;
  const pasY = reperes ? 22 : 20;

  return (
    <div
      data-r="map-canvas"
      style={{
        position: "relative",
        height: hauteur,
        borderRadius: "calc(var(--radius-lg) * 1.15)",
        overflow: "hidden",
        background: "var(--color-accent-2-100)",
        ...(reperes ? { boxShadow: "var(--shadow-sm)" } : { marginBottom: 20 }),
      }}
    >
      <div
        style={{
          position: "absolute",
          left: reperes ? "-10%" : "-8%",
          top: reperes ? "34%" : "36%",
          width: "120%",
          height: reperes ? 18 : 16,
          background: "var(--color-neutral-200)",
          transform: `rotate(${reperes ? -7 : -6}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: reperes ? "-10%" : "-8%",
          top: reperes ? "68%" : "70%",
          width: "120%",
          height: reperes ? 12 : 11,
          background: "var(--color-neutral-200)",
          transform: "rotate(4deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: reperes ? "38%" : "42%",
          top: reperes ? "-10%" : "-8%",
          width: reperes ? 14 : 13,
          height: "120%",
          background: "var(--color-neutral-200)",
          transform: "rotate(6deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: reperes ? "56%" : "58%",
          top: reperes ? "14%" : "16%",
          width: reperes ? 170 : 150,
          height: reperes ? 170 : 150,
          borderRadius: "999px",
          background: "var(--color-accent-2-200)",
        }}
      />

      {reperes && (
        <span
          style={{
            position: "absolute",
            left: "60%",
            top: "44%",
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-accent-2-700)",
          }}
        >
          Basilique
        </span>
      )}

      {pros.slice(0, 5).map((p, i) => (
        <button
          key={p.nom}
          onClick={() => onPin(p)}
          aria-label={`${p.nom}, ${p.metier}`}
          style={{
            position: "absolute",
            left: `${14 + i * pasX}%`,
            top: `${baseY + (i % 3) * pasY}%`,
            width: taillePin,
            height: taillePin,
            borderRadius: "999px",
            border: 0,
            cursor: "pointer",
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            font: "inherit",
            fontSize: reperes ? "15px" : "14px",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {i + 1}
        </button>
      ))}

      {reperes && (
        <button
          className="sy-btn sy-btn--outline sy-btn--md"
          style={{
            position: "absolute",
            right: 14,
            bottom: 14,
            gap: 7,
            background: "var(--color-neutral-100)",
          }}
        >
          <Icon name="locate-fixed" size={16} strokeWidth={2.75} />
          Me localiser
        </button>
      )}
    </div>
  );
}
