import { useEffect, useState } from "react";
import { api, messageErreur, type SignalementAdmin } from "../../lib/api";
import { peut } from "../../lib/acces";
import { useApp } from "../../state/app";
import { Dialogue } from "../../components/Dialogue";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspaceAdmin, Filtres, GRIS, Vide, dateHeure } from "./EspaceAdmin";

/* Signalements des clients (retard, vêtement manquant, technicien pas venu…) : l'équipe joint
   le client et le prestataire, puis marque le signalement traité en notant ce qui a été fait. */

export function AdminSignalements() {
  const toast = useToast();
  const [statut, setStatut] = useState<SignalementAdmin["statut"]>("ouvert");
  const [liste, setListe] = useState<SignalementAdmin[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [traite, setTraite] = useState<SignalementAdmin | null>(null);
  const [reponse, setReponse] = useState("");
  const { etat } = useApp();
  const peutTraiter = peut(etat.auth, "signalements.traiter");

  useEffect(() => {
    const arret = new AbortController();
    setListe(null);
    api.admin.signalements(statut, arret.signal).then(setListe, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e)));
    return () => arret.abort();
  }, [statut]);

  return (
    <EspaceAdmin titre="Signalements" sousTitre="Ce que les clients ont signalé sur une demande ou une commande.">
      <Filtres options={[{ cle: "ouvert" as const, nom: "À traiter" }, { cle: "traite" as const, nom: "Traités" }]} valeur={statut} onChange={setStatut} />
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}
      {liste?.length === 0 && <Vide texte={statut === "ouvert" ? "Aucun signalement à traiter." : "Aucun signalement traité."} />}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))" }}>
        {liste?.map((s) => (
          <article key={s.id} data-r="signalement-admin" className="sy-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="flag" size={17} color="var(--state-danger)" />
              <strong style={{ fontSize: "15.5px", flex: 1 }}>{s.motif_libelle}</strong>
              <span style={{ fontSize: "12.5px", color: GRIS }}>{dateHeure(s.date)}</span>
            </div>
            {s.message && <p style={{ margin: 0, fontSize: "14.5px" }}>« {s.message} »</p>}
            <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: "13.5px" }}>
              {(
                [
                  ["Demande", s.demande ? `${s.demande.reference} · ${s.demande.secteur} · ${s.demande.statut_libelle}` : null],
                  ["Client", [s.client.nom, s.client.telephone].filter(Boolean).join(" · ")],
                  ["Prestataire", s.prestataire ? [s.prestataire.nom, s.prestataire.telephone].filter(Boolean).join(" · ") : null],
                  ["Réponse", s.reponse],
                ] as [string, string | null][]
              )
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} style={{ display: "contents" }}>
                    <dt style={{ color: GRIS }}>{k}</dt>
                    <dd style={{ margin: 0, fontWeight: 600 }}>{v}</dd>
                  </div>
                ))}
            </dl>
            {s.statut === "ouvert" && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                {s.client.telephone && (
                  <a href={`tel:+225${s.client.telephone.replace(/\D/g, "")}`} className="sy-btn sy-btn--outline sy-btn--sm" style={{ gap: 6 }}>
                    <Icon name="phone" size={15} />
                    Client
                  </a>
                )}
                {s.prestataire?.telephone && (
                  <a href={`tel:+225${s.prestataire.telephone.replace(/\D/g, "")}`} className="sy-btn sy-btn--outline sy-btn--sm" style={{ gap: 6 }}>
                    <Icon name="phone" size={15} />
                    Prestataire
                  </a>
                )}
                {peutTraiter && <button data-r="traiter-signalement" onClick={() => setTraite(s)} className="sy-btn sy-btn--primary sy-btn--sm" style={{ marginLeft: "auto" }}>
                  Marquer traité
                </button>}
              </div>
            )}
          </article>
        ))}
      </div>

      {traite && (
        <Dialogue
          titre="Marquer le signalement traité"
          description={`${traite.motif_libelle}${traite.demande ? ` · ${traite.demande.reference}` : ""}. Notez ce qui a été fait.`}
          icone="circle-check"
          fond="var(--state-success-soft)"
          encre="var(--state-success)"
          confirmer="Enregistrer"
          onFermer={() => setTraite(null)}
          onConfirmer={async () => {
            try {
              await api.admin.traiterSignalement(traite.id, reponse.trim());
              setListe((l) => l?.filter((x) => x.id !== traite.id) ?? null);
              setTraite(null);
              setReponse("");
              toast("Signalement traité", "Il passe dans « Traités ».");
            } catch (e) {
              toast("Action impossible", messageErreur(e), "danger");
            }
          }}
        >
          <textarea className="sy-textarea" aria-label="Ce qui a été fait" value={reponse} onChange={(e) => setReponse(e.target.value)} placeholder="Ex. technicien rappelé, il repasse demain sans frais." style={{ borderRadius: 14 }} />
        </Dialogue>
      )}
    </EspaceAdmin>
  );
}
