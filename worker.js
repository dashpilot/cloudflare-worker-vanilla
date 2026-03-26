/**
 * Loads the shell from `public/layout.html` via env.ASSETS (see wrangler.toml [assets]).
 * Deploy with Wrangler from the repo root, e.g. `npx wrangler deploy` or GitHub Actions
 * that run the same command with CLOUDFLARE_API_TOKEN set.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";

    switch (path) {
      case "/":
        return htmlPage(env, request, "Home", `
          <p>This is the home page. Try the links above.</p>
          <p class="muted">Layout is served from <code>public/layout.html</code> through the ASSETS binding.</p>
        `);
      case "/about":
        return htmlPage(env, request, "About", `
          <p>Edit <code>public/layout.html</code> to change the shared shell.</p>
          <p class="muted">Deploy with Wrangler so <code>public/</code> is uploaded with the Worker.</p>
        `);
      case "/contact":
        return htmlPage(env, request, "Contact", `
          <p>Reach out however you like; this is a static demo.</p>
          <p class="muted"><code>/api/hello</code> returns JSON.</p>
        `);
      case "/api/hello":
        return new Response(
          JSON.stringify({ message: "Hello from the Worker", path: "/api/hello" }),
          {
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          }
        );
      default:
        return notFoundPage(env, request, path);
    }
  },
};

async function htmlPage(env, request, title, bodyHtml) {
  const html = await renderLayout(env, request, title, bodyHtml);
  if (!html) {
    return new Response("Layout asset missing or unreadable.", { status: 500 });
  }
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function notFoundPage(env, request, path) {
  const bodyHtml = `
    <p>No route for <code>${escapeHtml(path)}</code>.</p>
    <p class="muted"><a href="/">Back to home</a></p>
  `;
  const html = await renderLayout(env, request, "Not found", bodyHtml);
  if (!html) {
    return new Response("Not found", { status: 404, headers: { "content-type": "text/plain" } });
  }
  return new Response(html, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function renderLayout(env, request, title, bodyHtml) {
  if (!env.ASSETS?.fetch) {
    return null;
  }
  const res = await env.ASSETS.fetch(new Request(new URL("/layout.html", request.url)));
  if (!res.ok) {
    return null;
  }
  const template = await res.text();
  return template
    .replaceAll("{{TITLE}}", escapeHtml(title))
    .replaceAll("{{BODY}}", bodyHtml);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
