import { useState, type ReactNode } from "react";
import type { Canal } from "../lib/useCodeConnexion";
import { useApp } from "../state/app";
import { Icon } from "./Icon";

/* Pages Connexion et Inscription, plein écran : flèche retour, logo TerraClick avec halo,
   « Bienvenue », pastille « Espace Client », bascule Connexion | Inscription, champs arrondis à
   étiquette flottante et icône dans une pastille orange, grand bouton orange. Pas de mot de
   passe : le numéro est prouvé par un code reçu par SMS ou WhatsApp. */

/** Code de démonstration (le backend l'impose en local) ; vide en production. */
const CODE_DEMO = import.meta.env.VITE_CODE_DEMO ?? "";

/** Gris foncé des textes secondaires (contraste d'environ 7:1). */
const GRIS = "#5C5248";

const MESSAGE: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.45,
  margin: 0,
  padding: "10px 14px",
  borderRadius: 14,
};

export const BOUTON_PRINCIPAL: React.CSSProperties = {
  width: "100%",
  minHeight: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  border: 0,
  borderRadius: 999,
  background: "var(--color-accent)",
  color: "#fff",
  font: "inherit",
  fontSize: "17px",
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(227,90,27,.22)",
};

const LIEN_ORANGE: React.CSSProperties = {
  minHeight: 44,
  padding: 0,
  background: "none",
  border: 0,
  cursor: "pointer",
  font: "inherit",
  fontSize: "14.5px",
  fontWeight: 600,
  color: "var(--color-accent-700)",
};

/** Cadre plein écran commun aux deux pages, avec la bascule Connexion | Inscription. */
export function CadreAuth({
  mode,
  titre,
  sousTitre,
  telephone,
  children,
}: {
  mode: "connexion" | "inscription";
  titre: string;
  sousTitre: string;
  /** Numéro déjà saisi, repris quand on bascule vers l'autre page. */
  telephone: string;
  children: ReactNode;
}) {
  const { go } = useApp();

  return (
    <main
      data-r="page-auth"
      style={{
        minHeight: "100vh",
        padding: "calc(16px + env(safe-area-inset-top)) 24px 40px",
        display: "flex",
        justifyContent: "center",
        // Halos chauds discrets, comme sur la maquette.
        background:
          "radial-gradient(60% 40% at 100% 18%, rgba(227,90,27,.07), transparent 70%), radial-gradient(55% 35% at 0% 96%, rgba(242,183,5,.08), transparent 70%), var(--color-bg)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column" }}>
        <button
          onClick={() => go("home")}
          aria-label="Retour à l'accueil"
          style={{
            alignSelf: "flex-start",
            width: 48,
            height: 48,
            display: "grid",
            placeItems: "center",
            border: 0,
            borderRadius: 999,
            background: "var(--color-neutral-100)",
            boxShadow: "0 4px 14px rgba(26,22,19,.10)",
            color: "var(--color-accent)",
            cursor: "pointer",
          }}
        >
          <Icon name="arrow-left" size={22} strokeWidth={2.25} />
        </button>

        {/* Logo TerraClick sur un halo doux. */}
        <div style={{ position: "relative", alignSelf: "center", margin: "20px 0 12px", width: 132, height: 132, display: "grid", placeItems: "center" }}>
          <span
            aria-hidden="true"
            style={{ position: "absolute", inset: -8, borderRadius: 999, background: "radial-gradient(circle, rgba(26,22,19,.07), transparent 68%)" }}
          />
          <img src={`${import.meta.env.BASE_URL}icons/logo-256.png`} alt="TerraClick" width={112} height={112} style={{ position: "relative" }} />
        </div>

        <h1
          style={{
            margin: 0,
            textAlign: "center",
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: "32px",
            letterSpacing: "-0.01em",
            color: "var(--color-accent)",
          }}
        >
          {titre} <span aria-hidden="true">👋</span>
        </h1>
        <span
          style={{
            alignSelf: "center",
            margin: "12px 0 10px",
            padding: "7px 18px",
            borderRadius: 999,
            background: "var(--state-info-soft)",
            color: "var(--state-info)",
            fontSize: "15px",
            fontWeight: 600,
          }}
        >
          Espace Client
        </span>
        <p style={{ margin: "0 0 22px", textAlign: "center", fontSize: "16px", color: GRIS }}>{sousTitre}</p>

        {/* Bascule Connexion | Inscription. */}
        <div
          role="tablist"
          aria-label="Connexion ou inscription"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: 6, borderRadius: 999, background: "var(--color-surface)", marginBottom: 28 }}
        >
          {(["connexion", "inscription"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => mode !== m && go(m, { telDraft: telephone })}
              style={{
                minHeight: 48,
                border: 0,
                borderRadius: 999,
                background: mode === m ? "var(--color-neutral-100)" : "transparent",
                boxShadow: mode === m ? "0 2px 8px rgba(26,22,19,.08)" : "none",
                color: mode === m ? "var(--color-accent-700)" : "var(--color-text)",
                font: "inherit",
                fontSize: "16px",
                fontWeight: 600,
                cursor: mode === m ? "default" : "pointer",
              }}
            >
              {m === "connexion" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>{children}</div>
      </div>
    </main>
  );
}

/**
 * Champ arrondi : étiquette posée sur la bordure, icône dans une pastille orange à gauche,
 * élément facultatif à droite (œil, chevron).
 */
export function ChampIcone({ id, libelle, icone, droite, children }: { id: string; libelle: string; icone: string; droite?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      <label
        htmlFor={id}
        style={{ position: "absolute", top: -10, left: 26, zIndex: 1, padding: "0 6px", background: "var(--color-bg)", fontSize: "13.5px", color: GRIS, lineHeight: "20px" }}
      >
        {libelle}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          minHeight: 66,
          padding: "8px 16px 8px 10px",
          borderRadius: 33,
          border: "1.5px solid var(--color-divider)",
          background: "var(--color-neutral-100)",
        }}
      >
        <span style={{ width: 46, height: 46, flex: "none", borderRadius: 14, background: "var(--color-accent-100)", color: "var(--color-accent)", display: "grid", placeItems: "center" }}>
          <Icon name={icone} size={22} strokeWidth={2} />
        </span>
        {children}
        {droite}
      </div>
    </div>
  );
}

