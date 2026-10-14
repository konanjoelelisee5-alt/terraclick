import { useEffect, useState } from "react";
import { useApp } from "../../state/app";
import { api, ErreurApi, messageErreur, type Utilisateur } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { PREFERENCES_NOTIFICATION } from "../../data/client";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { TITRE_CARTE } from "../pro/EspacePro";
import { EspaceClient } from "./EspaceClient";

const GRILLE: React.CSSProperties = {
  display: "grid",
  gap: 14,
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
};

/** Profil du client, lu et enregistré par l'API (GET et PATCH /api/moi). */
export function ClientProfil() {
  const { terminerAuth } = useApp();
  const toast = useToast();
  const { donnees: villes } = useApi(() => api.villes(), []);
  const [compte, setCompte] = useState<Utilisateur | null>(null);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [villeId, setVilleId] = useState<number | null>(null);
  const [quartierId, setQuartierId] = useState<number | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [preferences, setPreferences] = useState(PREFERENCES_NOTIFICATION);

  useEffect(() => {
    api
      .moi()
      .then((u) => {
        setCompte(u);
        setNom(u.nom ?? "");
        setEmail(u.email ?? "");
        setVilleId(u.ville?.id ?? null);
        setQuartierId(u.quartier?.id ?? null);
      })
      .catch((e) => setErreur(messageErreur(e)));
  }, []);

  const quartiers = villes?.find((v) => v.id === villeId)?.quartiers ?? [];

  const enregistrer = async () => {
    setOccupe(true);
    setErreur(null);
    try {
      const u = await api.modifierProfil({ nom: nom.trim(), email: email.trim() || null, ville_id: villeId, quartier_id: quartierId });
      setCompte(u);
      terminerAuth(u);
      toast("Profil enregistré", "Vos informations sont à jour.");
    } catch (e) {
      setErreur(e instanceof ErreurApi ? (Object.values(e.champs)[0]?.[0] ?? e.message) : messageErreur(e));
    } finally {
      setOccupe(false);
    }
  };

  return (
    <EspaceClient titre="Mon profil" sousTitre="Vos informations et la façon dont nous vous prévenons.">
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 860 }}>
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={TITRE_CARTE}>Mes informations</h2>
            {!compte && !erreur && <p style={{ margin: 0, color: "var(--text-muted)" }}>Chargement…</p>}
            {compte && (
              <>
                <div style={GRILLE}>
                  <div className="sy-field">
                    <label className="sy-field__label" htmlFor="cp-nom">
                      Nom complet
                    </label>
                    <input id="cp-nom" className="sy-input" value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="name" />
                  </div>
                  <div className="sy-field">
                    <label className="sy-field__label" htmlFor="cp-tel">
                      Téléphone
                    </label>
                    <input id="cp-tel" className="sy-input" value={compte.telephone_affichage} readOnly />
                    <span className="sy-field__hint">Il sert à vous connecter : il ne se modifie pas ici.</span>
                  </div>
                  <div className="sy-field">
                    <label className="sy-field__label" htmlFor="cp-email">
                      E-mail (facultatif)
                    </label>
                    <input
                      id="cp-email"
                      className="sy-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <div className="sy-field">
                    <label className="sy-field__label" htmlFor="cp-ville">
                      Ville
                    </label>
                    <div className="sy-select-wrap">
                      <select
                        id="cp-ville"
                        className="sy-select"
                        value={villeId ?? ""}
                        onChange={(e) => {
                          setVilleId(Number(e.target.value) || null);
                          setQuartierId(null);
                        }}
                      >
                        <option value="">Non renseignée</option>
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
                    <label className="sy-field__label" htmlFor="cp-quartier">
                      Quartier
                    </label>
                    <div className="sy-select-wrap">
                      <select
                        id="cp-quartier"
                        className="sy-select"
                        value={quartierId ?? ""}
                        onChange={(e) => setQuartierId(Number(e.target.value) || null)}
                        disabled={quartiers.length === 0}
                      >
                        <option value="">{quartiers.length ? "Non renseigné" : "Bientôt disponible"}</option>
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
              </>
            )}
            {erreur && (
              <p
                role="alert"
                style={{
                  margin: 0,
                  fontSize: "13.5px",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--state-danger-soft)",
                  color: "var(--state-danger)",
                }}
              >
                {erreur}
              </p>
            )}
            {compte && (
              <button
                type="button"
                className="sy-btn sy-btn--primary sy-btn--md"
                style={{ alignSelf: "flex-start" }}
                onClick={enregistrer}
                disabled={occupe}
                aria-busy={occupe}
              >
                {occupe ? "Enregistrement…" : "Enregistrer"}
              </button>
            )}
          </div>
        </div>

        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={TITRE_CARTE}>Préférences de notification</h2>
            {preferences.map((p) => (
              <label key={p.cle} className="sy-choice">
                <input
                  type="checkbox"
                  checked={p.actif}
                  onChange={() => setPreferences((l) => l.map((x) => (x.cle === p.cle ? { ...x, actif: !x.actif } : x)))}
                />
                <span className="sy-choice__box sy-choice__box--check">
                  {p.actif && <Icon name="check" size={14} strokeWidth={3} />}
                </span>
                {p.libelle}
              </label>
            ))}
            <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-muted)" }}>
              Les canaux (SMS, WhatsApp, e-mail) se règlent dans l'onglet « Mon compte ».
            </p>
          </div>
        </div>
      </div>
    </EspaceClient>
  );
}
