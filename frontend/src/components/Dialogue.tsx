import { useEffect, type ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Fenêtre de confirmation (classes sy-dialog du design system). Se ferme avec
 * Échap ou un clic sur le fond ; le focus part sur le premier champ ou bouton.
 */
export function Dialogue({
  titre,
  description,
  icone,
  fond,
  encre,
  confirmer,
  onConfirmer,
  onFermer,
  note,
  annuler = "Annuler",
  children,
}: {
  titre: string;
  description: string;
  icone: string;
  fond: string;
  encre: string;
  confirmer: string;
  onConfirmer: () => void;
  onFermer: () => void;
  note?: string;
  /** Libellé du bouton secondaire (« Pas encore »…). */
  annuler?: string;
  children?: ReactNode;
}) {
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [onFermer]);

  return (
    <div className="sy-dialog__scrim" onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="sy-dialog" role="dialog" aria-modal="true" aria-labelledby="dialogue-titre">
        <div className="sy-dialog__head">
          <span
            style={{
              width: 44,
              height: 44,
              flex: "none",
              borderRadius: 12,
              background: fond,
              color: encre,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name={icone} size={22} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div id="dialogue-titre" className="sy-dialog__title">
              {titre}
            </div>
            <div className="sy-dialog__desc">{description}</div>
          </div>
          <button type="button" className="sy-iconbtn sy-iconbtn--sm" onClick={onFermer} aria-label="Fermer">
            <Icon name="x" size={18} />
          </button>
        </div>
        {(children || note) && (
          <div className="sy-dialog__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {children}
            {note && <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.55, color: "var(--text-muted)" }}>{note}</p>}
          </div>
        )}
        <div className="sy-dialog__foot">
          <button type="button" className="sy-btn sy-btn--ghost sy-btn--md" onClick={onFermer}>
            {annuler}
          </button>
          <button type="button" className="sy-btn sy-btn--primary sy-btn--md" onClick={onConfirmer} autoFocus={!children}>
            {confirmer}
          </button>
        </div>
      </div>
    </div>
  );
}
