import { useState } from "react";
import { useApp } from "../../state/app";
import { CONSIGNES } from "../../data/pro";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspacePro, MONO, badge } from "./EspacePro";
import { modifierPro, useEtatPro } from "./store";

/**
 * Ordres de l'administration (corrections de vérification, factures, documents) :
 * le prestataire les ouvre, les traite dans le module concerné, puis les clôt.
 */
export function ProConsignes() {
  const { go } = useApp();
  const toast = useToast();
  const { consignesFaites } = useEtatPro();
  const [vue, setVue] = useState<"ouvertes" | "faites">("ouvertes");
  const liste = CONSIGNES.filter((c) => (vue === "faites") === consignesFaites.includes(c.ref));

  const cloturer = (ref: string, titre: string) => {
    modifierPro((e) => ({ consignesFaites: [...e.consignesFaites, ref] }));
    toast("Consigne exécutée", `« ${titre} » est transmise à l'administration pour contrôle.`);
  };

  return (
    <EspacePro titre="Consignes" sousTitre="Ordres de l'administration à exécuter, par priorité.">
      <div className="sy-tabs" role="tablist">
        {(
          [
            ["ouvertes", "À exécuter", CONSIGNES.length - consignesFaites.length],
            ["faites", "Exécutées", consignesFaites.length],
          ] as const
        ).map(([cle, libelle, n]) => (
          <button
            key={cle}
            type="button"
            role="tab"
            aria-selected={vue === cle}
            className={`sy-tab${vue === cle ? " sy-tab--active" : ""}`}
            onClick={() => setVue(cle)}
          >
            {libelle}
            <span className="sy-tab__count">{n}</span>
          </button>
        ))}
      </div>

      {liste.length === 0 && (
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name="circle-check" size={22} color="var(--secondary)" />
            <span style={{ fontSize: "15px" }}>
              {vue === "ouvertes" ? "Aucune consigne en attente. Tout est à jour." : "Aucune consigne exécutée pour le moment."}
            </span>
          </div>
        </div>
      )}

      {liste.map((c) => {
        const faite = consignesFaites.includes(c.ref);
        return (
          <div key={c.ref} className="sy-card">
            <div style={{ padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 260px", minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ ...MONO, fontSize: "12px", color: "var(--kola-700)" }}>{c.ref}</span>
                  <span className={badge(faite ? "success" : c.ton)}>{faite ? "Exécutée" : `Priorité ${c.priorite.toLowerCase()}`}</span>
                </div>
                <strong style={{ fontSize: "15px" }}>{c.titre}</strong>
                <span style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--argile-700)" }}>{c.detail}</span>
                <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                  Émise par {c.emetteur} · échéance {c.echeance}
                </span>
              </div>
              {!faite && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="sy-btn sy-btn--outline sy-btn--sm" onClick={() => go(c.ecran)}>
                    Traiter
                  </button>
                  <button type="button" className="sy-btn sy-btn--primary sy-btn--sm" onClick={() => cloturer(c.ref, c.titre)}>
                    Marquer exécutée
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </EspacePro>
  );
}
