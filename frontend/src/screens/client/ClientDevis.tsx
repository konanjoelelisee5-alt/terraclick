import { useState } from "react";
import { useApp } from "../../state/app";
import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { Note, OVERLINE } from "../pro/EspacePro";
import { EspaceClient } from "./EspaceClient";
import { modifierClient, useEtatClient } from "./store";

const GRILLE: React.CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
};

/**
 * Demande de devis adressée à un prestataire choisi (à côté du devis en trois
 * étapes, qui s'adresse à tous les prestataires du quartier).
 */
export function ClientDevis() {
  const { go } = useApp();
  const toast = useToast();
  const { demandes } = useEtatClient();
  const { donnees: pros } = useApi((signal) => api.rechercher({ par_page: 50, tri: "note" }, signal).then((r) => r.data), []);
  const { donnees: villes } = useApi(() => api.villes(), []);
  const quartiers = villes?.find((v) => v.slug === "yamoussoukro")?.quartiers ?? [];

  const [proId, setProId] = useState<number | null>(null);
  const [besoin, setBesoin] = useState("");
  const [quartier, setQuartier] = useState("");
  const [contact, setContact] = useState<"appel" | "whatsapp">("appel");
  const pro = pros?.find((p) => p.id === proId) ?? pros?.[0];

  const envoyer = () => {
    if (!pro) return;
    if (besoin.trim().length < 10) {
      toast("Besoin trop court", "Décrivez le problème en une phrase : le prestataire répondra plus vite.", "danger");
      return;
    }
    const numero = 128 + demandes.filter((d) => d.statut === "En attente").length + 1;
    const ref = `DEV-2026-${String(numero).padStart(5, "0")}`;
    modifierClient((e) => ({
      demandes: [
        {
          ref,
          prestataire: pro.nom,
          initiales: pro.initiales,
          portee: `${pro.metier} · ${quartier || pro.quartier?.nom || "Yamoussoukro"}`,
          statut: "En attente",
          groupe: "En attente",
          ton: "neutral",
          date: "aujourd'hui",
          estimation: "—",
          prochaine: "Attendre la réponse du prestataire",
        },
        ...e.demandes,
      ],
    }));
    toast("Demande envoyée", `${ref} · ${pro.nom} vous répond ${pro.delai_reponse.affichage ? `en ${pro.delai_reponse.affichage}` : "rapidement"}.`);
    go("clientDemandes");
  };

  return (
    <EspaceClient titre="Demander un devis" sousTitre="Décrivez votre besoin, le prestataire répond avec une estimation et un créneau.">
      <div data-r="pro-split">
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="cd-pro">
                Prestataire
              </label>
              <div className="sy-select-wrap">
                <select
                  id="cd-pro"
                  className="sy-select"
                  value={pro?.id ?? ""}
                  onChange={(e) => setProId(Number(e.target.value))}
                  disabled={!pros}
                >
                  {!pros && <option>Chargement…</option>}
                  {pros?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom} · {p.metier}
                    </option>
                  ))}
                </select>
                <span className="sy-select-wrap__caret">
                  <Icon name="chevron-down" size={18} />
                </span>
              </div>
            </div>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="cd-besoin">
                Décrivez votre besoin
              </label>
              <textarea
                id="cd-besoin"
                className="sy-textarea"
                value={besoin}
                onChange={(e) => setBesoin(e.target.value)}
                placeholder="Fuite sous l'évier de la cuisine depuis hier soir."
              />
              <span className="sy-field__hint">Une description précise accélère la réponse.</span>
            </div>
            <div style={GRILLE}>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="cd-quartier">
                  Quartier
                </label>
                <div className="sy-select-wrap">
                  <select id="cd-quartier" className="sy-select" value={quartier} onChange={(e) => setQuartier(e.target.value)}>
                    <option value="">Choisir…</option>
                    {quartiers.map((q) => (
                      <option key={q.id}>{q.nom}</option>
                    ))}
                  </select>
                  <span className="sy-select-wrap__caret">
                    <Icon name="chevron-down" size={18} />
                  </span>
                </div>
              </div>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="cd-date">
                  Date souhaitée
                </label>
                <input id="cd-date" className="sy-input" type="date" />
              </div>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="cd-budget">
                  Budget indicatif
                </label>
                <input id="cd-budget" className="sy-input" placeholder="25 000 F" inputMode="numeric" />
              </div>
            </div>
            <div className="sy-field">
              <span className="sy-field__label">Photos (1 à 3, facultatif)</span>
              <button
                type="button"
                onClick={() => toast("Ajout de photos", "L'envoi de photos arrivera avec l'enregistrement des demandes.", "info")}
                style={{
                  width: 110,
                  aspectRatio: "1",
                  borderRadius: 12,
                  background: "var(--surface-card)",
                  border: "1.5px dashed var(--border-strong)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  cursor: "pointer",
                  color: "var(--kola-600)",
                  font: "inherit",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                <Icon name="image-plus" size={22} />
                Ajouter
              </button>
            </div>
            <div className="sy-field">
              <span className="sy-field__label">Moyen de contact préféré</span>
              <div role="radiogroup" style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                {(["appel", "whatsapp"] as const).map((c) => (
                  <label key={c} className="sy-choice">
                    <input type="radio" name="cd-contact" checked={contact === c} onChange={() => setContact(c)} />
                    <span className="sy-choice__box sy-choice__box--radio">
                      {contact === c && <span className="sy-choice__dot" />}
                    </span>
                    {c === "appel" ? "Appel" : "WhatsApp"}
                  </label>
                ))}
              </div>
            </div>
            <Note>
              Le paiement de la prestation est convenu directement entre vous et le prestataire. Servis Yakro ne
              conserve pas les fonds liés à cette prestation.
            </Note>
            <button type="button" className="sy-btn sy-btn--primary sy-btn--lg" style={{ alignSelf: "flex-start" }} onClick={envoyer} disabled={!pro}>
              Envoyer ma demande
            </button>
          </div>
        </div>

        <aside>
          <div className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={OVERLINE}>Votre prestataire</span>
              {pro ? (
                <>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span
                      style={{
                        width: 52,
                        height: 52,
                        flex: "none",
                        borderRadius: 12,
                        background: "var(--kola-100)",
                        color: "var(--kola-700)",
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "var(--font-heading)",
                        fontWeight: 800,
                        fontSize: "17px",
                      }}
                    >
                      {pro.initiales}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700 }}>{pro.nom}</div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                        {pro.metier}
                        {pro.quartier ? ` · ${pro.quartier.nom}` : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 1, background: "var(--border-subtle)" }} />
                  {pro.verifie && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "14px" }}>
                      <Icon name="shield-check" size={16} color="var(--secondary)" />
                      Profil vérifié
                    </div>
                  )}
                  {pro.delai_reponse.affichage && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "14px" }}>
                      <Icon name="clock" size={16} color="var(--text-muted)" />
                      Répond en {pro.delai_reponse.affichage}
                    </div>
                  )}
                  {pro.prix.affichage && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "14px" }}>
                      <Icon name="wallet" size={16} color="var(--text-muted)" />
                      {pro.prix.affichage}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>Chargement des prestataires…</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </EspaceClient>
  );
}
