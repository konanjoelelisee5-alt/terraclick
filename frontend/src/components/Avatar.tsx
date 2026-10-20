import type { Compte } from "../state/types";
import { Icon } from "./Icon";

/** Avatar rond : la photo du compte, sinon ses initiales, sinon (visiteur) une silhouette. */
export function Avatar({ compte, taille }: { compte: Compte | null; taille: number }) {
  const initiales = (compte?.prenom ?? "")
    .split(" ")
    .filter(Boolean)
    .map((m) => m[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      style={{
        width: taille,
        height: taille,
        flex: "none",
        borderRadius: 999,
        overflow: "hidden",
        background: "var(--color-accent-100)",
        color: "var(--color-accent-700)",
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize: Math.round(taille * 0.38),
      }}
    >
      {compte?.photo ? (
        <img src={compte.photo} alt="" width={taille} height={taille} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : initiales ? (
        initiales
      ) : (
        <Icon name="user" size={Math.round(taille * 0.5)} />
      )}
    </span>
  );
}
