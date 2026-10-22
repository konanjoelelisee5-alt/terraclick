import { useEffect, useState } from "react";
import { api, messageErreur, type UtilisateurAdmin } from "../../lib/api";
import { peut } from "../../lib/acces";
import { useApp } from "../../state/app";
import { Dialogue } from "../../components/Dialogue";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspaceAdmin, GRIS, Recherche, Vide, dateCourte } from "./EspaceAdmin";

/* Utilisateurs : chercher par nom ou numéro, voir leur activité et leurs rôles ; qui en a la
   permission change les rôles (client, prestataire, manager, administrateur). L'API refuse
   qu'un non-administrateur touche au rôle administrateur, qu'on se retire le sien, et qu'un
   compte public passe dans l'équipe (ou l'inverse). */

const ROLES = [
  { cle: "client", nom: "Client", detail: "Envoie des demandes, les suit dans ses onglets." },
  { cle: "prestataire", nom: "Prestataire", detail: "Ouvre l'espace prestataire et ses demandes reçues." },
  { cle: "manager", nom: "Manager", detail: "Candidatures, signalements, demandes, prestataires." },
  { cle: "admin", nom: "Administrateur", detail: "Accès complet, rôles et prix compris." },
];

/** Rôles de l'équipe (config/acces.php, roles_equipe) : un monde à part des comptes publics. */
const ROLES_EQUIPE = ["manager", "admin"];
const estEquipe = (u: UtilisateurAdmin) => u.roles.some((r) => ROLES_EQUIPE.includes(r.cle));

const TON: Record<string, string> = { admin: "brand", manager: "warning", prestataire: "info", client: "neutral" };

export function AdminUtilisateurs() {
  const { etat } = useApp();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [liste, setListe] = useState<UtilisateurAdmin[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [cible, setCible] = useState<UtilisateurAdmin | null>(null);
  const [choix, setChoix] = useState<string[]>([]);
  const peutChanger = peut(etat.auth, "utilisateurs.roles");

  useEffect(() => {
    const arret = new AbortController();
    const t = setTimeout(() => api.admin.utilisateurs(q.trim(), arret.signal).then(setListe, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e))), 300);
    return () => {
      clearTimeout(t);
      arret.abort();
    };
  }, [q]);

  const ouvrir = (u: UtilisateurAdmin) => {
    setCible(u);
    setChoix(u.roles.map((r) => r.cle));
  };

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
                  {u.prestataire ? ` · fiche « ${u.prestataire} »` : ""}
                </span>
              </span>
              <span data-r="roles-utilisateur" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {u.roles.map((r) => (
                  <span key={r.cle} className={`sy-badge sy-badge--${TON[r.cle] ?? "neutral"}`}>
                    {r.nom}
                  </span>
                ))}
              </span>
              {peutChanger && (
                <button data-r="changer-roles" onClick={() => ouvrir(u)} className="sy-btn sy-btn--outline sy-btn--sm" style={{ gap: 6 }}>
                  <Icon name="shield-check" size={15} />
                  Rôles
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {cible && (
        <Dialogue
          titre={`Rôles de ${cible.nom ?? "ce compte"}`}
          description={
            estEquipe(cible)
              ? "Compte de l'équipe : il reste administrateur ou manager, jamais client."
              : "Compte public : client ou prestataire. Il ne devient jamais administrateur ou manager, l'équipe a ses propres comptes."
          }
          icone="shield-check"
          fond="var(--kola-100)"
          encre="var(--kola-700)"
          confirmer="Enregistrer les rôles"
          onFermer={() => setCible(null)}
          onConfirmer={async () => {
            if (!choix.length) {
              toast("Aucun rôle", "Gardez au moins un rôle, par exemple Client.", "danger");
              return;
            }
            try {
              const maj = await api.admin.modifierUtilisateur(cible.id, choix);
              setListe((l) => l?.map((x) => (x.id === maj.id ? maj : x)) ?? null);
              toast("Rôles enregistrés", `${maj.nom ?? ""} : ${maj.roles.map((r) => r.nom).join(", ")}`);
              setCible(null);
            } catch (e) {
              toast("Rôles non modifiés", messageErreur(e), "danger");
            }
          }}
        >
          <div role="group" aria-label="Rôles" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ROLES.filter((r) => ROLES_EQUIPE.includes(r.cle) === estEquipe(cible)).map((r) => (
              <label key={r.cle} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${choix.includes(r.cle) ? "var(--kola-500)" : "var(--border-subtle)"}`, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={choix.includes(r.cle)}
                  onChange={() => setChoix((c) => (c.includes(r.cle) ? c.filter((x) => x !== r.cle) : [...c, r.cle]))}
                  style={{ width: 20, height: 20, marginTop: 1, accentColor: "var(--kola-500)" }}
                />
                <span>
                  <span style={{ display: "block", fontWeight: 700, fontSize: "14.5px" }}>{r.nom}</span>
                  <span style={{ display: "block", fontSize: "13px", color: GRIS }}>{r.detail}</span>
                </span>
              </label>
            ))}
          </div>
        </Dialogue>
      )}
    </EspaceAdmin>
  );
}
