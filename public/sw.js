/**
 * MisiPintar Service Worker
 * Strategy:
 *   - /_next/static/*  → Cache-First (content-hashed, safe forever)
 *   - Public pages     → Network-First with offline fallback
 *   - /api/* /dashboard/* /admin/* /superadmin/* → Network-Only (never cache)
 */

const CACHE_NAME = 'misi-pintar-v2';
const STATIC_CACHE = 'misi-pintar-static-v2';
const OFFLINE_URL = '/offline';

const PRECACHE_URLS = [
  '/offline',
];

const NEVER_CACHE = [
  '/api/',
  '/dashboard/',
  '/admin/',
  '/superadmin/',
  '/login',
];

// ── Install: pre-cache public pages ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-cache partial failure (ok on first install):', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean stale caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map((k) => {
            console.log('[SW] Removing old cache:', k);
            return caches.delete(k);
          })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const path = url.pathname;

  // ── Network-Only: sensitive routes ──────────────────────────────────────────
  if (NEVER_CACHE.some((p) => path.startsWith(p))) return;

  // ── Cache-First: Next.js static assets (content-hashed, safe forever) ──────
  if (path.startsWith('/_next/static/') || path.startsWith('/icons/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // ── Network-First: HTML pages with offline fallback ──────────────────────────
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const response = await fetch(request);
        // Cache successful HTML responses
        if (response.ok && request.headers.get('accept')?.includes('text/html')) {
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        // Offline: return cached page or offline fallback
        const cached = await cache.match(request);
        if (cached) return cached;
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          const offline = await cache.match(OFFLINE_URL);
          if (offline) return offline;
        }
        return new Response('Tidak ada koneksi internet.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    })
  );
});
