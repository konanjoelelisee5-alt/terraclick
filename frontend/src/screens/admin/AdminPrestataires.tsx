import { useEffect, useState } from "react";
import { api, messageErreur, type PrestataireAdmin } from "../../lib/api";
import { peut } from "../../lib/acces";
import { useApp } from "../../state/app";
import { Dialogue } from "../../components/Dialogue";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspaceAdmin, Filtres, GRIS, Recherche, Vide } from "./EspaceAdmin";

/* Prestataires : chercher, voir la fiche publique, suspendre (la fiche disparaît de
   l'annuaire, rien n'est supprimé) ou réactiver, mettre en avant sur l'accueil. */

export function AdminPrestataires() {
  const { go } = useApp();
  const toast = useToast();
  const [etatFiltre, setEtatFiltre] = useState<"actifs" | "suspendus">("actifs");
  const [q, setQ] = useState("");
  const [liste, setListe] = useState<PrestataireAdmin[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [suspendre, setSuspendre] = useState<PrestataireAdmin | null>(null);
  const { etat } = useApp();
  const peutSuspendre = peut(etat.auth, "prestataires.suspendre");
  const peutMettreEnAvant = peut(etat.auth, "prestataires.mettre_en_avant");

  useEffect(() => {
    const arret = new AbortController();
    const t = setTimeout(() => api.admin.prestataires({ etat: etatFiltre, q: q.trim() || undefined }, arret.signal).then(setListe, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e))), 300);
    return () => {
      clearTimeout(t);
      arret.abort();
    };
  }, [etatFiltre, q]);

  const modifier = async (p: PrestataireAdmin, patch: { actif?: boolean; en_vedette?: boolean }, titre: string) => {
    try {
      const maj = await api.admin.modifierPrestataire(p.id, patch);
      // Suspendu ou réactivé : il change de liste.
      setListe((l) => (patch.actif !== undefined ? l?.filter((x) => x.id !== p.id) : l?.map((x) => (x.id === p.id ? maj : x))) ?? null);
      toast(titre, maj.nom);
    } catch (e) {
      toast("Action impossible", messageErreur(e), "danger");
    }
  };

  return (
    <EspaceAdmin titre="Prestataires">
      <Recherche valeur={q} onChange={setQ} placeholder="Nom ou métier" />
      <Filtres options={[{ cle: "actifs" as const, nom: "Actifs" }, { cle: "suspendus" as const, nom: "Suspendus" }]} valeur={etatFiltre} onChange={setEtatFiltre} />
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}
      {liste?.length === 0 && <Vide texte="Aucun prestataire ici." />}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))" }}>
        {liste?.map((p) => (
          <article key={p.id} data-r="prestataire-admin" className="sy-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 700, fontSize: "15.5px" }}>{p.nom}</span>
                <span style={{ display: "block", fontSize: "13px", color: GRIS }}>
                  {p.metier}
                  {p.quartier ? ` · ${p.quartier}` : ""}
                </span>
              </span>
              {p.en_vedette && <span className="sy-badge sy-badge--brand">À la une</span>}
              {p.verifie && <span className="sy-badge sy-badge--success">Vérifié</span>}
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: "13px", color: GRIS }}>
              <span>
                <Icon name="star" size={13} /> {p.note.toLocaleString("fr-FR")} ({p.nombre_avis} avis)
              </span>
              <span>{p.demandes} demande{p.demandes > 1 ? "s" : ""}</span>
              <span>{p.compte ? `Compte : ${p.compte.nom ?? p.compte.telephone}` : "Aucun compte relié"}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {p.actif && (
                <button onClick={() => go("fiche", { fiche: p.id })} className="sy-btn sy-btn--outline sy-btn--sm">
                  Voir la fiche
                </button>
              )}
              {p.actif && peutMettreEnAvant && (
                <button data-r="vedette" onClick={() => modifier(p, { en_vedette: !p.en_vedette }, p.en_vedette ? "Retiré de la une" : "Mis en avant")} className="sy-btn sy-btn--outline sy-btn--sm">
                  {p.en_vedette ? "Retirer de la une" : "Mettre en avant"}
                </button>
              )}
              {!peutSuspendre ? null : p.actif ? (
                <button data-r="suspendre" onClick={() => setSuspendre(p)} className="sy-btn sy-btn--outline sy-btn--sm" style={{ color: "var(--state-danger)", borderColor: "var(--state-danger)", marginLeft: "auto" }}>
                  Suspendre
                </button>
              ) : (
                <button data-r="reactiver" onClick={() => modifier(p, { actif: true }, "Prestataire réactivé")} className="sy-btn sy-btn--primary sy-btn--sm" style={{ marginLeft: "auto" }}>
                  Réactiver
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {suspendre && (
        <Dialogue
          titre={`Suspendre ${suspendre.nom} ?`}
          description="La fiche disparaît de l'annuaire et ne reçoit plus de demandes. Rien n'est supprimé : vous pourrez la réactiver."
          icone="alert-triangle"
          fond="var(--state-danger-soft)"
          encre="var(--state-danger)"
          confirmer="Suspendre"
          onFermer={() => setSuspendre(null)}
          onConfirmer={async () => {
            await modifier(suspendre, { actif: false }, "Prestataire suspendu");
            setSuspendre(null);
          }}
        />
      )}
    </EspaceAdmin>
  );
}
