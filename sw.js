/* Service worker die NIETS cachet.
   GitHub Pages laat de browser bestanden 10 min cachen (max-age=600) en dat kunnen
   we daar niet uitzetten. Deze worker haalt elke aanvraag altijd vers op het net
   (cache:'no-store'), zodat prijzen na een push meteen kloppen. Offline = geen app. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req, { cache:'no-store' }));
});
