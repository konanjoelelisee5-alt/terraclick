import { useEffect, useState } from "react";
import { api, ErreurApi, messageErreur, type DemandeProApi } from "../../lib/api";
import { creneauLisible } from "../../lib/pressing";
import { Dialogue } from "../../components/Dialogue";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { francs } from "../client/store";
import { EspacePro } from "./EspacePro";
import { Filtres } from "../admin/EspaceAdmin";
import { Nouveau, Stats, chiffre } from "../admin/Gabarit";

/* Demandes et commandes reçues par le prestataire connecté (son compte est relié à sa fiche),
   branchées sur l'API. Le gérant d'un pressing y voit tout ce que le client a choisi —
   articles, service, express, dépôt, créneau, adresse, instructions, paiement, total — puis
   accepte ou refuse, et fait avancer la commande étape par étape : le client suit chaque
   étape dans ses onglets et reçoit une notification. */

const GRIS = "#5C5248";

const FILTRES = [
  { cle: "nouvelles", nom: "À traiter", statuts: ["envoyee"] },
  { cle: "en_cours", nom: "En cours", statuts: ["acceptee", "en_cours"] },
  { cle: "terminees", nom: "Terminées", statuts: ["terminee", "confirmee", "refusee", "annulee"] },
];

export function DemandesRecues() {
  const toast = useToast();
  const [demandes, setDemandes] = useState<DemandeProApi[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtre, setFiltre] = useState("nouvelles");
  const [refus, setRefus] = useState<DemandeProApi | null>(null);
  const [motif, setMotif] = useState("");
  const [occupe, setOccupe] = useState<number | null>(null);
  const [signale, setSignale] = useState<DemandeProApi | null>(null);
  const [motifPro, setMotifPro] = useState<string | null>(null);
  const [recit, setRecit] = useState("");

  useEffect(() => {
    const arret = new AbortController();
    api.demandesRecues(arret.signal).then(setDemandes, (e) => {
      if (e?.name === "AbortError") return;
      setErreur(e instanceof ErreurApi && e.statut === 403 ? "Votre compte n'est pas encore relié à une fiche de prestataire." : messageErreur(e));
    });
    return () => arret.abort();
  }, []);

  const agir = async (d: DemandeProApi, action: Parameters<typeof api.agirSurDemande>[1], titre: string, corps?: Record<string, unknown>) => {
    setOccupe(d.id);
    try {
      const maj = await api.agirSurDemande(d.id, action, corps);
      setDemandes((liste) => liste?.map((x) => (x.id === maj.id ? maj : x)) ?? null);
      toast(titre, "Le client est prévenu dans l'application.");
      return true;
    } catch (e) {
      toast("Action impossible", messageErreur(e), "danger");
      return false;
    } finally {
      setOccupe(null);
    }
  };

  const visibles = (demandes ?? []).filter((d) => FILTRES.find((f) => f.cle === filtre)!.statuts.includes(d.statut));

  return (
    <EspacePro titre="Commandes et demandes reçues">
      <div data-r="demandes-recues" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Stats
          items={FILTRES.map((f) => ({
            libelle: f.nom,
            valeur: chiffre((demandes ?? []).filter((d) => f.statuts.includes(d.statut)).length),
            icone: f.cle === "nouvelles" ? "inbox" : f.cle === "en_cours" ? "clock" : "circle-check",
            badge: f.cle === "nouvelles" && (demandes ?? []).some((d) => d.statut === "envoyee") ? { texte: "À répondre", ton: "warning" as const } : undefined,
          }))}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "19px", letterSpacing: "-0.02em" }}>{FILTRES.find((f) => f.cle === filtre)!.nom}</h2>
          <Nouveau n={(demandes ?? []).filter((d) => d.statut === "envoyee").length} texte="nouvelles" />
          <span style={{ marginLeft: "auto" }}>
            <Filtres
              options={FILTRES.map((f) => ({ cle: f.cle, nom: `${f.nom} (${(demandes ?? []).filter((d) => f.statuts.includes(d.statut)).length})` }))}
              valeur={filtre}
              onChange={setFiltre}
            />
          </span>
        </div>
        {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}
        {demandes && visibles.length === 0 && (
          <p role="status" style={{ margin: 0, padding: "24px 0", textAlign: "center", color: GRIS }}>
            Rien ici pour l'instant.
          </p>
        )}

        {visibles.map((d) => (
          <CarteRecue
            key={d.id}
            d={d}
            occupe={occupe === d.id}
            onAccepter={() => agir(d, "accepter", d.commande ? "Commande acceptée" : "Demande acceptée")}
            onRefuser={() => setRefus(d)}
            onEtape={() => agir(d, "etape", `Étape : ${d.commande?.etape_suivante?.libelle}`)}
            onDemarrer={() => agir(d, "demarrer", "Intervention démarrée")}
            onTerminer={() => agir(d, "terminer", "Intervention terminée")}
            onSignaler={() => setSignale(d)}
          />
        ))}
      </div>

      {refus && (
        <Dialogue
          titre={refus.commande ? "Refuser la commande" : "Refuser la demande"}
          description="Dites au client pourquoi : il pourra s'adresser ailleurs."
          icone="x"
          fond="var(--state-danger-soft)"
          encre="var(--state-danger)"
          confirmer="Refuser"
          onFermer={() => setRefus(null)}
          onConfirmer={async () => {
            if (await agir(refus, "refuser", "Refus envoyé", { motif: motif.trim() })) {
              setRefus(null);
              setMotif("");
            }
          }}
        >
          <textarea
            className="sy-textarea"
            aria-label="Motif du refus"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex. machines en panne jusqu'à jeudi"
            style={{ borderRadius: 14 }}
          />
        </Dialogue>
      )}

      {signale && (
        <Dialogue
          titre="Signaler un problème"
          description="L'équipe TerraClick lit votre déclaration, écoute aussi le client, puis décide."
          icone="flag"
          fond="var(--state-danger-soft)"
          encre="var(--state-danger)"
          confirmer="Envoyer"
          onFermer={() => setSignale(null)}
          onConfirmer={async () => {
            if (!motifPro || recit.trim().length < 5) {
              toast("Déclaration incomplète", "Choisissez le motif et décrivez ce qui s'est passé.", "danger");
              return;
            }
            try {
              const maj = await api.signalerCommePro(signale.id, { motif: motifPro, message: recit.trim() });
              setDemandes((liste) => liste?.map((x) => (x.id === maj.id ? maj : x)) ?? null);
              toast("Problème signalé", "L'équipe TerraClick va l'examiner.");
              setSignale(null);
              setMotifPro(null);
              setRecit("");
            } catch (e) {
              toast("Signalement impossible", messageErreur(e), "danger");
            }
          }}
        >
          <div role="radiogroup" aria-label="Motif" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {(signale.motifs_prestataire ?? []).map((m) => (
              <button key={m.cle} type="button" role="radio" aria-checked={motifPro === m.cle} onClick={() => setMotifPro(m.cle)} className={`sy-tag${motifPro === m.cle ? " sy-tag--selected" : ""}`}>
                {m.nom}
              </button>
            ))}
          </div>
          <textarea className="sy-textarea" aria-label="Ce qui s'est passé" value={recit} onChange={(e) => setRecit(e.target.value)} placeholder="Ce qui s'est passé, quand…" style={{ borderRadius: 14 }} />
        </Dialogue>
      )}
    </EspacePro>
  );
}

