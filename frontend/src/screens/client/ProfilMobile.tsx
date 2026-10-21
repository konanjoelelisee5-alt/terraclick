import { useState, type ReactNode } from "react";
import { NOTIFICATIONS_CLIENT } from "../../data/client";
import { api, ErreurApi, messageErreur } from "../../lib/api";
import { CONFIG } from "../../lib/config";
import { reduirePhoto } from "../../lib/photo";
import { Avatar } from "../../components/Avatar";
import { useApp } from "../../state/app";
import type { Ecran } from "../../state/types";
import { BoutonRond, GrandTitre } from "../../components/GrandTitre";
import { Icon } from "../../components/Icon";
import { useDemandesClient } from "./store";

/* Profil sur téléphone. Marges de 24 px, 16 px entre les cartes, 32 px avant le menu.
   Seules les cartes mises en avant ont une ombre ; le menu est posé sur le fond.
   L'orange est le seul accent, le vert ne sert qu'au badge « Vérifié ». */

/** Gris foncé du texte secondaire (contraste d'environ 7:1 sur le fond crème). */
const GRIS = "#5C5248";
const OMBRE_DOUCE = "0 4px 16px rgba(26,22,19,.07), 0 1px 3px rgba(26,22,19,.05)";

type Ligne = { icone: string; libelle: string; ecran?: Ecran };

/** Les lignes sans écran derrière sont marquées « Bientôt » plutôt que d'être des liens morts. */
const MENU: Ligne[][] = [
  [
    { icone: "settings", libelle: "Paramètres du compte", ecran: "clientProfil" },
    { icone: "wallet", libelle: "Moyens de paiement" },
    { icone: "circle-help", libelle: "Aide & support" },
  ],
  [
    { icone: "gift", libelle: "Parrainer un ami" },
    { icone: "map-pin", libelle: "Adresses enregistrées" },
    { icone: "file-text", libelle: "Mentions légales" },
  ],
];

function Pastille({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        minWidth: 24,
        height: 24,
        padding: "0 8px",
        borderRadius: 999,
        background: "var(--color-accent)",
        color: "#fff",
        fontSize: "12.5px",
        fontWeight: 700,
        display: "grid",
        placeItems: "center",
      }}
    >
      {children}
    </span>
  );
}

function LigneMenu({ l, onClick }: { l: Ligne; onClick: () => void }) {
  const actif = !!l.ecran;
  return (
    <button
      onClick={onClick}
      disabled={!actif}
      style={{
        width: "100%",
        height: 56,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: 0,
        background: "none",
        border: 0,
        cursor: actif ? "pointer" : "default",
        font: "inherit",
        fontSize: "17px",
        color: "var(--color-text)",
        textAlign: "left",
      }}
    >
      <Icon name={l.icone} size={24} strokeWidth={1.75} />
      <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.libelle}</span>
      {actif ? <Icon name="chevron-right" size={20} color={GRIS} /> : <span style={{ fontSize: "13px", color: GRIS }}>Bientôt</span>}
    </button>
  );
}

