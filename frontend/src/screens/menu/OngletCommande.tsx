import { useState } from "react";
import { api, messageErreur, type AccordApi, type DemandeApi } from "../../lib/api";
import { creneauLisible } from "../../lib/pressing";
import { SECTEURS } from "../../data/catalogue";
import { useApp } from "../../state/app";
import type { Besoin } from "../../state/types";
import { Dialogue } from "../../components/Dialogue";
import { Facture } from "../../components/Facture";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";

/* Onglet d'une demande envoyée dans l'application, quel que soit le service : le suivi étape
   par étape (intervention : envoyée, acceptée, en cours, terminée, confirmée ; pressing :
   collectée, reçue, en traitement, prête, en livraison, livrée), la facture ou le reçu, puis
   ce que le client fait après coup : confirmer, noter, signaler un problème, recommander. */

const GRIS = "#5C5248";

const CARTE: React.CSSProperties = {
  background: "var(--color-neutral-100)",
  border: "1px solid var(--color-divider)",
  borderRadius: 20,
};

/** Bouton de la colonne d'actions du suivi : pleine largeur, texte sur deux lignes au besoin. */
const ACTION_SUIVI: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  gap: 8,
  justifyContent: "flex-start",
  textAlign: "left",
  whiteSpace: "normal",
  lineHeight: 1.2,
  padding: "8px 12px",
};

const criteres = (pressing: boolean) => [
  { cle: "qualite" as const, nom: pressing ? "Qualité du nettoyage" : "Qualité du travail" },
  { cle: "ponctualite" as const, nom: pressing ? "Respect du créneau" : "Ponctualité" },
  { cle: "prix" as const, nom: "Prix" },
];

const LIBELLES_QUAND: Record<string, string> = { maintenant: "Maintenant", aujourdhui: "Aujourd'hui", demain: "Demain" };

const date = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).replace(":", " h ");

/**
 * Le besoin d'une nouvelle demande identique : commande pressing demain au même créneau
 * horaire ; intervention au même moment (aujourd'hui si la date choisie est passée).
 */
function besoinRecommande(d: DemandeApi): Besoin {
  const demain = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  return {
    secteur: d.secteur.cle,
    suggestions: [],
    probleme: d.probleme,
    precision: d.precision ?? "",
    quartier: d.quartier?.id ?? null,
    repere: d.repere ?? "",
    quand: d.commande ? "date" : d.quand === "date" ? "aujourdhui" : d.quand,
    date: d.commande ? demain : "",
    photos: [],
    pack: (d.pack?.articles ?? []).map((a) => ({ cle: a.cle, quantite: a.quantite })),
    mode: "choisi",
    prestataire: d.prestataire,
    paiement: d.paiement,
    service: d.commande?.service?.cle ?? "lavage",
    express: d.commande?.express ?? false,
    depot: d.commande?.depot?.cle ?? null,
    heure: d.commande?.heure ?? "",
    adresse: d.commande?.adresse ?? "",
  };
}

