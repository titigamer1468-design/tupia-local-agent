self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 0) return response;
        
        // Forzamos los encabezados de seguridad en el mismo celular del cliente
        const newHeaders = new Headers(response.headers);
        newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      })
      .catch((err) => fetch(event.request))
  );
});
