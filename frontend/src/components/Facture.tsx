import { Fragment } from "react";
import { francs } from "../screens/client/store";
import { Icon } from "./Icon";
import type { LigneFacture } from "../lib/pressing";

/* Facture d'une commande pressing : avant la validation (estimative) et après (avec sa
   référence). « Télécharger » passe par l'impression du navigateur, qui propose
   « Enregistrer en PDF » ; seule la facture est imprimée. */

const GRIS = "#5C5248";

export function Facture(props: {
  reference?: string | null;
  pressing: string;
  lignes: LigneFacture[];
  /** Service, express, dépôt, créneau, adresse, paiement… en couples libellé / valeur. */
  details: [string, string | null | undefined][];
  date?: string;
}) {
  const total = props.lignes.reduce((n, l) => n + l.total, 0);
  const pieces = props.lignes.reduce((n, l) => n + l.quantite, 0);

  return (
    <>
      <style>{"@media print { body * { visibility: hidden !important; } [data-r='facture'], [data-r='facture'] * { visibility: visible !important; } [data-r='facture'] { position: absolute; inset: 0 auto auto 0; width: 100%; border: 0 !important; box-shadow: none !important; } [data-r='facture'] button { display: none !important; } }"}</style>
      <section
        data-r="facture"
        aria-label="Facture"
        style={{ background: "var(--color-neutral-100)", border: "1px solid var(--color-divider)", borderRadius: 20, padding: "18px 18px 14px" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <span>
            <strong style={{ display: "block", fontFamily: "var(--font-heading)", fontSize: "20px" }}>
              Terra<span style={{ color: "var(--color-accent)" }}>Click</span>
            </strong>
            <span style={{ fontSize: "13px", color: GRIS }}>{props.pressing}</span>
          </span>
          <span style={{ textAlign: "right", fontSize: "13px", color: GRIS }}>
            <span style={{ display: "block", fontWeight: 700, color: "var(--color-text)" }}>{props.reference ? "Facture" : "Facture estimative"}</span>
            {props.reference && <span style={{ display: "block" }}>{props.reference}</span>}
            <span style={{ display: "block" }}>{new Date(props.date ?? Date.now()).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
          </span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ color: GRIS, fontSize: "12.5px", textAlign: "left" }}>
              <th style={{ fontWeight: 600, padding: "6px 0" }}>Article</th>
              <th style={{ fontWeight: 600, padding: "6px 0", textAlign: "right" }}>Qté</th>
              <th style={{ fontWeight: 600, padding: "6px 0", textAlign: "right" }}>Prix</th>
              <th style={{ fontWeight: 600, padding: "6px 0", textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {props.lignes.map((l) => (
              <tr key={l.cle} data-r="ligne-facture" style={{ borderTop: "1px solid var(--color-divider)" }}>
                <td style={{ padding: "8px 8px 8px 0" }}>{l.nom}</td>
                <td style={{ padding: "8px 0", textAlign: "right" }}>{l.quantite}</td>
                <td style={{ padding: "8px 0 8px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{francs(l.prix_unitaire)}</td>
                <td style={{ padding: "8px 0 8px 8px", textAlign: "right", whiteSpace: "nowrap", fontWeight: 600 }}>{francs(l.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid var(--color-text)" }}>
              <td colSpan={3} style={{ padding: "10px 0", fontWeight: 700 }}>
                Total · {pieces} pièce{pieces > 1 ? "s" : ""}
              </td>
              <td data-r="total-facture" style={{ padding: "10px 0", textAlign: "right", fontWeight: 800, fontSize: "16px", whiteSpace: "nowrap" }}>
                {francs(total)}
              </td>
            </tr>
          </tfoot>
        </table>

        <dl style={{ margin: "8px 0 0", display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontSize: "13.5px" }}>
          {props.details
            .filter(([, v]) => v)
            .map(([cle, valeur]) => (
              <Fragment key={cle}>
                <dt style={{ color: GRIS }}>{cle}</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{valeur}</dd>
              </Fragment>
            ))}
        </dl>

        <p style={{ margin: "12px 0 0", fontSize: "12.5px", lineHeight: 1.5, color: GRIS }}>
          Prix indicatifs, confirmés par le pressing à la réception du linge. Le paiement se fait directement au pressing ; TerraClick ne perçoit pas ce montant.
        </p>
        <button data-r="telecharger-facture" onClick={() => window.print()} className="sy-btn sy-btn--outline sy-btn--md" style={{ marginTop: 12, gap: 8 }}>
          <Icon name="download" size={17} />
          Télécharger la facture
        </button>
      </section>
    </>
  );
}
