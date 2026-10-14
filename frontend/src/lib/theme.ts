/* Habillages de l'application.
 *
 * Le design system Servis Yakro fournit les jetons de marque (--kola-*, --argile-*,
 * --state-*). Cette couche pose par-dessus les alias --color-* utilisés par les écrans,
 * ce qui permet de rhabiller toute l'application sans toucher au balisage : quatre
 * variantes ont été validées pendant la conception, plus une couleur d'accent réglable
 * sur la variante Organic.
 */

export const VARIANTES = [
  "Servis Yakro (officiel)",
  "Chaleureux (Organic)",
  "Sobre & pro",
  "Nuit",
  "Compact annuaire",
] as const;

export type Variante = (typeof VARIANTES)[number];

type Habillage = {
  /** Accent principal. */
  a: string;
  /** Accent secondaire. */
  b: string;
  bg: string;
  surface: string;
  text: string;
  n100: string;
  n200: string;
  n300: string;
  n700: string;
  n800: string;
  div: string;
  rMd: string;
  rLg: string;
  heading?: string;
  body?: string;
  /** Fond vers lequel mélanger les teintes claires (variantes sombres). */
  tintTarget?: string;
  darkOnTint?: boolean;
};

const HABILLAGES: Record<Variante, Habillage> = {
  "Servis Yakro (officiel)": {
    a: "#E25B1A",
    b: "#1F7A57",
    bg: "#FDFBF8",
    surface: "#F8F4EF",
    text: "#1A1613",
    n100: "#FFFFFF",
    n200: "#E0D8CD",
    n300: "#C6BCAE",
    n700: "#7A6F61",
    n800: "#2B2620",
    div: "#EFE9E1",
    rMd: "12px",
    rLg: "16px",
    heading: "'Bricolage Grotesque', system-ui, sans-serif",
    body: "'Manrope', system-ui, sans-serif",
  },
  "Chaleureux (Organic)": {
    a: "#c67139",
    b: "#7a8a5e",
    bg: "#faf7f2",
    surface: "#f3ede4",
    text: "#2e2b25",
    n100: "#ffffff",
    n200: "#e8e1d6",
    n300: "#d5cdbf",
    n700: "#7d766c",
    n800: "#514c44",
    div: "#e4ddd2",
    rMd: "12px",
    rLg: "20px",
  },
  "Sobre & pro": {
    a: "#2f5d8c",
    b: "#3d8f7a",
    bg: "#f7f8fa",
    surface: "#eef1f5",
    text: "#1c2531",
    n100: "#ffffff",
    n200: "#e2e7ee",
    n300: "#cbd3dd",
    n700: "#6b7686",
    n800: "#414d5c",
    div: "#dde3ea",
    rMd: "8px",
    rLg: "12px",
  },
  Nuit: {
    a: "#e08b4f",
    b: "#79b39a",
    bg: "#16181c",
    surface: "#1f2329",
    text: "#eceef1",
    n100: "#22262c",
    n200: "#2c3138",
    n300: "#3a4048",
    n700: "#9aa3ae",
    n800: "#c3cad2",
    div: "#2f353d",
    rMd: "12px",
    rLg: "18px",
    tintTarget: "#16181c",
    darkOnTint: true,
  },
  "Compact annuaire": {
    a: "#b4472f",
    b: "#5c7a52",
    bg: "#ffffff",
    surface: "#f4f4f2",
    text: "#22201d",
    n100: "#ffffff",
    n200: "#e6e5e1",
    n300: "#d2d1cc",
    n700: "#75726c",
    n800: "#494640",
    div: "#e2e1dd",
    rMd: "6px",
    rLg: "10px",
  },
};

/** Duos d'accent proposés sur la variante Organic. */
export const DUOS_ACCENT: ReadonlyArray<readonly [string, string]> = [
  ["#c67139", "#7a8a5e"],
  ["#1f6f5c", "#d99a3f"],
  ["#2f5d8c", "#c67139"],
  ["#8c3d52", "#7a8a5e"],
];

/**
 * Applique un habillage sur `document.documentElement`.
 * Le duo d'accent n'est pris en compte que sur la variante Organic — les autres
 * variantes portent leur propre identité chromatique.
 */
export function appliquerTheme(
  variante: Variante = "Servis Yakro (officiel)",
  duoAccent?: readonly [string, string],
): void {
  const v = HABILLAGES[variante] ?? HABILLAGES["Servis Yakro (officiel)"];
  const modulable = variante === "Chaleureux (Organic)";
  const a = modulable && duoAccent ? duoAccent[0] : v.a;
  const b = modulable && duoAccent ? duoAccent[1] : v.b;

  const r = document.documentElement.style;
  r.setProperty("--color-bg", v.bg);
  r.setProperty("--color-surface", v.surface);
  r.setProperty("--color-text", v.text);
  r.setProperty("--color-neutral-100", v.n100);
  r.setProperty("--color-neutral-200", v.n200);
  r.setProperty("--color-neutral-300", v.n300);
  r.setProperty("--color-neutral-700", v.n700);
  r.setProperty("--color-neutral-800", v.n800);
  r.setProperty("--color-neutral-900", v.text);
  r.setProperty("--color-divider", v.div);
  r.setProperty("--radius-md", v.rMd);
  r.setProperty("--radius-lg", v.rLg);
  r.setProperty("--font-heading", v.heading ?? "'Bricolage Grotesque', system-ui, sans-serif");
  r.setProperty("--font-body", v.body ?? "'Manrope', system-ui, sans-serif");
  document.body.style.background = v.bg;

  // Sur fond sombre, les teintes claires se mélangent vers le fond de la variante
  // (et les tons foncés vers le blanc) pour que hero, cartes et carte restent lisibles.
  const cible = v.tintTarget ?? "white";
  const sombre = !!v.darkOnTint;
  const melange = (couleur: string, vers: string, pct: number) =>
    `color-mix(in oklab, ${couleur} ${100 - pct}%, ${vers === "white" ? cible : vers} ${pct}%)`;

  r.setProperty("--color-accent", a);
  r.setProperty("--color-accent-100", melange(a, "white", sombre ? 84 : 88));
  r.setProperty("--color-accent-200", melange(a, "white", sombre ? 72 : 76));
  r.setProperty("--color-accent-300", melange(a, "white", 58));
  r.setProperty("--color-accent-400", melange(a, "white", 40));
  r.setProperty("--color-accent-600", melange(a, sombre ? "white" : "black", 12));
  r.setProperty("--color-accent-700", sombre ? melange(a, "#ffffff", 22) : melange(a, "black", 26));
  r.setProperty("--color-accent-800", sombre ? melange(a, "#ffffff", 40) : melange(a, "black", 42));
  r.setProperty("--color-accent-900", sombre ? melange(a, "#ffffff", 60) : melange(a, "black", 62));
  r.setProperty("--color-accent-2", b);
  r.setProperty("--color-accent-2-100", melange(b, "white", sombre ? 84 : 86));
  r.setProperty("--color-accent-2-200", melange(b, "white", sombre ? 70 : 72));
  r.setProperty("--color-accent-2-700", sombre ? melange(b, "#ffffff", 26) : melange(b, "black", 30));
  r.setProperty("--color-accent-2-800", sombre ? melange(b, "#ffffff", 44) : melange(b, "black", 46));
}
