import { useState } from "react";
import { useApp } from "../state/app";
import { api, ErreurApi, jeton, messageErreur } from "../lib/api";
import { CONFIG } from "../lib/config";
import { useApi } from "../lib/useApi";
import { canal } from "./ui";
import { Icon } from "./Icon";

const TOUCHES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"];

/** Code de démonstration (le backend l'impose en local) ; vide en production. */
const CODE_DEMO = import.meta.env.VITE_CODE_DEMO ?? "";

const LIEN_FEUILLE: React.CSSProperties = {
  minHeight: 40,
  padding: 0,
  background: "none",
  border: 0,
  cursor: "pointer",
  font: "inherit",
  fontSize: "14px",
  fontWeight: 600,
  color: "var(--color-accent-700)",
};

const ALERTE: React.CSSProperties = {
  fontSize: "13.5px",
  lineHeight: 1.45,
  margin: 0,
  padding: "10px 12px",
  borderRadius: "var(--radius-md)",
  background: "var(--state-danger-soft)",
  color: "var(--state-danger)",
};

/**
 * Feuille d'authentification.
 *
 * Avec CONFIG.motDePasse : numéro et mot de passe ; « Mot de passe oublié » et « Créer un
 * compte » mènent aux pages dédiées. Sinon (connexion par code seul, masquée) :
 * un seul parcours : le système regarde si le numéro existe déjà et décide
 * lui-même s'il s'agit d'une inscription ou d'une connexion. Pas de mot de passe,
 * donc pas de « mot de passe oublié » ni d'écran « déjà un compte ? ». Le mur ne
 * tombe qu'au moment d'agir — chercher et consulter restent libres.
 */
