import { useEffect, useState } from "react";
import { api, messageErreur, type UtilisateurAdmin } from "../../lib/api";
import { Dialogue } from "../../components/Dialogue";
import { useToast } from "../../components/Toast";
import { EspaceAdmin, GRIS, Recherche, Vide, dateCourte } from "./EspaceAdmin";

/* Utilisateurs : chercher par nom ou numéro, voir leur activité, donner ou retirer l'accès à
   l'espace administrateur (on ne peut pas se le retirer soi-même). */

export function AdminUtilisateurs() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [liste, setListe] = useState<UtilisateurAdmin[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [role, setRole] = useState<UtilisateurAdmin | null>(null);

  useEffect(() => {
    const arret = new AbortController();
    const t = setTimeout(() => api.admin.utilisateurs(q.trim(), arret.signal).then(setListe, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e))), 300);
    return () => {
      clearTimeout(t);
      arret.abort();
    };
  }, [q]);

  return (
    <EspaceAdmin titre="Utilisateurs" sousTitre={liste ? `${liste.length} compte${liste.length > 1 ? "s" : ""}${liste.length === 200 ? " (les 200 plus récents)" : ""}.` : undefined}>
      <Recherche valeur={q} onChange={setQ} placeholder="Nom ou numéro de téléphone" />
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}
      {liste?.length === 0 && <Vide texte="Aucun compte ne correspond." />}
      {liste && liste.length > 0 && (
        <div className="sy-card" style={{ overflow: "hidden" }}>
          {liste.map((u, i) => (
            <div key={u.id} data-r="utilisateur-admin" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: i ? "1px solid var(--border-subtle)" : 0, flexWrap: "wrap" }}>
              <span style={{ width: 36, height: 36, flex: "none", borderRadius: "50%", background: "var(--kola-100)", color: "var(--kola-700)", display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "12px" }}>
                {(u.nom ?? "?")
                  .split(/\s+/)
                  .map((m) => m[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <span style={{ flex: 1, minWidth: 160 }}>
                <span style={{ display: "block", fontWeight: 700, fontSize: "14.5px" }}>{u.nom ?? "Sans nom"}</span>
                <span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>
                  {[u.telephone, u.quartier, `${u.demandes} demande${u.demandes > 1 ? "s" : ""}`, `inscrit le ${dateCourte(u.inscrit_le)}`].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {u.est_admin && <span className="sy-badge sy-badge--brand">Administrateur</span>}
                {u.prestataire && <span className="sy-badge sy-badge--info">Prestataire · {u.prestataire}</span>}
                {!u.est_admin && !u.prestataire && <span className="sy-badge sy-badge--neutral">Client</span>}
              </span>
              <button data-r="role-utilisateur" onClick={() => setRole(u)} className="sy-btn sy-btn--outline sy-btn--sm">
                {u.est_admin ? "Retirer l'accès admin" : "Donner l'accès admin"}
              </button>
            </div>
          ))}
        </div>
      )}

      {role && (
        <Dialogue
          titre={role.est_admin ? `Retirer l'accès administrateur à ${role.nom} ?` : `Donner l'accès administrateur à ${role.nom} ?`}
          description={role.est_admin ? "Ce compte ne verra plus l'espace administrateur." : "Ce compte pourra vérifier les candidatures, traiter les signalements, suspendre des prestataires et modifier les prix."}
          icone="shield-check"
          fond="var(--kola-100)"
          encre="var(--kola-700)"
          confirmer={role.est_admin ? "Retirer l'accès" : "Donner l'accès"}
          onFermer={() => setRole(null)}
          onConfirmer={async () => {
            try {
              const maj = await api.admin.modifierUtilisateur(role.id, !role.est_admin);
              setListe((l) => l?.map((x) => (x.id === maj.id ? maj : x)) ?? null);
              toast(maj.est_admin ? "Accès administrateur donné" : "Accès administrateur retiré", maj.nom ?? "");
            } catch (e) {
              toast("Action impossible", messageErreur(e), "danger");
            }
            setRole(null);
          }}
        />
      )}
    </EspaceAdmin>
  );
}