/** Style des champs de saisie et listes placés dans ChampIcone. */
export const SAISIE: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 44,
  border: 0,
  outline: "none",
  background: "none",
  font: "inherit",
  fontSize: "17px",
  letterSpacing: "0.02em",
  color: "var(--color-text)",
};

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

/** Numéro de téléphone (Côte d'Ivoire). */
export function ChampTelephone({ valeur, onChange, onValider }: { valeur: string; onChange: (v: string) => void; onValider?: () => void }) {
  return (
    <ChampIcone id="auth-telephone" libelle="Numéro de téléphone" icone="phone">
      <input
        id="auth-telephone"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onValider?.()}
        placeholder="07 00 00 00 00"
        inputMode="tel"
        autoComplete="tel-national"
        style={SAISIE}
      />
    </ChampIcone>
  );
}

/** Canal du code : SMS ou WhatsApp, en deux pastilles. */
export function ChoixCanal({ valeur, onChange }: { valeur: Canal; onChange: (c: Canal) => void }) {
  return (
    <div>
      <span style={{ display: "block", margin: "0 0 8px 8px", fontSize: "13.5px", color: GRIS }}>Recevoir le code par</span>
      <div role="radiogroup" aria-label="Recevoir le code par" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {(
          [
            ["sms", "SMS", "message-square"],
            ["whatsapp", "WhatsApp", "message-circle"],
          ] as const
        ).map(([v, libelle, icone]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={valeur === v}
            onClick={() => onChange(v)}
            style={{
              minHeight: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 999,
              border: `1.5px solid ${valeur === v ? "var(--color-accent)" : "var(--color-divider)"}`,
              background: valeur === v ? "var(--color-accent-100)" : "var(--color-neutral-100)",
              color: valeur === v ? "var(--color-accent-700)" : "var(--color-text)",
              font: "inherit",
              fontSize: "15.5px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Icon name={icone} size={18} />
            {libelle}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Saisie du code reçu (à la place du mot de passe de la maquette), renvoi et changement de numéro. */
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
  const [visible, setVisible] = useState(false);
  const remplirDemo = () => {
    onCode(CODE_DEMO);
    onValider(CODE_DEMO);
  };

  return (
    <>
      <ChampIcone id="auth-telephone-lu" libelle="Numéro de téléphone" icone="phone">
        <input id="auth-telephone-lu" value={telephone} readOnly style={{ ...SAISIE, color: GRIS }} />
        <button type="button" onClick={onChangerNumero} style={{ ...LIEN_ORANGE, flex: "none" }}>
          Modifier
        </button>
      </ChampIcone>

      <ChampIcone
        id="auth-code"
        libelle={`Code reçu par ${canal === "whatsapp" ? "WhatsApp" : "SMS"}`}
        icone="lock"
        droite={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Masquer le code" : "Afficher le code"}
            style={{ flex: "none", width: 44, height: 44, display: "grid", placeItems: "center", border: 0, background: "none", color: GRIS, cursor: "pointer" }}
          >
            <Icon name={visible ? "eye" : "eye-off"} size={22} />
          </button>
        }
      >
        <input
          id="auth-code"
          type={visible ? "text" : "password"}
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
          style={{ ...SAISIE, letterSpacing: "0.3em" }}
        />
      </ChampIcone>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -10 }}>
        <button type="button" onClick={onRenvoyer} disabled={occupe} style={LIEN_ORANGE}>
          Renvoyer le code
        </button>
      </div>

      {CODE_DEMO && (
        <button
          type="button"
          onClick={remplirDemo}
          style={{ ...MESSAGE, border: "1px dashed var(--color-divider)", background: "var(--color-surface)", cursor: "pointer", font: "inherit", textAlign: "left", color: GRIS }}
        >
          TerraClick : votre code est {CODE_DEMO.slice(0, 3)} {CODE_DEMO.slice(3, 4)}•• — appuyer pour remplir
        </button>
      )}

      <button type="button" onClick={() => onValider()} disabled={occupe} aria-busy={occupe} style={{ ...BOUTON_PRINCIPAL, opacity: occupe ? 0.7 : 1 }}>
        {occupe ? "Vérification…" : libelleValider}
        {!occupe && <Icon name="arrow-right" size={20} strokeWidth={2.25} />}
      </button>
    </>
  );
}
