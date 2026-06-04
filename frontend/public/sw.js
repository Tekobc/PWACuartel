// sw.js — Service Worker para PWA Cuartel Bomberos
const CACHE_NAME = 'bomberos-v1';
const API_BASE = 'http://localhost:4000';
const DB_NAME = 'bomberos-offline';
const DB_VERSION = 1;
const STORE_PENDIENTES = 'inspecciones_pendientes';
const STORE_UNIDADES = 'unidades_cache';
const STORE_RUTINAS = 'rutinas_cache';

// Archivos del frontend a cachear en instalación
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// ─── Instalación: cachear assets estáticos ───────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activación: limpiar caches viejos ───────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── Fetch: estrategia según tipo de request ─────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Peticiones a la API
  if (url.origin === API_BASE || url.port === '4000') {
    if (request.method === 'POST' && url.pathname === '/inspecciones') {
      // POST de inspección: si hay conexión sube directo, si no guarda en IDB
      event.respondWith(handlePostInspeccion(request));
      return;
    }
    if (request.method === 'GET') {
      // GET de API: network first, fallback a IDB cache
      event.respondWith(handleApiGet(request, url));
      return;
    }
  }

  // Assets del frontend: cache first, fallback a network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    }))
  );
});

// ─── POST /inspecciones ───────────────────────────────────────────────────────
async function handlePostInspeccion(request) {
  const body = await request.json();
  try {
    const response = await fetch(new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }));
    return response;
  } catch {
    // Sin conexión: guardar en IDB y registrar sync
    await guardarPendiente(body);
    await self.registration.sync.register('sync-inspecciones');
    return new Response(
      JSON.stringify({ offline: true, mensaje: 'Guardado localmente. Se enviará al recuperar conexión.' }),
      { status: 202, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ─── GET de API con fallback a IDB ───────────────────────────────────────────
async function handleApiGet(request, url) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const data = await response.json();
      // Guardar en IDB para uso offline
      if (url.pathname === '/unidades') {
        await idbSet(STORE_UNIDADES, 'lista', data);
      } else if (url.pathname.startsWith('/rutina/')) {
        const unidadId = url.pathname.split('/').pop();
        await idbSet(STORE_RUTINAS, `rutina_${unidadId}`, data);
      }
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return response;
  } catch {
    // Sin conexión: responder desde IDB
    if (url.pathname === '/unidades') {
      const cached = await idbGet(STORE_UNIDADES, 'lista');
      if (cached) return jsonResponse(cached);
    } else if (url.pathname.startsWith('/rutina/')) {
      const unidadId = url.pathname.split('/').pop();
      const cached = await idbGet(STORE_RUTINAS, `rutina_${unidadId}`);
      if (cached) return jsonResponse(cached);
    }
    return new Response(JSON.stringify({ error: 'Sin conexión y sin datos cacheados' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ─── Background Sync ──────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-inspecciones') {
    event.waitUntil(subirPendientes());
  }
});

async function subirPendientes() {
  const pendientes = await idbGetAll(STORE_PENDIENTES);
  for (const item of pendientes) {
    try {
      const response = await fetch(`${API_BASE}/inspecciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      });
      if (response.ok) {
        await idbDelete(STORE_PENDIENTES, item.id);
        // Notificar a la app que se sincronizó
        const clients = await self.clients.matchAll();
        clients.forEach((client) =>
          client.postMessage({ type: 'SYNC_DONE', id: item.id })
        );
      }
    } catch {
      // Si falla, se reintentará en el próximo sync
    }
  }
}

// ─── Helpers IndexedDB ────────────────────────────────────────────────────────
function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_PENDIENTES)) {
        db.createObjectStore(STORE_PENDIENTES, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_UNIDADES)) {
        db.createObjectStore(STORE_UNIDADES, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_RUTINAS)) {
        db.createObjectStore(STORE_RUTINAS, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function guardarPendiente(data) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDIENTES, 'readwrite');
    const req = tx.objectStore(STORE_PENDIENTES).add({ data, fecha: Date.now() });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(store, key, value) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(store, key) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAll(store) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(store, id) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}