export function OngletCommande({ a, onMaj }: { a: AccordApi; onMaj: (a: AccordApi) => void }) {
  const { go } = useApp();
  const toast = useToast();
  const d = a.demande!;
  // Commande pressing : service, dépôt, créneau ; absente pour une intervention.
  const c = d.commande;
  const pressing = c !== null;
  const suivi = c?.suivi ?? d.suivi ?? [];
  const signalements = d.signalements ?? c?.signalements ?? [];
  const secteur = SECTEURS.find((s) => s.cle === d.secteur.cle);
  const nom = pressing ? "commande" : "demande";
  const [fenetre, setFenetre] = useState<"signaler" | "annuler" | null>(null);
  const [motif, setMotif] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState({ qualite: 0, ponctualite: 0, prix: 0 });
  const [commentaire, setCommentaire] = useState("");
  const [occupe, setOccupe] = useState(false);

  const recharger = async () => onMaj(await api.accord(a.id));
  const agir = async (action: () => Promise<unknown>, titre: string, texte: string) => {
    setOccupe(true);
    try {
      await action();
      await recharger();
      toast(titre, texte);
      return true;
    } catch (e) {
      toast("Action impossible", messageErreur(e), "danger");
      return false;
    } finally {
      setOccupe(false);
    }
  };

  const livree = d.statut === "terminee" || d.statut === "confirmee";
  const enCours = !["refusee", "annulee"].includes(d.statut);
  const actuelle = [...suivi].reverse().find((e) => e.fait)?.cle;
  const quand = d.quand === "date" ? creneauLisible(d.date_souhaitee, null) : LIBELLES_QUAND[d.quand];

  const refaire = () => go("confirmation", { besoin: besoinRecommande(d) });

  return (
    <main data-r="onglet-commande" style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 48px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "13.5px", color: GRIS }}>
          <Icon name={secteur?.icone ?? "wrench"} size={15} />
          {a.prestataire.nom}
        </span>
        <h1 style={{ margin: "4px 0 0", fontSize: "28px", lineHeight: 1.2 }}>{a.objet}</h1>
        <p style={{ margin: "4px 0 0", fontSize: "15px", color: GRIS }}>
          {d.reference} · <strong data-r="statut-commande" style={{ color: "var(--color-text)" }}>{a.statut_libelle}</strong>
        </p>
      </div>

      {/* ---- Suivi ---- */}
      <section data-r="suivi-commande" aria-label="Suivi de la commande" style={{ ...CARTE, padding: "14px 16px" }}>
        <h2 style={{ margin: "0 0 10px", fontSize: "16px" }}>Suivi</h2>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
        {!enCours ? (
          <p style={{ margin: 0, fontSize: "14.5px", color: GRIS }}>
            {d.statut === "refusee"
              ? `${a.prestataire.nom} n'a pas pu prendre cette ${nom}.`
              : `${pressing ? "Commande annulée" : "Demande annulée"}.`}
          </p>
        ) : (
          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {suivi.map((e, i) => {
              const courante = e.cle === actuelle;
              return (
                <li key={e.cle} data-r="etape-suivi" data-fait={e.fait || undefined} aria-current={courante ? "step" : undefined} style={{ display: "flex", gap: 12 }}>
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 18, flex: "none" }}>
                    <span
                      style={{
                        width: courante ? 16 : 12,
                        height: courante ? 16 : 12,
                        marginTop: courante ? 2 : 4,
                        borderRadius: 999,
                        background: e.fait ? "var(--state-success)" : "var(--color-neutral-100)",
                        border: e.fait ? 0 : "2px solid var(--color-divider)",
                        boxShadow: courante ? "0 0 0 4px var(--state-success-soft)" : "none",
                      }}
                    />
                    {i < suivi.length - 1 && <span style={{ flex: 1, width: 2, background: e.fait ? "var(--state-success)" : "var(--color-divider)", margin: "3px 0" }} />}
                  </span>
                  <span style={{ paddingBottom: 12 }}>
                    <span style={{ display: "block", fontWeight: courante ? 700 : 600, fontSize: "14.5px", color: e.fait ? "var(--color-text)" : GRIS }}>{e.libelle}</span>
                    {e.date && <span style={{ display: "block", fontSize: "13px", color: GRIS }}>{date(e.date)}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        </div>

        {/* Actions sur la commande, empilées à droite du suivi. */}
        <div data-r="actions-suivi" style={{ flex: "none", width: 148, display: "flex", flexDirection: "column", gap: 8 }}>
          {(d.statut === "envoyee" || d.statut === "acceptee") && (
            <button onClick={() => setFenetre("annuler")} className="sy-btn sy-btn--outline sy-btn--sm" style={ACTION_SUIVI}>
              <Icon name="x" size={16} />
              Annuler la {nom}
            </button>
          )}
          {enCours && (
            <button data-r="signaler-probleme" onClick={() => setFenetre("signaler")} className="sy-btn sy-btn--outline sy-btn--sm" style={ACTION_SUIVI}>
              <Icon name="flag" size={16} />
              Signaler un problème
            </button>
          )}
          <button data-r="refaire-commande" onClick={refaire} className="sy-btn sy-btn--outline sy-btn--sm" style={ACTION_SUIVI}>
            <Icon name="rotate-cw" size={16} />
            Recommander
          </button>
        </div>
        </div>
      </section>

      {/* ---- Actions ---- */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {d.statut === "terminee" && (
          <button
            data-r="confirmer-reception"
            disabled={occupe}
            onClick={() =>
              agir(() => api.confirmerDemande(d.id), pressing ? "Réception confirmée" : "Fin confirmée", `Merci ! Vous pouvez noter ${a.prestataire.nom}.`)
            }
            className="sy-btn sy-btn--primary sy-btn--md"
            style={{ gap: 8 }}
          >
            <Icon name="circle-check" size={17} />
            {!c ? "Problème résolu, je confirme" : c.depot?.cle === "pressing" ? "J'ai récupéré mon linge" : "J'ai reçu mon linge"}
          </button>
        )}
        {a.prestataire.telephone && (
          <a href={`tel:+225${a.prestataire.telephone.replace(/\D/g, "")}`} className="sy-btn sy-btn--ghost sy-btn--md" style={{ gap: 8 }}>
            <Icon name="phone" size={16} />
            Appeler
          </a>
        )}
      </div>

      {/* ---- Noter, après la livraison ---- */}
      {livree && !a.deja_note && (
        <section data-r="noter-service" aria-label="Noter le service" style={{ ...CARTE, padding: "16px" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: "17px" }}>Notez {a.prestataire.nom}</h2>
          <p style={{ margin: "0 0 12px", fontSize: "14px", color: GRIS }}>Votre avis aide les autres clients à choisir.</p>
          {criteres(pressing).map((k) => (
            <div key={k.cle} role="radiogroup" aria-label={k.nom} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 44 }}>
              <span style={{ fontSize: "14.5px" }}>{k.nom}</span>
              <span style={{ display: "flex" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={notes[k.cle] === n}
                    aria-label={`${n} sur 5`}
                    onClick={() => setNotes((x) => ({ ...x, [k.cle]: n }))}
                    style={{ width: 36, height: 40, border: 0, background: "none", cursor: "pointer", color: n <= notes[k.cle] ? "var(--color-accent)" : "var(--color-neutral-300)", display: "grid", placeItems: "center" }}
                  >
                    <Icon name="star" size={24} fill={n <= notes[k.cle] ? "currentColor" : "none"} />
                  </button>
                ))}
              </span>
            </div>
          ))}
          <textarea
            className="sy-textarea"
            aria-label="Commentaire"
            maxLength={1000}
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder={pressing ? "Linge bien repassé, livré à l'heure…" : "Travail propre, venu à l'heure…"}
            style={{ marginTop: 10, borderRadius: 14 }}
          />
          <button
            data-r="publier-note"
            disabled={occupe || !notes.qualite || !notes.ponctualite || !notes.prix}
            onClick={() =>
              agir(
                () => api.publierAvis(a.prestataire.id, { ...notes, commentaire: commentaire.trim() || undefined }),
                "Merci pour votre avis",
                `Il est publié sur la fiche de ${a.prestataire.nom}.`,
              )
            }
            className="sy-btn sy-btn--primary sy-btn--md"
            style={{ marginTop: 12 }}
          >
            Publier ma note
          </button>
        </section>
      )}
      {livree && a.deja_note && (
        <p data-r="deja-note" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: "14.5px", color: GRIS }}>
          <Icon name="star" size={17} color="var(--color-accent)" />
          Vous avez noté {a.prestataire.nom}. Merci !
        </p>
      )}

      {/* ---- Signalements ---- */}
      {signalements.length > 0 && (
        <section aria-label="Problèmes signalés" style={{ ...CARTE, padding: "14px 16px" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: "16px" }}>Problèmes signalés</h2>
          {signalements.map((s) => (
            <div key={s.id} data-r="signalement" style={{ padding: "8px 0", borderTop: "1px solid var(--color-divider)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: "14.5px" }}>
                <Icon name="flag" size={15} color="var(--state-danger)" />
                {s.motif_libelle}
                <span className="sy-badge sy-badge--neutral" style={{ marginLeft: "auto" }}>
                  {s.statut === "ouvert" ? "En cours de traitement" : "Traité"}
                </span>
              </span>
              {s.message && <span style={{ display: "block", fontSize: "14px", marginTop: 2 }}>{s.message}</span>}
              <span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>{date(s.date)}</span>
            </div>
          ))}
        </section>
      )}

      {/* ---- Facture (pressing) ou reçu (intervention) ---- */}
      {!c && (
        <Facture
          reference={d.reference}
          date={d.cree_le}
          pressing={`${a.prestataire.nom} · ${a.prestataire.metier}`}
          lignes={[]}
          montant={a.montant_affichage}
          details={[
            ["Service", d.secteur.nom],
            ["Problème", d.probleme === "Autre" ? d.precision : d.probleme],
            ["Détail", d.probleme === "Autre" ? null : d.precision],
            ["Adresse", [d.quartier?.nom, d.repere].filter(Boolean).join(" · ")],
            ["Souhaitée", quand],
            ["Créneau proposé", d.creneau],
            ["Paiement", d.paiement_libelle],
            ["Statut", a.statut_libelle],
          ]}
        />
      )}
      {c && d.pack && (
        <Facture
          reference={d.reference}
          date={d.cree_le}
          pressing={a.prestataire.nom}
          lignes={d.pack.articles}
          details={[
            ["Service", `${c.service?.nom ?? ""}${c.express ? " · Express" : ""}`],
            ["Dépôt", c.depot?.nom],
            [c.depot?.cle === "pressing" ? "Dépôt prévu" : "Collecte", creneauLisible(d.date_souhaitee, c.heure)],
            ["Adresse", [c.adresse, d.quartier?.nom, d.repere].filter(Boolean).join(" · ")],
            ["Instructions", d.precision],
            ["Paiement", d.paiement_libelle],
            ["Statut", a.statut_libelle],
          ]}
        />
      )}

      {fenetre === "signaler" && (
        <Dialogue
          titre="Signaler un problème"
          description={`${a.prestataire.nom} et TerraClick reçoivent votre signalement et reviennent vers vous.`}
          icone="flag"
          fond="var(--state-danger-soft)"
          encre="var(--state-danger)"
          confirmer="Envoyer le signalement"
          onFermer={() => setFenetre(null)}
          onConfirmer={async () => {
            if (!motif) {
              toast("Choisissez un motif", "Dites-nous ce qui ne va pas.", "danger");
              return;
            }
            const ok = await agir(() => api.signaler(d.id, { motif, message: message.trim() || undefined }), "Signalement envoyé", `${a.prestataire.nom} va le traiter.`);
            if (ok) {
              setFenetre(null);
              setMotif(null);
              setMessage("");
            }
          }}
        >
          <div role="radiogroup" aria-label="Motif" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {d.motifs_signalement.map((m) => (
              <button
                key={m.cle}
                type="button"
                role="radio"
                aria-checked={motif === m.cle}
                onClick={() => setMotif(m.cle)}
                style={{
                  minHeight: 44,
                  padding: "0 14px",
                  borderRadius: 999,
                  border: `1.5px solid ${motif === m.cle ? "var(--color-text)" : "var(--color-divider)"}`,
                  background: motif === m.cle ? "var(--color-text)" : "var(--color-neutral-100)",
                  color: motif === m.cle ? "var(--color-neutral-100)" : "var(--color-text)",
                  font: "inherit",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {m.nom}
              </button>
            ))}
          </div>
          <textarea
            className="sy-textarea"
            aria-label="Détails"
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={motif === "autre" ? "Décrivez le problème" : pressing ? "Détails (facultatif) : quel article, quand…" : "Détails (facultatif) : ce qui s'est passé, quand…"}
            style={{ marginTop: 12, borderRadius: 14 }}
          />
        </Dialogue>
      )}

      {fenetre === "annuler" && (
        <Dialogue
          titre={`Annuler la ${nom} ?`}
          description={`${a.prestataire.nom} est prévenu. Vous pourrez recommander plus tard en un toucher.`}
          icone="x"
          fond="var(--state-danger-soft)"
          encre="var(--state-danger)"
          confirmer={`Annuler la ${nom}`}
          annuler="Garder"
          onFermer={() => setFenetre(null)}
          onConfirmer={async () => {
            if (await agir(() => api.annulerDemande(d.id, null), pressing ? "Commande annulée" : "Demande annulée", `${a.prestataire.nom} est prévenu.`)) setFenetre(null);
          }}
        />
      )}
    </main>
  );
}
