import { useEffect, useState } from "react";
import { useApp } from "../state/app";
import { api, jeton, type Utilisateur } from "../lib/api";
import { slugifier } from "../lib/annuaire";
import { useApi } from "../lib/useApi";
import { useCodeConnexion, type Canal } from "../lib/useCodeConnexion";
import { Icon } from "../components/Icon";
import { Alerte, CadreAuth, ChampTelephone, ChoixCanal, EtapeCode, LienBas } from "../components/AuthPage";

const GRILLE: React.CSSProperties = {
  display: "grid",
  gap: 14,
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
};

/**
 * Page d'inscription. Le formulaire est rempli d'abord, puis le numéro est vérifié
 * par code ; le profil n'est enregistré qu'une fois le numéro prouvé. Pas de mot
 * de passe. Un numéro déjà inscrit est simplement connecté.
 */
export function Inscription() {
  const { etat, go, terminerAuth, ville } = useApp();
  const otp = useCodeConnexion();
  const { donnees: villes } = useApi(() => api.villes(), []);

  const [etape, setEtape] = useState<"formulaire" | "code">("formulaire");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState(etat.telDraft);
  const [email, setEmail] = useState("");
  const [villeId, setVilleId] = useState<number | null>(null);
  const [quartierId, setQuartierId] = useState<number | null>(null);
  const [cgu, setCgu] = useState(false);
  const [canal, setCanal] = useState<Canal>("sms");
  const [code, setCode] = useState("");
  /** Compte dont le numéro est déjà vérifié mais le profil vide (venu de la connexion). */
  const [compte, setCompte] = useState<Utilisateur | null>(null);

  // La ville proposée par défaut est celle choisie dans l'en-tête.
  useEffect(() => {
    if (villes && villeId === null) setVilleId(villes.find((v) => v.slug === slugifier(ville))?.id ?? villes[0]?.id ?? null);
  }, [villes, villeId, ville]);

  // Session ouverte sans profil : on saute la vérification du numéro.
  useEffect(() => {
    if (!jeton.lire() || etat.auth) return;
    api
      .moi()
      .then((u) => {
        if (u.profil_complet) return;
        setCompte(u);
        setTelephone(u.telephone_affichage);
      })
      .catch(() => {});
  }, [etat.auth]);

  const quartiers = villes?.find((v) => v.id === villeId)?.quartiers ?? [];

  const enregistrerProfil = async (u: Utilisateur) => {
    const profil = await otp.appeler(
      () => api.modifierProfil({ nom: nom.trim(), email: email.trim() || null, ville_id: villeId, quartier_id: quartierId }),
      "email",
    );
    if (profil) {
      terminerAuth(profil);
      go("clientDashboard");
    } else {
      // Numéro déjà prouvé : une correction du formulaire suffit, sans nouveau code.
      setCompte(u);
      setEtape("formulaire");
    }
  };

  const soumettre = async () => {
    if (nom.trim().length < 2) return otp.setErreur("Indiquez votre prénom et votre nom.");
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return otp.setErreur("Cette adresse e-mail n'est pas valide.");
    if (!cgu) return otp.setErreur("Acceptez les conditions d'utilisation pour créer votre compte.");

    if (compte) return enregistrerProfil(compte);
    if (await otp.envoyerCode(telephone, canal)) {
      setCode("");
      setEtape("code");
    }
  };

  const valider = async (saisi = code) => {
    const utilisateur = await otp.verifierCode(telephone, saisi);
    if (!utilisateur) {
      setCode("");
      return;
    }
    // Numéro déjà inscrit : on connecte sans écraser le profil existant.
    if (utilisateur.profil_complet) {
      terminerAuth(utilisateur);
      go("clientDashboard");
      return;
    }
    await enregistrerProfil(utilisateur);
  };

  return (
    <CadreAuth
      titre="Créer un compte"
      sousTitre="Votre numéro sert à vous joindre pour vos demandes. Il n'est jamais publié."
      largeur={540}
    >
      {etape === "formulaire" ? (
        <>
          {compte && (
            <Alerte erreur={null} info={`Numéro ${compte.telephone_affichage} vérifié. Il ne reste qu'à compléter votre profil.`} />
          )}
          <div style={GRILLE}>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="insc-nom">
                Nom complet
              </label>
              <input
                id="insc-nom"
                className="sy-input"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Awa Koné"
                autoComplete="name"
              />
            </div>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="insc-email">
                E-mail (facultatif)
              </label>
              <input
                id="insc-email"
                className="sy-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="awa.kone@exemple.ci"
                autoComplete="email"
              />
            </div>
          </div>

          {!compte && <ChampTelephone valeur={telephone} onChange={setTelephone} aide={false} />}

          <div style={GRILLE}>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="insc-ville">
                Ville
              </label>
              <div className="sy-select-wrap">
                <select
                  id="insc-ville"
                  className="sy-select"
                  value={villeId ?? ""}
                  onChange={(e) => {
                    setVilleId(Number(e.target.value) || null);
                    setQuartierId(null);
                  }}
                >
                  {villes?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nom}
                    </option>
                  ))}
                </select>
                <span className="sy-select-wrap__caret">
                  <Icon name="chevron-down" size={18} />
                </span>
              </div>
            </div>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="insc-quartier">
                Quartier
              </label>
              <div className="sy-select-wrap">
                <select
                  id="insc-quartier"
                  className="sy-select"
                  value={quartierId ?? ""}
                  onChange={(e) => setQuartierId(Number(e.target.value) || null)}
                  disabled={quartiers.length === 0}
                >
                  <option value="">{quartiers.length ? "Choisir plus tard" : "Bientôt disponible"}</option>
                  {quartiers.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.nom}
                    </option>
                  ))}
                </select>
                <span className="sy-select-wrap__caret">
                  <Icon name="chevron-down" size={18} />
                </span>
              </div>
            </div>
          </div>

          {!compte && <ChoixCanal valeur={canal} onChange={setCanal} />}

          <label className="sy-choice">
            <input type="checkbox" checked={cgu} onChange={(e) => setCgu(e.target.checked)} />
            <span className="sy-choice__box sy-choice__box--check">
              {cgu && <Icon name="check" size={14} strokeWidth={3} />}
            </span>
            J'accepte les conditions d'utilisation et la politique de confidentialité de Servis Yakro
          </label>

          <Alerte erreur={otp.erreur} />
          <button
            type="button"
            onClick={soumettre}
            disabled={otp.occupe}
            aria-busy={otp.occupe}
            className="sy-btn sy-btn--primary sy-btn--lg sy-btn--block"
          >
            {otp.occupe ? "Un instant…" : compte ? "Terminer mon inscription" : "Créer mon compte"}
          </button>
          {!compte && (
            <p style={{ margin: 0, fontSize: "12.5px", lineHeight: 1.5, color: "var(--text-muted)" }}>
              Un code de vérification vous est envoyé. Pas de mot de passe à retenir.
            </p>
          )}
        </>
      ) : (
        <>
          <EtapeCode
            telephone={telephone}
            canal={otp.canalEnvoye}
            code={code}
            onCode={setCode}
            onValider={(c) => valider(c)}
            onRenvoyer={() => otp.envoyerCode(telephone, canal)}
            onChangerNumero={() => {
              otp.setErreur(null);
              setEtape("formulaire");
            }}
            occupe={otp.occupe}
            libelleValider="Vérifier et créer mon compte"
          />
          <Alerte erreur={otp.erreur} info={otp.info} />
        </>
      )}
      <LienBas texte="Vous avez déjà un compte ?" action="Se connecter" onClick={() => go("connexion", { telDraft: telephone })} />
    </CadreAuth>
  );
}
