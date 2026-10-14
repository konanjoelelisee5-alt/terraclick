/* Rating — composant du design system Servis Yakro (components/marketplace/Rating.jsx).
   Étoile en SVG propre au composant, remplie en Soleil via `.sy-rating__stars`.
   Seul écart assumé : la note est écrite avec la virgule décimale française
   (« 4,8 »), conformément aux règles de contenu du design system. */

type Props = {
  value?: number;
  count?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function Rating({ value = 0, count, size = 14, showValue = true, className = "", style }: Props) {
  return (
    <span className={["sy-rating", className].filter(Boolean).join(" ")} style={style}>
      <span className="sy-rating__stars">
        {[0, 1, 2, 3, 4].map((i) => (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill={i < Math.round(value) ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.3"
            aria-hidden="true"
          >
            <path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.2L8 11.6 4.2 13.5l.7-4.2-3.1-3 4.3-.6z" strokeLinejoin="round" />
          </svg>
        ))}
      </span>
      {showValue && <strong style={{ fontWeight: 700 }}>{Number(value).toFixed(1).replace(".", ",")}</strong>}
      {count != null && <span className="sy-rating__count">({count})</span>}
    </span>
  );
}
