import { useState } from "react";
import { useApp } from "../state/app";
import { api, jeton } from "../lib/api";
import { CONFIG } from "../lib/config";
import { useCodeConnexion, type Canal } from "../lib/useCodeConnexion";
import { Icon } from "../components/Icon";
import {
  Alerte,
  BOUTON_PRINCIPAL,
  CadreAuth,
  ChampMotDePasse,
  ChampTelephone,
  ChoixCanal,
  EtapeCode,
  LienAuth,
  erreurMotDePasse,
} from "../components/AuthPage";

/**
 * Page de connexion. Avec CONFIG.motDePasse : numéro et mot de passe, et « Mot de passe
 * oublié » (nouveau mot de passe, prouvé par un code reçu). Sinon, connexion par code seul.
 * Le compte est dans la base du serveur : on se connecte depuis n'importe quel appareil.
 */
export function Connexion() {
  return CONFIG.motDePasse ? <ConnexionMotDePasse /> : <ConnexionParCode />;
}

function ConnexionMotDePasse() {
  const { etat, go, terminerAuth } = useApp();
  const otp = useCodeConnexion();
  const [etape, setEtape] = useState<"connexion" | "oubli" | "code">("connexion");
  const [telephone, setTelephone] = useState(etat.telDraft);
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [canal, setCanal] = useState<Canal>("sms");
  const [code, setCode] = useState("");

  const telephoneValide = () => {
    if (telephone.replace(/\D/g, "").length >= 8) return true;
    otp.setErreur("Saisissez les 10 chiffres de votre numéro.");
    return false;
  };

  const seConnecter = async () => {
    if (!telephoneValide()) return;
    if (!motDePasse) return otp.setErreur("Saisissez votre mot de passe.");
    const session = await otp.appeler(() => api.connecter(telephone, motDePasse), "mot_de_passe");
    if (!session) return;
    jeton.ecrire(session.token);
    terminerAuth(session.utilisateur);
    go(etat.apresConnexion);
  };

  /** « Mot de passe oublié » : le nouveau mot de passe d'abord, puis le code qui prouve le numéro. */
  const demanderCode = async () => {
    if (!telephoneValide()) return;
    const faible = erreurMotDePasse(motDePasse, confirmation);
    if (faible) return otp.setErreur(faible);
    if (await otp.envoyerCode(telephone, canal)) {
      setCode("");
      setEtape("code");
    }
  };

  const reinitialiser = async (saisi = code) => {
    if (saisi.replace(/\D/g, "").length < 6) return otp.setErreur("Le code comporte 6 chiffres.");
    const session = await otp.appeler(() => api.reinitialiserMotDePasse(telephone, saisi, motDePasse, confirmation), "code");
    if (!session) {
      setCode("");
      return;
    }
    jeton.ecrire(session.token);
    terminerAuth(session.utilisateur);
    go(etat.apresConnexion);
  };

  const versOubli = () => {
    otp.setErreur(null);
    setMotDePasse("");
    setConfirmation("");
    setEtape("oubli");
  };

  if (etape === "code") {
    return (
      <CadreAuth mode="connexion" titre="Nouveau mot de passe" sousTitre="Confirmez avec le code reçu." telephone={telephone}>
        <EtapeCode
          telephone={telephone}
          canal={otp.canalEnvoye}
          code={code}
          onCode={setCode}
          onValider={(c) => reinitialiser(c)}
          onRenvoyer={() => otp.envoyerCode(telephone, canal)}
          onChangerNumero={() => {
            otp.setErreur(null);
            setEtape("oubli");
          }}
          occupe={otp.occupe}
          libelleValider="Changer mon mot de passe"
        />
        <Alerte erreur={otp.erreur} info={otp.info} />
      </CadreAuth>
    );
  }

  if (etape === "oubli") {
    return (
      <CadreAuth mode="connexion" titre="Mot de passe oublié" sousTitre="Choisissez un nouveau mot de passe." telephone={telephone}>
        <ChampTelephone valeur={telephone} onChange={setTelephone} />
        <ChampMotDePasse id="oubli-mdp" libelle="Nouveau mot de passe" valeur={motDePasse} onChange={setMotDePasse} nouveau />
        <ChampMotDePasse
          id="oubli-mdp-confirmation"
          libelle="Confirmer le mot de passe"
          valeur={confirmation}
          onChange={setConfirmation}
          onValider={demanderCode}
          nouveau
        />
        <ChoixCanal valeur={canal} onChange={setCanal} />
        <Alerte erreur={otp.erreur} />
        <button type="button" onClick={demanderCode} disabled={otp.occupe} aria-busy={otp.occupe} style={{ ...BOUTON_PRINCIPAL, opacity: otp.occupe ? 0.7 : 1 }}>
          {otp.occupe ? "Envoi du code…" : "Recevoir mon code"}
          {!otp.occupe && <Icon name="arrow-right" size={20} strokeWidth={2.25} />}
        </button>
        <div style={{ display: "flex", justifyContent: "center", marginTop: -8 }}>
          <LienAuth
            onClick={() => {
              otp.setErreur(null);
              setMotDePasse("");
              setEtape("connexion");
            }}
          >
            Retour à la connexion
          </LienAuth>
        </div>
      </CadreAuth>
    );
  }

  return (
    <CadreAuth mode="connexion" sousTitre="Heureux de vous revoir !" telephone={telephone}>
      <ChampTelephone
        valeur={telephone}
        onChange={(v) => {
          otp.setErreur(null);
          setTelephone(v);
        }}
      />
      <ChampMotDePasse id="connexion-mdp" libelle="Mot de passe" valeur={motDePasse} onChange={setMotDePasse} onValider={seConnecter} />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -10 }}>
        <LienAuth onClick={versOubli}>Mot de passe oublié ?</LienAuth>
      </div>
      <Alerte erreur={otp.erreur} />
      <button type="button" onClick={seConnecter} disabled={otp.occupe} aria-busy={otp.occupe} style={{ ...BOUTON_PRINCIPAL, opacity: otp.occupe ? 0.7 : 1 }}>
        {otp.occupe ? "Connexion…" : "Se connecter"}
        {!otp.occupe && <Icon name="arrow-right" size={20} strokeWidth={2.25} />}
      </button>
    </CadreAuth>
  );
}

