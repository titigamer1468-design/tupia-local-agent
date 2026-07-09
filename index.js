export default {
  async fetch(request, env, ctx) {
    // 1. Deja que Cloudflare busque y cargue el archivo HTML/JS de tu app normalmente
    const response = await env.ASSETS.fetch(request);
    
    // 2. Creamos una copia de la respuesta para poder meterle las cabeceras a la fuerza
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
    
    // 3. Devolvemos la página pintada con la seguridad activa
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
};
