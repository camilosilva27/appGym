// Service worker del modo demo (solo se registra con ?demo): deja la demo usable sin internet después de la primera visita.
// Archivos propios: red primero (con 3 s de espera máxima) y, si no hay señal, la copia guardada.
// Tipografías de Google: se guardan al instalar y después se sirven desde la copia.
// Al cambiar cualquier archivo de la lista, subir VERSION para que los celulares bajen lo nuevo.
const VERSION = 'appgym-demo-v1';
const PRECACHE = [
  './',
  './index.html',
  './demo-mock.js',
  './manifest-demo.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

async function cacheFonts(cache) {
  try {
    const res = await fetch(FONT_CSS);
    if (!res.ok) return;
    const css = await res.clone().text();
    await cache.put(FONT_CSS, res);
    // Google repite el mismo archivo en varios pesos; addAll rechaza duplicados.
    const files = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map(m => m[1]))];
    await cache.addAll(files);
  } catch (e) { /* sin tipografías offline se usa la de sistema */ }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(PRECACHE);
    await cacheFonts(cache);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

const withTimeout = (promise, ms) => new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('timeout')), ms);
  promise.then(r => { clearTimeout(t); resolve(r); }, e => { clearTimeout(t); reject(e); });
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    })());
    return;
  }

  // Las llamadas al backend real (otro dominio) pasan directo, sin tocar.
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const res = await withTimeout(fetch(req), 3000);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (e) {
      const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' })
        || (req.mode === 'navigate' ? await cache.match('./') : undefined);
      return hit || Response.error();
    }
  })());
});
