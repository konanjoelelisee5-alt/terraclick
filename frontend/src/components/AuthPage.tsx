import type { ReactNode } from "react";
import type { Canal } from "../lib/useCodeConnexion";
import { Icon } from "./Icon";
import { canal as styleCanal } from "./ui";

/* Briques communes aux pages Connexion et Inscription. Elles reprennent les classes
   du design system (sy-card, sy-field, sy-weave…) et le sélecteur de canal de la
   feuille d'authentification, pour que les deux entrées se ressemblent. */

/** Code de démonstration (le backend l'impose en local) ; vide en production. */
const CODE_DEMO = import.meta.env.VITE_CODE_DEMO ?? "";

const MESSAGE: React.CSSProperties = {
  fontSize: "13.5px",
  lineHeight: 1.45,
  margin: 0,
  padding: "10px 12px",
  borderRadius: "var(--radius-md)",
};

/** Fond tissé, colonne centrée, titre et sous-titre, puis la carte du formulaire. */
export function CadreAuth({
  titre,
  sousTitre,
  largeur,
  children,
}: {
  titre: string;
  sousTitre: string;
  largeur: number;
  children: ReactNode;
}) {
  return (
    <main
      className="sy-weave"
      style={{
        backgroundColor: "var(--kola-50)",
        padding: "48px 16px 64px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: largeur, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h1
            style={{
              margin: "0 0 6px",
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: "30px",
              letterSpacing: "-0.028em",
              lineHeight: 1.06,
            }}
          >
            {titre}
          </h1>
          <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--text-muted)" }}>{sousTitre}</p>
        </div>
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

export function Alerte({ erreur, info }: { erreur: string | null; info?: string | null }) {
  return (
    <>
      {info && (
        <p role="status" style={{ ...MESSAGE, background: "var(--state-info-soft)", color: "var(--state-info)" }}>
          {info}
        </p>
      )}
      {erreur && (
        <p role="alert" style={{ ...MESSAGE, background: "var(--state-danger-soft)", color: "var(--state-danger)" }}>
          {erreur}
        </p>
      )}
    </>
  );
}

/** Champ téléphone avec l'indicatif ivoirien affiché devant. */
export function ChampTelephone({
  valeur,
  onChange,
  onValider,
  aide = true,
}: {
  valeur: string;
  onChange: (v: string) => void;
  onValider?: () => void;
  /** Rappel « jamais publié », inutile quand la page le dit déjà. */
  aide?: boolean;
}) {
  return (
    <div className="sy-field">
      <label className="sy-field__label" htmlFor="auth-telephone">
        Téléphone
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            border: "1.5px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            fontSize: "15px",
            whiteSpace: "nowrap",
          }}
        >
          +225
        </span>
        <input
          id="auth-telephone"
          className="sy-input"
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onValider?.()}
          placeholder="07 00 00 00 00"
          inputMode="tel"
          autoComplete="tel-national"
          style={{ flex: 1 }}
        />
      </div>
      {aide && <span className="sy-field__hint">Il sert à vous joindre pour vos demandes. Il n'est jamais publié.</span>}
    </div>
  );
}

export function ChoixCanal({ valeur, onChange }: { valeur: Canal; onChange: (c: Canal) => void }) {
  return (
    <div role="radiogroup" aria-label="Recevoir le code par" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        type="button"
        role="radio"
        aria-checked={valeur === "sms"}
        onClick={() => onChange("sms")}
        style={styleCanal(valeur === "sms")}
      >
        <Icon name="message-square" size={20} color="var(--kola-600)" />
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: "14.5px" }}>Code par SMS</span>
          <span style={{ display: "block", fontSize: "12.5px", color: "var(--text-muted)" }}>Fonctionne sans internet</span>
        </span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={valeur === "whatsapp"}
        onClick={() => onChange("whatsapp")}
        style={styleCanal(valeur === "whatsapp")}
      >
        <Icon name="message-circle" size={20} color="var(--kola-600)" />
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: "14.5px" }}>Code par WhatsApp</span>
          <span style={{ display: "block", fontSize: "12.5px", color: "var(--text-muted)" }}>
            Instantané en wifi, sans crédit
          </span>
        </span>
      </button>
    </div>
  );
}

/** Saisie du code reçu, avec la bulle de démonstration et le retour au numéro. */
export function EtapeCode({
  telephone,
  canal,
  code,
  onCode,
  onValider,
  onRenvoyer,
  onChangerNumero,
  occupe,
  libelleValider,
}: {
  telephone: string;
  canal: Canal;
  code: string;
  onCode: (c: string) => void;
  onValider: (c?: string) => void;
  onRenvoyer: () => void;
  onChangerNumero: () => void;
  occupe: boolean;
  libelleValider: string;
}) {
  const remplirDemo = () => {
    onCode(CODE_DEMO);
    onValider(CODE_DEMO);
  };

  return (
    <>
      <p style={{ margin: 0, fontSize: "14.5px", color: "var(--text-muted)" }}>
        Code envoyé par {canal === "whatsapp" ? "WhatsApp" : "SMS"} au <strong>{telephone}</strong>.
      </p>
      <div className="sy-field">
        <label className="sy-field__label" htmlFor="auth-code">
          Code à 6 chiffres
        </label>
        <input
          id="auth-code"
          className="sy-input"
          value={code}
          onChange={(e) => {
            const chiffres = e.target.value.replace(/\D/g, "").slice(0, 6);
            onCode(chiffres);
            if (chiffres.length === 6) onValider(chiffres);
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="••••••"
          maxLength={6}
          style={{ fontFamily: "var(--font-mono)", fontSize: "22px", letterSpacing: "0.4em", textAlign: "center" }}
        />
      </div>
      {CODE_DEMO && (
        <button
          type="button"
          onClick={remplirDemo}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            font: "inherit",
            textAlign: "left",
            padding: "10px 12px",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-sunken)",
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              flex: "none",
              borderRadius: "999px",
              background: "var(--kola-50)",
              color: "var(--kola-600)",
              display: "grid",
              placeItems: "center",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            SY
          </span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Servis Yakro : votre code est {CODE_DEMO.slice(0, 3)} {CODE_DEMO.slice(3, 4)}•• — appuyer pour remplir
          </span>
        </button>
      )}
      <button
        type="button"
        onClick={() => onValider()}
        disabled={occupe}
        aria-busy={occupe}
        className="sy-btn sy-btn--primary sy-btn--lg sy-btn--block"
      >
        {occupe ? "Vérification…" : libelleValider}
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <button type="button" onClick={onChangerNumero} className="sy-btn sy-btn--ghost sy-btn--sm">
          Changer de numéro
        </button>
        <button type="button" onClick={onRenvoyer} disabled={occupe} className="sy-btn sy-btn--ghost sy-btn--sm">
          Renvoyer le code
        </button>
      </div>
    </>
  );
}

/** Ligne de séparation suivie du lien vers l'autre page. */
export function LienBas({ texte, action, onClick }: { texte: string; action: string; onClick: () => void }) {
  return (
    <>
      <div style={{ height: 1, background: "var(--border-subtle)" }} />
      <p style={{ margin: 0, fontSize: "15px", textAlign: "center" }}>
        {texte}{" "}
        <button
          type="button"
          onClick={onClick}
          style={{
            background: "none",
            border: 0,
            padding: 0,
            cursor: "pointer",
            font: "inherit",
            fontWeight: 700,
            color: "var(--color-accent)",
          }}
        >
          {action}
        </button>
      </p>
    </>
  );
}
