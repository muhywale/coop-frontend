self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
// Network only: financial data is never served from a cache
self.addEventListener("fetch", () => {});
