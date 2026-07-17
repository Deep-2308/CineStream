# CineStream — Deployment Notes

## ⚠️ Cross-Site Cookie Problem (Phase 13)

In production, the frontend (e.g. `*.vercel.app`) and backend (e.g. `*.onrender.com`)
will be on **different sites**. A `SameSite=Strict` refresh cookie will never be sent
cross-site, and auth will break only in deployment.

### Options (pick one before Phase 13):

1. **Same apex custom domain for both** — e.g. `cinestream.com` (frontend) and
   `api.cinestream.com` (backend). Cookies are same-site.
2. **`SameSite=None; Secure`** — Allows cross-site cookies. Requires HTTPS on both
   origins.
3. **Proxy `/api` through Vercel rewrites** — Frontend rewrites `/api/*` to the Render
   backend. The browser sees a same-origin request; no cross-site cookie issue.

### Current dev setup

`localhost:5173` → `localhost:5000` — same-site, so `SameSite=Strict` works fine.
`CLIENT_ORIGIN` is set to `http://localhost:5173` in `server/.env`.
`credentials: true` in CORS config enables cookie sending.

---

## Bucket CORS — HLS CDN (Phase 7 / Before Phase 13)

HLS `.m3u8` playlists and `.ts` segments are served from an external CDN bucket
(R2 or Bunny). The browser fetches these directly, so the bucket **must** allow
CORS requests from both origins:

| Origin | Purpose |
|--------|---------|
| `http://localhost:5173` | Local development |
| `https://*.vercel.app` | Preview + production deployments |
| `https://<your-custom-domain>` | If using a custom domain (Phase 13) |

### Cloudflare R2 — CORS JSON (set via Wrangler or dashboard)
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://*.vercel.app"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

### Bunny CDN
Enable "CORS Headers" in the Pull Zone settings → add both origins above
to the "Allowed Origins" field.

> ⚠️ **Without this configuration, HLS playback will fail with CORS errors in
> production even if it works locally.**

