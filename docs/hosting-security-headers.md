# Hosting security headers

Recommended response headers for the **production** Vite SPA build (`dist/`).  
External origins today: **Google Fonts only** (`fonts.googleapis.com` CSS + `fonts.gstatic.com` font files). Same-origin for JS, CSS, images, and assets. No Tailwind CDN, no AI Studio, no third-party APIs.

Apply these at the **host** (Netlify / Cloudflare Pages / nginx). Do not rely on a `<meta http-equiv>` CSP for `frame-ancestors` or report-only parity.

---

## Recommended CSP

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob:;
  connect-src 'self';
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests
```

| Directive | Why |
|-----------|-----|
| `script-src 'self'` | Prod Vite/React ships static modules — **no `unsafe-eval`**, no CDN scripts. |
| `style-src … 'unsafe-inline' fonts.googleapis.com` | Inline `<style>` in `index.html` + React `style={}` attrs; Google Fonts CSS stylesheet. |
| `font-src … fonts.gstatic.com` | WOFF2 from Google Fonts (Silkscreen, VT323). |
| `img-src … data: blob:` | Inline SVG noise/`data:` backgrounds; any blob previews. |
| `connect-src 'self'` | No analytics/API hosts yet — add origins when needed. |
| `object-src 'none'` / `frame-ancestors 'none'` | Block plugins and clickjacking. |

**Avoid:** `cdn.tailwindcss.com`, AI Studio / Gemini hostnames, `unsafe-eval`, `script-src *`, broad `https:`.

**Dev note:** `npm run dev` (Vite HMR/WebSocket) needs looser CSP or none; enforce CSP only on the static host for `dist/`.

---

## Companion headers

```http
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Frame-Options: DENY
```

(`frame-ancestors 'none'` is the modern equivalent of `X-Frame-Options`; keep both for older clients.)

---

## Netlify — `public/_headers` (or `dist/_headers` post-build)

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: DENY
```

SPA fallback stays in `netlify.toml` / `_redirects` (`/* /index.html 200`); headers above apply to all routes.

---

## Cloudflare Pages — `public/_headers`

Same `_headers` syntax as Netlify:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: DENY
```

Place under `public/` so Vite copies it into `dist/`.

---

## Generic nginx

```nginx
server {
  listen 443 ssl http2;
  server_name example.com;
  root /var/www/shinobi-way/dist;
  index index.html;

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Immutable hashed assets (Vite)
  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
  }

  add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  add_header X-Frame-Options "DENY" always;
}
```

---

## Future: self-host Silkscreen + VT323

Today `index.html` loads:

- `https://fonts.googleapis.com/css2?family=Silkscreen…&family=VT323…`
- font files from `fonts.gstatic.com`

After self-hosting (e.g. `public/fonts/*.woff2` + `@font-face` in the design system):

1. Remove Google Fonts `<link>` / `preconnect` from `index.html`.
2. Tighten CSP to same-origin only:

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  img-src 'self' data: blob:;
  connect-src 'self';
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests
```

That matches the integration-readiness “Self-host fonts / full CSS pipeline” item and drops the only third-party origin from the policy.

Optional later: replace `'unsafe-inline'` in `style-src` with hashes/nonces once the inline block in `index.html` is gone and attribute styles are reduced.

---

## Checklist when enabling

1. Deploy `dist/` behind the headers above.
2. Hard-refresh; DevTools → Console: no CSP violations for scripts, fonts, or images.
3. Confirm Silkscreen titles + VT323 body still load (Network → fonts.gstatic or self-hosted).
4. If you add analytics/APIs later, extend `connect-src` explicitly — do not open `default-src`.
