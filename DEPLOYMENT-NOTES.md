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
