import { useEffect, useState } from "react";
import { api, messageErreur, type RolesAdmin } from "../../lib/api";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspaceAdmin, GRIS, TITRE_CARTE } from "./EspaceAdmin";

/* « Rôles et permissions », d'après la matrice de la maquette : les permissions rangées par
   interface (espace client, prestataire, administrateur), une colonne par rôle. Cocher ouvre
   l'accès ; « Enregistrer » sous chaque rôle l'applique aussitôt. L'administrateur a tout. */

export function AdminRoles() {
  const toast = useToast();
  const [donnees, setDonnees] = useState<RolesAdmin | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  // Permissions en cours de modification, par rôle.
  const [brouillon, setBrouillon] = useState<Record<number, string[]>>({});

  useEffect(() => {
    const arret = new AbortController();
    api.admin.roles(arret.signal).then(
      (d) => {
        setDonnees(d);
        setBrouillon(Object.fromEntries(d.roles.map((r) => [r.id, r.permissions])));
      },
      (e) => e?.name !== "AbortError" && setErreur(messageErreur(e)),
    );
    return () => arret.abort();
  }, []);

  const basculer = (role: number, permission: string) =>
    setBrouillon((b) => ({ ...b, [role]: b[role].includes(permission) ? b[role].filter((p) => p !== permission) : [...b[role], permission] }));

  const change = (id: number) => {
    const r = donnees?.roles.find((x) => x.id === id);
    return !!r && [...r.permissions].sort().join() !== [...(brouillon[id] ?? [])].sort().join();
  };

  const enregistrer = async (id: number) => {
    try {
      const maj = await api.admin.modifierRole(id, brouillon[id]);
      setDonnees((d) => (d ? { ...d, roles: d.roles.map((r) => (r.id === id ? { ...r, permissions: maj.permissions } : r)) } : d));
      toast("Permissions enregistrées", `Rôle ${donnees?.roles.find((r) => r.id === id)?.nom} : ${maj.permissions.length} permissions.`);
    } catch (e) {
      toast("Permissions non enregistrées", messageErreur(e), "danger");
    }
  };

  return (
    <EspaceAdmin titre="Rôles et permissions" sousTitre="Ce que chaque rôle peut ouvrir. Les changements s'appliquent dès la prochaine action des comptes concernés.">
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}

      {donnees && (
        <>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))" }}>
            {donnees.roles.map((r) => (
              <div key={r.id} className="sy-card" style={{ padding: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: "15px" }}>{r.nom}</strong>
                  <span className="sy-badge sy-badge--neutral" style={{ marginLeft: "auto" }}>
                    {r.utilisateurs} compte{r.utilisateurs > 1 ? "s" : ""}
                  </span>
                </span>
                <span style={{ display: "block", fontSize: "13px", color: GRIS, marginTop: 4 }}>{r.description}</span>
              </div>
            ))}
          </div>

          {/* La matrice défile sur téléphone : une colonne par rôle. */}
          <div className="sy-card" style={{ overflowX: "auto" }}>
            <table data-r="matrice-roles" style={{ width: "100%", minWidth: 620, borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", letterSpacing: ".08em", color: "var(--text-muted)" }}>PERMISSION</th>
                  {donnees.roles.map((r) => (
                    <th key={r.id} style={{ padding: "12px 8px", fontSize: "13px", width: 110 }}>
                      {r.nom}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donnees.groupes.map((g) => (
                  <GroupeLignes key={g.nom} groupe={g} roles={donnees.roles} brouillon={brouillon} onBasculer={basculer} />
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: GRIS }}>L'administrateur garde toujours toutes les permissions.</td>
                  {donnees.roles.map((r) => (
                    <td key={r.id} style={{ padding: "10px 8px", textAlign: "center" }}>
                      {r.modifiable && (
                        <button data-r={`enregistrer-role-${r.cle}`} onClick={() => enregistrer(r.id)} disabled={!change(r.id)} className="sy-btn sy-btn--primary sy-btn--sm">
                          Enregistrer
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </EspaceAdmin>
  );
}

function GroupeLignes(props: {
  groupe: RolesAdmin["groupes"][number];
  roles: RolesAdmin["roles"];
  brouillon: Record<number, string[]>;
  onBasculer: (role: number, permission: string) => void;
}) {
  return (
    <>
      <tr>
        <th colSpan={props.roles.length + 1} style={{ ...TITRE_CARTE, fontSize: "14px", textAlign: "left", padding: "14px 16px 6px", background: "var(--argile-50)" }}>
          {props.groupe.nom}
        </th>
      </tr>
      {props.groupe.permissions.map((p) => (
        <tr key={p.cle} style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <td style={{ padding: "10px 16px" }}>
            <span style={{ display: "block" }}>{p.nom}</span>
            <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11.5px", color: GRIS }}>{p.cle}</span>
          </td>
          {props.roles.map((r) => {
            const coche = (props.brouillon[r.id] ?? []).includes(p.cle);
            // Un rôle client ou prestataire n'ouvre jamais l'espace de l'équipe (refusé par le serveur).
            const horsEquipe = !r.equipe && props.groupe.nom === "Espace administrateur";
            return (
              <td key={r.id} style={{ textAlign: "center", padding: "6px 8px" }}>
                {horsEquipe ? (
                  <span aria-label={`${r.nom} : ${p.nom} — réservé à l'équipe`} title="Réservé aux comptes de l'équipe" style={{ color: GRIS }}>
                    —
                  </span>
                ) : r.modifiable ? (
                  <input
                    type="checkbox"
                    aria-label={`${r.nom} : ${p.nom}`}
                    checked={coche}
                    onChange={() => props.onBasculer(r.id, p.cle)}
                    style={{ width: 20, height: 20, accentColor: "var(--kola-500)", cursor: "pointer" }}
                  />
                ) : (
                  <Icon name="check" size={18} color="var(--state-success)" />
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
