// ===== SERVICE WORKER — DaSIboard PWA =====
// Cache strategy: Cache First para assets estáticos, Network First para dados JSON

const CACHE_NAME = 'dasiboard-v1';
const CACHE_STATIC = [
  './',
  './index.html',
  './css/style.css',
  './css/animations.css',
  './js/utils.js',
  './js/app.js',
  './js/calendar.js',
  './js/schedule.js',
  './js/kanban.js',
  './js/gpa.js',
  './js/faltas.js',
  './js/fluxograma.js',
  './js/newsletter.js',
  './js/docentes.js',
  './js/estudos.js',
  './js/ferramentas.js',
  './js/entidades.js',
  './js/search.js',
  './js/leetcode.js',
  './js/pacman.js',
  './js/github-events.js',
  './assets/logo-si.svg',
  './assets/logo-dasi.jpg',
];

const CACHE_DATA = [
  './data/events.json',
  './data/schedule.json',
  './data/gpa_defaults.json',
  './data/newsletter.json',
  './data/entidades.json',
  './data/estudos/estudos.json',
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache assets silently — don't fail install if some assets 404
      return Promise.allSettled(
        [...CACHE_STATIC, ...CACHE_DATA].map(url =>
          cache.add(url).catch(() => {})
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip cross-origin, POST, GitHub API, Wandbox API
  if (event.request.method !== 'GET') return;
  if (!url.origin.includes(self.location.origin) &&
      !url.hostname.includes('raw.githubusercontent.com')) return;

  // JSON data: Network First (sempre tentar atualizar)
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets: Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', event => {
  let data = { title: 'DaSIboard', body: 'Você tem uma notificação!', icon: './assets/logo-si.svg' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch(e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || './assets/logo-si.svg',
      badge: './assets/logo-si.svg',
      tag: data.tag || 'dasiboard-notif',
      data: data.url || './',
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      const match = cls.find(c => c.url.includes(self.location.origin));
      if (match) { match.focus(); return match.navigate(url); }
      return clients.openWindow(url);
    })
  );
});

// ── Background Sync (faltas check) ────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'faltas-check') {
    event.waitUntil(checkFaltasBackground());
  }
});

async function checkFaltasBackground() {
  // This would check stored faltas data and notify if thresholds crossed
  // Kept minimal since localStorage is not available in SW
}
