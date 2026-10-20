import { useState } from "react";
import { useApp } from "../state/app";
import { useCodeConnexion, type Canal } from "../lib/useCodeConnexion";
import { Icon } from "../components/Icon";
import { Alerte, BOUTON_PRINCIPAL, CadreAuth, ChampTelephone, ChoixCanal, EtapeCode } from "../components/AuthPage";

/**
 * Page de connexion. Pas de mot de passe : le numéro est prouvé par un code reçu par SMS ou
 * WhatsApp. Le compte est retrouvé (ou créé) par l'API, dans la base du serveur : on se
 * connecte depuis n'importe quel appareil. Un numéro inconnu est dirigé vers l'inscription.
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
      go(etat.apresConnexion);
    } else {
      // Numéro vérifié mais sans profil : l'inscription reprend à cette étape.
      go("inscription", { telDraft: telephone });
    }
  };

  return (
    <CadreAuth mode="connexion" titre="Bienvenue" sousTitre="Heureux de vous revoir !" telephone={telephone}>
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