export function AuthSheet() {
  const { etat, set, go, terminerAuth } = useApp();
  const [erreur, setErreur] = useState<string | null>(null);
  const [motDePasse, setMotDePasse] = useState("");
  /** Information non bloquante, par exemple le passage de WhatsApp au SMS. */
  const [info, setInfo] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  // Quartiers proposés au profil : ceux de Yamoussoukro, servis par l'API.
  const { donnees: villes } = useApi(() => api.villes(), []);
  const quartiers = villes?.find((v) => v.slug === "yamoussoukro")?.quartiers ?? [];

  if (!etat.authOpen) return null;

  const chiffres = (etat.telDraft || "").replace(/\D/g, "");

  const fermer = () => {
    setErreur(null);
    setInfo(null);
    set({ authOpen: false });
  };

  /** Lance un appel en affichant l'attente, et son message d'erreur s'il échoue. */
  const appeler = async (action: () => Promise<void>, champ?: string) => {
    if (occupe) return;
    setOccupe(true);
    setErreur(null);
    try {
      await action();
    } catch (e) {
      setErreur(e instanceof ErreurApi && champ ? e.pour(champ) : messageErreur(e));
    } finally {
      setOccupe(false);
    }
  };

  const envoyerCode = () => {
    if (chiffres.length < 8) {
      setErreur("Saisissez les 10 chiffres de votre numéro.");
      return;
    }
    appeler(async () => {
      const envoi = await api.demanderCode(etat.telDraft, etat.authCanal);
      // Le serveur peut avoir changé de canal : l'écran suivant dit où chercher le code.
      setInfo(envoi.repli ? "WhatsApp n'a pas pu être joint : votre code vous a été envoyé par SMS." : null);
      set({ authStep: "code", code: "", authCanal: envoi.canal });
    }, "telephone");
  };

  const validerCode = (code?: string) => {
    const saisi = code ?? etat.code;
    if (saisi.length < 6) return;
    appeler(async () => {
      try {
        const { token, utilisateur } = await api.verifierCode(etat.telDraft, saisi);
        jeton.ecrire(token);
        // Numéro déjà connu : connexion immédiate, la création de profil est sautée.
        if (utilisateur.profil_complet) terminerAuth(utilisateur);
        else set({ authStep: "profil", prenomDraft: "" });
      } catch (e) {
        set({ code: "" });
        throw e;
      }
    }, "code");
  };

  const terminerProfil = () => {
    if (etat.prenomDraft.trim().length < 2) {
      setErreur("Indiquez votre prénom et votre nom.");
      return;
    }
    const quartier = quartiers.find((q) => q.nom === etat.quartierDraft);
    appeler(async () => {
      terminerAuth(await api.modifierProfil({ nom: etat.prenomDraft.trim(), quartier_id: quartier?.id ?? null }));
    }, "nom");
  };

  /** Avec mot de passe : numéro et mot de passe, puis l'action interrompue reprend. */
  const seConnecter = () => {
    if (chiffres.length < 8) {
      setErreur("Saisissez les 10 chiffres de votre numéro.");
      return;
    }
    if (!motDePasse) {
      setErreur("Saisissez votre mot de passe.");
      return;
    }
    appeler(async () => {
      const { token, utilisateur } = await api.connecter(etat.telDraft, motDePasse);
      jeton.ecrire(token);
      setMotDePasse("");
      terminerAuth(utilisateur);
    }, "mot_de_passe");
  };

  /** « Mot de passe oublié » et « Créer un compte » ouvrent les pages dédiées, puis ramènent ici. */
  const versPage = (ecran: "connexion" | "inscription") => {
    setErreur(null);
    go(ecran, { authOpen: false, apresConnexion: etat.screen });
  };

  const taper = (d: string) => {
    const code = (etat.code + d).slice(0, 6);
    set({ code });
    if (code.length === 6) window.setTimeout(() => validerCode(code), 220);
  };

  const autoRemplir = () => {
    set({ code: CODE_DEMO });
    window.setTimeout(() => validerCode(CODE_DEMO), 260);
  };

  const alerte = erreur && (
    <p role="alert" style={ALERTE}>
      {erreur}
    </p>
  );

  const caseCode = (rempli: number, index: number) => ({
    height: 52,
    borderRadius: "var(--radius-md)",
    display: "grid" as const,
    placeItems: "center" as const,
    fontFamily: "var(--font-heading)",
    fontWeight: 700,
    fontSize: "22px",
    border: rempli === index ? "1.5px solid var(--color-accent)" : "1.5px solid var(--border-subtle)",
    background: rempli === index ? "var(--kola-50)" : "var(--surface-card)",
  });

  return (
    <div
      onClick={fermer}
      role="dialog"
      aria-modal="true"
      aria-label="Connexion à TerraClick"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(26,22,19,.52)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 460,
          background: "var(--surface-card)",
          borderRadius: "24px 24px 0 0",
          padding: "20px 22px calc(26px + env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 -10px 40px rgba(26,22,19,.22)",
          maxHeight: "92vh",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ width: 28, flex: "none" }} />
          <span style={{ width: 40, height: 4, borderRadius: "999px", background: "var(--border-subtle)" }} />
          <button
            onClick={fermer}
            aria-label="Fermer"
            style={{
              width: 28,
              height: 28,
              flex: "none",
              display: "grid",
              placeItems: "center",
              background: "none",
              border: 0,
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 0,
            }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {etat.authStep === "tel" && CONFIG.motDePasse && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, letterSpacing: "-0.025em", fontSize: "26px", margin: 0 }}>
              Connectez-vous pour continuer
            </h2>
            <p style={{ fontSize: "14.5px", lineHeight: 1.5, margin: 0, color: "var(--text-muted)" }}>
              Votre numéro et votre mot de passe TerraClick.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <span style={{ display: "flex", alignItems: "center", padding: "0 14px", border: "1.5px solid var(--border-subtle)", borderRadius: "var(--radius-md)", fontSize: "15px", whiteSpace: "nowrap" }}>
                +225
              </span>
              <input
                className="sy-input"
                value={etat.telDraft}
                onChange={(e) => {
                  setErreur(null);
                  set({ telDraft: e.target.value });
                }}
                placeholder="07 00 00 00 00"
                inputMode="numeric"
                autoComplete="tel-national"
                aria-label="Votre numéro de téléphone"
                style={{ flex: 1, minHeight: 50, fontSize: "16px" }}
              />
            </div>
            <input
              className="sy-input"
              type="password"
              value={motDePasse}
              onChange={(e) => {
                setErreur(null);
                setMotDePasse(e.target.value);
              }}
              onKeyDown={(e) => e.key === "Enter" && seConnecter()}
              placeholder="Mot de passe"
              autoComplete="current-password"
              aria-label="Votre mot de passe"
              style={{ minHeight: 50, fontSize: "16px" }}
            />
            {alerte}
            <button
              onClick={seConnecter}
              disabled={occupe}
              aria-busy={occupe}
              className="sy-btn sy-btn--primary sy-btn--md"
              style={{ justifyContent: "center", minHeight: 50, fontSize: "16px" }}
            >
              {occupe ? "Connexion…" : "Se connecter"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => versPage("connexion")} style={LIEN_FEUILLE}>
                Mot de passe oublié ?
              </button>
              <button onClick={() => versPage("inscription")} style={LIEN_FEUILLE}>
                Créer un compte
              </button>
            </div>
          </div>
        )}

        {etat.authStep === "tel" && !CONFIG.motDePasse && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                fontSize: "26px",
                margin: 0,
              }}
            >
              Votre numéro, et c'est parti
            </h2>
            <p style={{ fontSize: "14.5px", lineHeight: 1.5, margin: 0, color: "var(--text-muted)" }}>
              Pas de mot de passe. Le même numéro sert à créer le compte et à se reconnecter.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
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
                className="sy-input"
                value={etat.telDraft}
                onChange={(e) => {
                  setErreur(null);
                  set({ telDraft: e.target.value });
                }}
                onKeyDown={(e) => e.key === "Enter" && envoyerCode()}
                placeholder="07 00 00 00 00"
                inputMode="numeric"
                aria-label="Votre numéro de téléphone"
                style={{ flex: 1, minHeight: 50, fontSize: "16px" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => set({ authCanal: "sms" })} style={canal(etat.authCanal === "sms")}>
                <Icon name="message-square" size={20} color="var(--kola-600)" />
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: "14.5px" }}>Code par SMS</span>
                  <span style={{ display: "block", fontSize: "12.5px", color: "var(--text-muted)" }}>
                    Fonctionne sans internet
                  </span>
                </span>
              </button>
              <button onClick={() => set({ authCanal: "whatsapp" })} style={canal(etat.authCanal === "whatsapp")}>
                <Icon name="message-circle" size={20} color="var(--kola-600)" />
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: "14.5px" }}>Code par WhatsApp</span>
                  <span style={{ display: "block", fontSize: "12.5px", color: "var(--text-muted)" }}>
                    Instantané en wifi, sans crédit
                  </span>
                </span>
              </button>
            </div>
            {alerte}
            <button
              onClick={envoyerCode}
              disabled={occupe}
              aria-busy={occupe}
              className="sy-btn sy-btn--primary sy-btn--md"
              style={{ justifyContent: "center", minHeight: 50, fontSize: "16px" }}
            >
              {occupe ? "Envoi du code…" : "Recevoir mon code"}
            </button>
            <p
              style={{
                fontSize: "12.5px",
                lineHeight: 1.5,
                margin: 0,
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              En continuant, vous acceptez les conditions et la politique de confidentialité.
            </p>
          </div>
        )}

        {etat.authStep === "code" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                fontSize: "26px",
                margin: 0,
              }}
            >
              Entrez le code
            </h2>
            <p style={{ fontSize: "14.5px", margin: 0, color: "var(--text-muted)" }}>
              Envoyé par {etat.authCanal === "whatsapp" ? "WhatsApp" : "SMS"} au {etat.telDraft || "07 00 00 00 00"}.
            </p>
            {info && (
              <p
                role="status"
                style={{
                  fontSize: "13.5px",
                  lineHeight: 1.45,
                  margin: 0,
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--state-info-soft)",
                  color: "var(--state-info)",
                }}
              >
                {info}
              </p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={caseCode(etat.code.length, i)}>
                  {etat.code[i] || ""}
                </div>
              ))}
            </div>
            {CODE_DEMO && (
              <button
                onClick={autoRemplir}
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
                  TerraClick : votre code est {CODE_DEMO.slice(0, 3)} {CODE_DEMO.slice(3, 4)}•• — appuyer pour remplir
                </span>
              </button>
            )}
            {alerte}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {TOUCHES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => (t === "←" ? set({ code: etat.code.slice(0, -1) }) : t && taper(t))}
                  aria-label={t === "←" ? "Effacer" : t || undefined}
                  style={{
                    minHeight: 46,
                    borderRadius: "var(--radius-md)",
                    font: "inherit",
                    fontSize: "19px",
                    cursor: t ? "pointer" : "default",
                    border: t ? "1px solid var(--border-subtle)" : 0,
                    background: t ? "var(--surface-card)" : "transparent",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={() => validerCode()}
              disabled={occupe}
              aria-busy={occupe}
              className="sy-btn sy-btn--primary sy-btn--md"
              style={{ justifyContent: "center", minHeight: 50, fontSize: "16px" }}
            >
              {occupe ? "Vérification…" : "Valider"}
            </button>
            <p style={{ fontSize: "12.5px", margin: 0, color: "var(--text-muted)", textAlign: "center" }}>
              Pas reçu ? Recevoir un appel à la place — les 4 derniers chiffres du numéro appelant font le code.
            </p>
          </div>
        )}

        {etat.authStep === "profil" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                fontSize: "26px",
                margin: 0,
              }}
            >
              Comment on vous appelle ?
            </h2>
            <p style={{ fontSize: "14.5px", margin: 0, color: "var(--text-muted)" }}>
              Le prestataire verra ce nom quand vous le contactez.
            </p>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="auth-prenom">
                Prénom et nom
              </label>
              <input
                id="auth-prenom"
                className="sy-input"
                value={etat.prenomDraft}
                onChange={(e) => set({ prenomDraft: e.target.value })}
                placeholder="Aya Konan"
                style={{ minHeight: 50, fontSize: "16px" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Votre quartier</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {quartiers.map(({ nom: q }) => {
                  const actif = etat.quartierDraft === q;
                  return (
                    <button
                      key={q}
                      onClick={() => set({ quartierDraft: q })}
                      style={{
                        cursor: "pointer",
                        font: "inherit",
                        fontSize: "13px",
                        padding: "7px 14px",
                        borderRadius: "999px",
                        border: actif ? "1.5px solid var(--color-accent)" : "1px solid var(--border-subtle)",
                        background: actif ? "var(--kola-50)" : "var(--surface-card)",
                        color: actif ? "var(--kola-600)" : "var(--text-muted)",
                      }}
                    >
                      {q}
                    </button>
                  );
                })}
              </div>
            </div>
            {alerte}
            <button
              onClick={terminerProfil}
              disabled={occupe}
              aria-busy={occupe}
              className="sy-btn sy-btn--primary sy-btn--md"
              style={{ justifyContent: "center", minHeight: 50, fontSize: "16px" }}
            >
              {occupe ? "Enregistrement…" : "Terminer"}
            </button>
            <p style={{ fontSize: "12.5px", margin: 0, color: "var(--text-muted)", textAlign: "center" }}>
              Photo, email et adresse : plus tard, dans le profil.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