function CarteRecue(props: {
  d: DemandeProApi;
  occupe: boolean;
  onAccepter: () => void;
  onRefuser: () => void;
  onEtape: () => void;
  onDemarrer: () => void;
  onTerminer: () => void;
  onSignaler: () => void;
}) {
  const { d } = props;
  const c = d.commande;
  const details: [string, string | null | undefined][] = c
    ? [
        ["Service", `${c.service?.nom ?? ""}${c.express ? " · Express" : ""}`],
        ["Dépôt", c.depot?.nom],
        [c.depot?.cle === "pressing" ? "Dépôt prévu" : "Collecte", creneauLisible(d.date_souhaitee, c.heure)],
        ["Adresse", [c.adresse, d.quartier?.nom, d.repere].filter(Boolean).join(" · ")],
        ["Instructions", d.precision],
        ["Paiement", d.paiement_libelle],
      ]
    : [
        ["Besoin", d.resume],
        ["Détail", d.precision],
        ["Repère", d.repere],
        ["Paiement", d.paiement_libelle],
      ];

  return (
    <article data-r="demande-recue" className="sy-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Icon name={c ? "shirt" : "wrench"} size={18} />
        <strong style={{ fontSize: "16px" }}>{c ? `Commande · ${d.pack?.pieces ?? 0} pièces` : d.probleme}</strong>
        <span className="sy-badge sy-badge--neutral" style={{ marginLeft: "auto" }}>
          {c?.etape_libelle ?? d.statut_libelle}
        </span>
      </div>
      {d.relance && (
        <p data-r="relance-equipe" style={{ margin: 0, padding: "8px 12px", borderRadius: 12, background: "var(--color-accent-100)", fontSize: "14px" }}>
          <strong>L'équipe TerraClick vous relance :</strong> {d.relance.message}
        </p>
      )}
      <span style={{ fontSize: "13.5px", color: GRIS }}>
        {d.reference} · {d.client.nom}
        {d.client.telephone && (
          <>
            {" · "}
            <a href={`tel:+225${d.client.telephone.replace(/\D/g, "")}`} style={{ color: "inherit", fontWeight: 600 }}>
              {d.client.telephone}
            </a>
          </>
        )}
      </span>

      {d.pack && (
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: "14.5px" }}>
          {d.pack.articles.map((a) => (
            <li key={a.cle}>
              {a.quantite} × {a.nom} — {francs(a.total)}
            </li>
          ))}
        </ul>
      )}
      <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: "14px" }}>
        {details
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} style={{ display: "contents" }}>
              <dt style={{ color: GRIS }}>{k}</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>{v}</dd>
            </div>
          ))}
      </dl>
      {d.pack && (
        <span style={{ fontSize: "15px" }}>
          Total estimé : <strong>{d.pack.total_affichage}</strong>
        </span>
      )}
      {c?.signalements?.map((s) => (
        <p key={s.id} data-r="signalement-recu" style={{ margin: 0, padding: "8px 12px", borderRadius: 12, background: "var(--state-danger-soft)", fontSize: "14px" }}>
          <strong>Signalé : {s.motif_libelle}</strong>
          {s.message ? ` — ${s.message}` : ""}
        </p>
      ))}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {d.statut === "envoyee" && (
          <>
            <button data-r="accepter-demande" disabled={props.occupe} onClick={props.onAccepter} className="sy-btn sy-btn--primary sy-btn--md">
              Accepter
            </button>
            <button disabled={props.occupe} onClick={props.onRefuser} className="sy-btn sy-btn--outline sy-btn--md">
              Refuser
            </button>
          </>
        )}
        {c?.etape_suivante && (
          <button data-r="etape-suivante" disabled={props.occupe} onClick={props.onEtape} className="sy-btn sy-btn--primary sy-btn--md" style={{ gap: 8 }}>
            <Icon name="arrow-right" size={17} />
            {c.etape_suivante.libelle}
          </button>
        )}
        {!c && d.statut === "acceptee" && (
          <button disabled={props.occupe} onClick={props.onDemarrer} className="sy-btn sy-btn--primary sy-btn--md">
            Démarrer l'intervention
          </button>
        )}
        {!c && d.statut === "en_cours" && (
          <button disabled={props.occupe} onClick={props.onTerminer} className="sy-btn sy-btn--primary sy-btn--md">
            Marquer terminée
          </button>
        )}
        {["acceptee", "en_cours", "terminee", "confirmee"].includes(d.statut) && (
          <button data-r="signaler-pro" disabled={props.occupe} onClick={props.onSignaler} className="sy-btn sy-btn--ghost sy-btn--md" style={{ color: "var(--state-danger)" }}>
            Signaler un problème
          </button>
        )}
      </div>
    </article>
  );
}
