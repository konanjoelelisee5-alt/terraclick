/* Service worker de TerraClick : rend l'application installable et utilisable avec une
   connexion faible.
   - Les pages : réseau d'abord, la dernière version en cache si le réseau ne répond pas.
   - Les fichiers statiques (scripts, styles, icônes, images) : cache d'abord.
   - L'API (/api) n'est JAMAIS mise en cache : elle porte le compte et les demandes du client.
   Changer VERSION à chaque modification de ce fichier purge les anciens caches. */

const VERSION = "terraclick-v2";
// Le logo de l'écran de démarrage est gardé dès l'installation : il s'affiche même hors connexion.
const COQUILLE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/logo-256.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(COQUILLE)).then(() => self.skipWaiting()));
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
    e.respondWith(
      fetch(req)
        .then((rep) => {
          const copie = rep.clone();
          caches.open(VERSION).then((cache) => cache.put("./index.html", copie));
          return rep;
        })
        .catch(() => caches.match("./index.html")),
    );
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
