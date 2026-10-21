import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * En-tête à grand titre, à la manière d'iOS : titre de 32 px en haut à gauche, actions rondes à
 * droite. Dès que le grand titre sort de l'écran, une barre fixe prend le relais avec le titre
 * réduit à 18 px et un séparateur fin.
 */
export function GrandTitre({ titre, actions, onAccueil }: { titre: string; actions?: ReactNode; /** Bouton rond « Accueil » à gauche. */ onAccueil?: () => void }) {
  const repere = useRef<HTMLHeadingElement>(null);
  const [reduit, setReduit] = useState(false);

  useEffect(() => {
    const el = repere.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setReduit(!e.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <div
        data-r="barre-titre"
        aria-hidden={!reduit}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          paddingTop: "env(safe-area-inset-top)",
          background: "var(--color-bg)",
          borderBottom: "1px solid var(--color-divider)",
          opacity: reduit ? 1 : 0,
          pointerEvents: reduit ? "auto" : "none",
          transition: "opacity var(--dur-fast, .15s)",
        }}
      >
        <div style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "0 24px" }}>
          {onAccueil && (
            <span style={{ position: "absolute", left: 16 }}>
              <BoutonRond libelle="Accueil" onClick={onAccueil}>
                <Icon name="home" size={20} />
              </BoutonRond>
            </span>
          )}
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "18px" }}>{titre}</span>
          {actions && <span style={{ position: "absolute", right: 16, display: "flex", gap: 8 }}>{actions}</span>}
        </div>
      </div>

      {/* Accueil : bouton rond au-dessus du grand titre (la barre du bas n'a plus d'onglet Accueil). */}
      {onAccueil && (
        <div style={{ padding: "calc(12px + env(safe-area-inset-top)) 20px 0" }}>
          <BoutonRond libelle="Accueil" onClick={onAccueil}>
            <Icon name="home" size={20} />
          </BoutonRond>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: onAccueil ? "16px 24px 0" : "32px 24px 0" }}>
        <h1 ref={repere} style={{ flex: 1, margin: 0, fontSize: "34px", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          {titre}
        </h1>
        {actions && <span style={{ display: "flex", gap: 8 }}>{actions}</span>}
      </div>
    </>
  );
}

/** Bouton rond de 44 px, fond gris très clair, icône seule ; badge orange facultatif. */
export function BoutonRond(props: { libelle: string; onClick: () => void; children: ReactNode; badge?: number }) {
  return (
    <button
      onClick={props.onClick}
      aria-label={props.badge ? `${props.libelle}, ${props.badge} non lue${props.badge > 1 ? "s" : ""}` : props.libelle}
      style={{
        position: "relative",
        width: 44,
        height: 44,
        flex: "none",
        display: "grid",
        placeItems: "center",
        border: 0,
        borderRadius: 999,
        background: "var(--color-surface)",
        color: "var(--color-text)",
        cursor: "pointer",
      }}
    >
      {props.children}
      {!!props.badge && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "var(--color-accent)",
            border: "2px solid var(--color-surface)",
          }}
        />
      )}
    </button>
  );
}