/** Connexion par code seul, sans mot de passe (CONFIG.motDePasse à `false`). */
function ConnexionParCode() {
  const { etat, go, terminerAuth } = useApp();
  const otp = useCodeConnexion();
  const [etape, setEtape] = useState<"tel" | "code">("tel");
  const [telephone, setTelephone] = useState(etat.telDraft);
  const [canal, setCanal] = useState<Canal>("sms");
  const [code, setCode] = useState("");

  const envoyer = async () => {
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
    if (utilisateur.profil_complet) {
      terminerAuth(utilisateur);
      go(etat.apresConnexion);
    } else {
      // Numéro vérifié mais sans profil : l'inscription reprend à cette étape.
      go("inscription", { telDraft: telephone });
    }
  };

  return (
    <CadreAuth mode="connexion" sousTitre="Heureux de vous revoir !" telephone={telephone}>
      {etape === "tel" ? (
        <>
          <ChampTelephone
            valeur={telephone}
            onChange={(v) => {
              otp.setErreur(null);
              setTelephone(v);
            }}
            onValider={envoyer}
          />
          <ChoixCanal valeur={canal} onChange={setCanal} />
          <Alerte erreur={otp.erreur} />
          <button type="button" onClick={envoyer} disabled={otp.occupe} aria-busy={otp.occupe} style={{ ...BOUTON_PRINCIPAL, opacity: otp.occupe ? 0.7 : 1 }}>
            {otp.occupe ? "Envoi du code…" : "Recevoir mon code"}
            {!otp.occupe && <Icon name="arrow-right" size={20} strokeWidth={2.25} />}
          </button>
        </>
      ) : (
        <>
          <EtapeCode
            telephone={telephone}
            canal={otp.canalEnvoye}
            code={code}
            onCode={setCode}
            onValider={(c) => valider(c)}
            onRenvoyer={envoyer}
            onChangerNumero={() => {
              otp.setErreur(null);
              setEtape("tel");
            }}
            occupe={otp.occupe}
            libelleValider="Se connecter"
          />
          <Alerte erreur={otp.erreur} info={otp.info} />
        </>
      )}
    </CadreAuth>
  );
}
