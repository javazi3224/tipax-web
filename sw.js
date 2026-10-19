const CACHE_NAME = "tipax-form-v3";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./cities.json",
  "./template.xlsx",
  "./template2.xlsx",
  "./manifest.webmanifest",
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        CORE_ASSETS.map((url) => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // برای ناوبری صفحه (یعنی خود index.html)، اول شبکه رو امتحان کن تا همیشه آخرین نسخه بیاد؛
  // فقط وقتی آفلاینه از کش استفاده کن. این باعث می‌شه بعد از آپدیت صفحه، کاربر همیشه نسخه‌ی جدید رو ببینه.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached);
    })
  );
});
