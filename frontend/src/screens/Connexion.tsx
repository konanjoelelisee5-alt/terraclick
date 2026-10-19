import { useState } from "react";
import { useApp } from "../state/app";
import { useCodeConnexion, type Canal } from "../lib/useCodeConnexion";
import { Alerte, CadreAuth, ChampTelephone, ChoixCanal, EtapeCode, LienBas } from "../components/AuthPage";

/**
 * Page de connexion. Même logique que la feuille d'authentification : pas de mot
 * de passe, le numéro est prouvé par un code. Un numéro inconnu est dirigé vers
 * l'inscription, où il ne reste qu'à compléter le profil.
 */
export function Connexion() {
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
      go("clientDashboard");
    } else {
      // Numéro vérifié mais sans profil : l'inscription reprend à cette étape.
      go("inscription", { telDraft: telephone });
    }
  };

  return (
    <CadreAuth titre="Connexion" sousTitre="Accédez à vos demandes et à vos conversations." largeur={440}>
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
          <button
            type="button"
            onClick={envoyer}
            disabled={otp.occupe}
            aria-busy={otp.occupe}
            className="sy-btn sy-btn--primary sy-btn--lg sy-btn--block"
          >
            {otp.occupe ? "Envoi du code…" : "Recevoir mon code"}
          </button>
          <p style={{ margin: 0, fontSize: "12.5px", lineHeight: 1.5, color: "var(--text-muted)", textAlign: "center" }}>
            Pas de mot de passe : le même numéro sert à créer le compte et à se reconnecter.
          </p>
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
      <LienBas texte="Pas encore de compte ?" action="Créer un compte" onClick={() => go("inscription", { telDraft: telephone })} />
    </CadreAuth>
  );
}
