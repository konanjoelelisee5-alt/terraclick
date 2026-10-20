/* Service worker de TerraClick : rend l'application installable, utilisable avec une connexion
   faible, et permet de proposer les mises à jour.
   - Les pages : la version installée (en cache) d'abord, pour que l'application reste cohérente
     jusqu'à ce que l'utilisateur accepte la mise à jour ; le réseau si rien n'est en cache.
   - Les fichiers statiques (scripts, styles, icônes, images) : cache d'abord.
   - L'API (/api) n'est JAMAIS mise en cache : elle porte le compte et les demandes du client.
   Mises à jour : chaque construction remplace __VERSION__ (vite.config.ts). Le nouveau service
   worker s'installe puis attend ; l'application affiche « Mettre à jour », et ce n'est qu'à ce
   moment qu'il prend la main (message PASSER_A_LA_NOUVELLE_VERSION) et purge l'ancien cache. */

const VERSION = "terraclick-__VERSION__";
// Le logo de l'écran de démarrage est gardé dès l'installation : il s'affiche même hors connexion.
const COQUILLE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/logo-256.png"];

/** Premières versions installées (avant la demande de mise à jour) : elles ne savent pas proposer
    « Mettre à jour », la nouvelle version les remplace donc sans attendre. */
const ANCIENNES_VERSIONS = ["terraclick-v1", "terraclick-v2"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    // « reload » : la coquille de la nouvelle version vient du réseau, jamais d'un cache HTTP périmé.
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(COQUILLE.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => caches.keys())
      .then((cles) => {
        if (cles.some((c) => ANCIENNES_VERSIONS.includes(c))) self.skipWaiting();
      }),
  );
});

self.addEventListener("message", (e) => {
  if (e.data?.type === "PASSER_A_LA_NOUVELLE_VERSION") self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.includes("/api/")) return;

  if (req.mode === "navigate") {
    e.respondWith(caches.open(VERSION).then((cache) => cache.match("./index.html").then((page) => page || fetch(req))));
    return;
  }

  e.respondWith(
    caches.match(req).then(
      (enCache) =>
        enCache ||
        fetch(req).then((rep) => {
          if (rep.ok) {
            const copie = rep.clone();
            caches.open(VERSION).then((cache) => cache.put(req, copie));
          }
          return rep;
        }),
    ),
  );
});