export function ProfilMobile() {
  const { etat, set, go, exigerCompte, deconnecter } = useApp();
  const { demandes, notificationsLues } = useDemandesClient(etat.auth?.tel ?? null);
  const auth = etat.auth;
  const [envoiPhoto, setEnvoiPhoto] = useState(false);
  const [erreurPhoto, setErreurPhoto] = useState<string | null>(null);

  /** Photo choisie : réduite à 256 px sur l'appareil, enregistrée en base, affichée partout. */
  const choisirPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier || !auth) return;
    setErreurPhoto(null);
    setEnvoiPhoto(true);
    try {
      const u = await api.modifierPhoto(await reduirePhoto(fichier));
      set((s) => ({ auth: s.auth && { ...s.auth, photo: u.photo } }));
    } catch (err) {
      setErreurPhoto(err instanceof ErreurApi ? err.pour("photo") : "Cette image n'a pas pu être lue.");
    } finally {
      setEnvoiPhoto(false);
    }
  };

  const retirerPhoto = async () => {
    setErreurPhoto(null);
    try {
      await api.supprimerPhoto();
      set((s) => ({ auth: s.auth && { ...s.auth, photo: null } }));
    } catch (err) {
      setErreurPhoto(messageErreur(err));
    }
  };

  const nonLues = notificationsLues ? 0 : NOTIFICATIONS_CLIENT.filter((n) => n.nouveau).length;
  // Demandes qui attendent quelque chose du client (confirmer, répondre).
  const aTraiter = demandes.filter((d) => ["Marquée terminée", "Acceptée"].includes(d.statut)).length;
  // Une prestation terminée attend un avis : c'est ce que « Nouveau » signale.
  const avisEnAttente = demandes.some((d) => d.statut === "Terminée");

  const cloche = (
    <BoutonRond libelle="Notifications" onClick={() => go("clientNotifications")} badge={nonLues}>
      <Icon name="bell" size={22} strokeWidth={1.75} />
    </BoutonRond>
  );

  if (!auth) {
    return (
      <main style={{ paddingBottom: 32 }}>
        <GrandTitre titre="Profil" />
        <div style={{ padding: "16px 24px 0" }}>
          <p style={{ margin: "0 0 16px", fontSize: "15px", color: GRIS }}>Connectez-vous pour suivre vos demandes.</p>
          <button onClick={() => go("connexion", { telDraft: "", apresConnexion: "clientDashboard" })} className="sy-btn sy-btn--primary sy-btn--md" style={{ minHeight: 48 }}>
            Se connecter
          </button>
        </div>
      </main>
    );
  }


  return (
    <main data-r="profil-mobile" style={{ paddingBottom: 40 }}>
      <GrandTitre titre="Profil" actions={cloche} />

      <div style={{ padding: "24px 24px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 1 · Carte d'identité : toute la carte mène à « Voir mon profil » ; l'appareil photo
               sur l'avatar change la photo de profil sans quitter la page. */}
        <div
          data-r="carte-identite"
          role="button"
          tabIndex={0}
          onClick={() => go("clientProfil")}
          onKeyDown={(e) => e.key === "Enter" && go("clientProfil")}
          aria-label={`${auth.prenom}, voir mon profil`}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            padding: "28px 20px 24px",
            borderRadius: 24,
            background: "var(--color-neutral-100)",
            boxShadow: OMBRE_DOUCE,
            cursor: "pointer",
          }}
        >
          <span style={{ position: "relative" }}>
            <span style={{ opacity: envoiPhoto ? 0.5 : 1, transition: "opacity .2s" }}>
              <Avatar compte={auth} taille={96} />
            </span>
            <label
              onClick={(e) => e.stopPropagation()}
              aria-label={auth.photo ? "Changer la photo de profil" : "Ajouter une photo de profil"}
              style={{
                position: "absolute",
                right: -4,
                bottom: -4,
                width: 40,
                height: 40,
                borderRadius: 999,
                background: "var(--color-accent)",
                color: "#fff",
                border: "3px solid var(--color-neutral-100)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <Icon name="camera" size={18} strokeWidth={2.25} />
              <input type="file" accept="image/*" onChange={choisirPhoto} style={{ display: "none" }} />
            </label>
          </span>
          {erreurPhoto && (
            <span role="alert" style={{ fontSize: "13.5px", color: "var(--state-danger)" }}>
              {erreurPhoto}
            </span>
          )}
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "28px", lineHeight: 1.15, textAlign: "center" }}>{auth.prenom}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "15px", color: GRIS }}>
            Client
            {/* Numéro confirmé par un code : c'est ce que « Vérifié » garantit pour un client. */}
            <span className="sy-badge sy-badge--success" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="check" size={13} strokeWidth={2.5} />
              Vérifié
            </span>
          </span>
          {auth.photo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                retirerPhoto();
              }}
              style={{ minHeight: 44, padding: "0 8px", border: 0, background: "none", cursor: "pointer", font: "inherit", fontSize: "14px", color: GRIS, textDecoration: "underline" }}
            >
              Retirer la photo
            </button>
          )}
        </div>

        {/* 2 · Deux tuiles côte à côte */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { cle: "demandes", libelle: "Mes demandes", icone: "inbox", pastille: aTraiter ? String(aTraiter) : null, action: () => go("clientDemandes") },
            {
              cle: "avis",
              libelle: "Avis donnés",
              icone: "star",
              pastille: avisEnAttente ? "Nouveau" : null,
              action: () => go(avisEnAttente ? "avis" : "clientDemandes"),
            },
          ].map((t) => (
            <button
              key={t.cle}
              data-r={`tuile-${t.cle}`}
              onClick={t.action}
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: 16,
                border: 0,
                borderRadius: 20,
                background: "var(--color-neutral-100)",
                boxShadow: OMBRE_DOUCE,
                cursor: "pointer",
                font: "inherit",
                color: "inherit",
                textAlign: "left",
              }}
            >
              {/* Emplacement d'illustration : une icône en attendant les visuels. */}
              <span style={{ width: 56, height: 56, borderRadius: 16, background: "var(--color-accent-100)", color: "var(--color-accent-700)", display: "grid", placeItems: "center" }}>
                <Icon name={t.icone} size={28} strokeWidth={1.75} />
              </span>
              <span style={{ fontSize: "17px", fontWeight: 600 }}>{t.libelle}</span>
              {t.pastille && <Pastille>{t.pastille}</Pastille>}
            </button>
          ))}
        </div>

        {/* 3 · Devenir prestataire : carte horizontale, illustration sur un tiers. Masquée
               (CONFIG.profilComplet) : l'entrée des techniciens est dans Paramètres (menu ⋮). */}
        {CONFIG.profilComplet && (
        <button
          data-r="promo-prestataire"
          onClick={() => exigerCompte(() => go("proDashboard"))}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: 12,
            border: 0,
            borderRadius: 20,
            background: "var(--color-neutral-100)",
            boxShadow: OMBRE_DOUCE,
            cursor: "pointer",
            font: "inherit",
            color: "inherit",
            textAlign: "left",
          }}
        >
          {/* Emplacement d'illustration (environ un tiers de la largeur). */}
          <span style={{ flex: "0 0 32%", aspectRatio: "1 / 1", borderRadius: 14, background: "var(--color-surface)", color: "var(--color-accent-700)", display: "grid", placeItems: "center" }}>
            <Icon name="hard-hat" size={40} strokeWidth={1.5} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: "18px", fontWeight: 600, marginBottom: 4 }}>Devenir prestataire</span>
            <span style={{ display: "block", fontSize: "14px", lineHeight: 1.45, color: GRIS }}>
              Créez votre fiche, faites vérifier votre CNI et recevez des demandes.
            </span>
          </span>
        </button>
        )}
      </div>

      {/* 4 · Menu en liste, posé sur le fond, sans cartes */}
      <nav aria-label="Menu du profil" style={{ padding: "32px 24px 0" }}>
        {/* Profil épuré (CONFIG.profilComplet à false) : seule « Paramètres du compte » reste. */}
        {(CONFIG.profilComplet ? MENU : [MENU[0].slice(0, 1)]).map((groupe, i) => (
          <div key={i} style={{ borderTop: i ? "1px solid var(--color-divider)" : 0, paddingTop: i ? 8 : 0, marginTop: i ? 8 : 0 }}>
            {groupe.map((l) => (
              <LigneMenu key={l.libelle} l={l} onClick={() => l.ecran && go(l.ecran)} />
            ))}
          </div>
        ))}
        <div style={{ borderTop: "1px solid var(--color-divider)", marginTop: 8, paddingTop: 8 }}>
          <button
            onClick={() => {
              deconnecter();
              go("home");
            }}
            style={{ width: "100%", height: 56, display: "flex", alignItems: "center", gap: 16, padding: 0, background: "none", border: 0, cursor: "pointer", font: "inherit", fontSize: "17px", color: "var(--state-danger)", textAlign: "left" }}
          >
            <Icon name="log-out" size={24} strokeWidth={1.75} />
            Se déconnecter
          </button>
        </div>
      </nav>
    </main>
  );
}
