import { useEffect, useState } from "react";
import { useApp } from "../state/app";
import { api, jeton, type Utilisateur } from "../lib/api";
import { slugifier } from "../lib/annuaire";
import { useApi } from "../lib/useApi";
import { useCodeConnexion, type Canal } from "../lib/useCodeConnexion";
import { Icon } from "../components/Icon";
import { Alerte, BOUTON_PRINCIPAL, CadreAuth, ChampIcone, ChampTelephone, ChoixCanal, EtapeCode, SAISIE } from "../components/AuthPage";

/**
 * Page d'inscription. Le formulaire est rempli d'abord, puis le numéro est vérifié par code ;
 * le profil n'est enregistré (dans la base du serveur, via l'API) qu'une fois le numéro prouvé.
 * Pas de mot de passe. Un numéro déjà inscrit est simplement connecté.
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
      go(etat.apresConnexion);
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
      go(etat.apresConnexion);
      return;
    }
    await enregistrerProfil(utilisateur);
  };

  const chevron = <Icon name="chevron-down" size={20} color="#5C5248" style={{ flex: "none", pointerEvents: "none" }} />;

  return (
    <CadreAuth mode="inscription" titre="Bienvenue" sousTitre="Créez votre compte en quelques secondes." telephone={telephone}>
      {etape === "formulaire" ? (
        <>
          {compte && <Alerte erreur={null} info={`Numéro ${compte.telephone_affichage} vérifié. Il ne reste qu'à compléter votre profil.`} />}

          <ChampIcone id="insc-nom" libelle="Nom complet" icone="user">
            <input id="insc-nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Awa Koné" autoComplete="name" style={SAISIE} />
          </ChampIcone>

          {!compte && <ChampTelephone valeur={telephone} onChange={setTelephone} />}

          <ChampIcone id="insc-email" libelle="E-mail (facultatif)" icone="mail">
            <input
              id="insc-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="awa.kone@exemple.ci"
              autoComplete="email"
              style={SAISIE}
            />
          </ChampIcone>

          <ChampIcone id="insc-ville" libelle="Ville" icone="map-pin" droite={chevron}>
            <select
              id="insc-ville"
              value={villeId ?? ""}
              onChange={(e) => {
                setVilleId(Number(e.target.value) || null);
                setQuartierId(null);
              }}
              style={{ ...SAISIE, appearance: "none", cursor: "pointer" }}
            >
              {villes?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nom}
                </option>
              ))}
            </select>
          </ChampIcone>

          <ChampIcone id="insc-quartier" libelle="Quartier" icone="home" droite={chevron}>
            <select
              id="insc-quartier"
              value={quartierId ?? ""}
              onChange={(e) => setQuartierId(Number(e.target.value) || null)}
              disabled={quartiers.length === 0}
              style={{ ...SAISIE, appearance: "none", cursor: "pointer" }}
            >
              <option value="">{quartiers.length ? "Choisir plus tard" : "Bientôt disponible"}</option>
              {quartiers.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.nom}
                </option>
              ))}
            </select>
          </ChampIcone>

          {!compte && <ChoixCanal valeur={canal} onChange={setCanal} />}

          <label className="sy-choice">
            <input type="checkbox" checked={cgu} onChange={(e) => setCgu(e.target.checked)} />
            <span className="sy-choice__box sy-choice__box--check">{cgu && <Icon name="check" size={14} strokeWidth={3} />}</span>
            J'accepte les conditions d'utilisation et la politique de confidentialité de TerraClick
          </label>

          <Alerte erreur={otp.erreur} />
          <button type="button" onClick={soumettre} disabled={otp.occupe} aria-busy={otp.occupe} style={{ ...BOUTON_PRINCIPAL, opacity: otp.occupe ? 0.7 : 1 }}>
            {otp.occupe ? "Un instant…" : compte ? "Terminer mon inscription" : "Créer mon compte"}
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
    </CadreAuth>
  );
}
