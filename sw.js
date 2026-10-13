// Mi Menú · trabajador sin conexión (v0.14 de prueba)
const VERSION = 'mimenu-v0.17e';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './ojo-cerrado.png', './ojo-abierto.png'];

self.addEventListener('install', e => {
  // cache:'reload' = pedir al servidor, no a la caché del navegador (GitHub guarda las páginas unos 10 minutos)
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Primero la red (para recibir versiones nuevas); si no hay conexión, lo guardado.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).hostname.endsWith('supabase.co')) return; // los datos van siempre a la base de datos, nunca a la caché
  e.respondWith(
    // lo de la propia app se pide sin la caché del navegador; lo de fuera (letras, librería) tal cual
    (new URL(e.request.url).origin === self.location.origin ? fetch(e.request.url, { cache: 'no-cache' }) : fetch(e.request)).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
