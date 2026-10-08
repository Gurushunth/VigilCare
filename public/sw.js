/* PatientShield service worker: precache the whole app so a full reload
 * works with the network off. Precache list: /sw-manifest.js (generated
 * after `next build` by scripts/gen-sw-manifest.mjs). */
importScripts("/sw-manifest.js");

const CACHE = `patientshield-${self.__PS_BUILD_ID}`;
const PRECACHE = self.__PS_PRECACHE || [];
const NAV_TIMEOUT_MS = 3000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // One by one so a single failure does not abort the whole install.
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "reload" });
            if (res.ok) await cache.put(url, res);
          } catch {
            /* retried at runtime */
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("patientshield-") && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

async function fromCache(request, fallbackPath) {
  const cache = await caches.open(CACHE);
  return (
    (await cache.match(request, { ignoreSearch: true })) ||
    (fallbackPath && (await cache.match(fallbackPath))) ||
    Response.error()
  );
}

// Pages: network first (with a timeout for "lie-fi" in hospital corridors), cache fallback.
async function handleNavigation(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  try {
    const res = await Promise.race([fetch(request), timeout(NAV_TIMEOUT_MS)]);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(path, res.clone());
    }
    return res;
  } catch {
    return fromCache(path, "/");
  }
}

// Build assets and public files: cache first, they are immutable per build.
async function handleAsset(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, { ignoreSearch: true });
  if (hit) return hit;
  try {
    const res = await fetch(request);
    if (res.ok && res.type === "basic") cache.put(request, res.clone());
    return res;
  } catch {
    return Response.error();
  }
}

// Everything else on our origin (e.g. RSC payloads): network first, cache fallback.
async function handleOther(request) {
  try {
    const res = await fetch(request);
    if (res.ok && res.type === "basic") (await caches.open(CACHE)).put(request, res.clone());
    return res;
  } catch {
    return fromCache(request);
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw.js" || url.pathname === "/sw-manifest.js") return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
  } else if (url.pathname.startsWith("/_next/static/") || PRECACHE.includes(url.pathname)) {
    event.respondWith(handleAsset(request));
  } else {
    event.respondWith(handleOther(request));
  }
});
