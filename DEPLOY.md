# Deploy to Vercel

This app is a Vite + React PWA. It deploys as **static files only** — no server, no database, no environment variables.

## 1. Push to GitHub
```bash
git add .
git commit -m "Production build"
git push
```

## 2. Import on Vercel
1. Go to [vercel.com → Add New → Project](https://vercel.com/new) and import the repo.
2. Framework preset: **Vite** (auto-detected).
3. Build settings (also in `vercel.json`, so you can leave defaults):

| Setting | Value |
|---|---|
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm ci` |

4. Click **Deploy**. Vercel gives you an `https://your-app.vercel.app` URL automatically (HTTPS is required for PWA install + notifications — it's automatic on Vercel).

## 3. How routing works on Vercel
`vercel.json` uses **filesystem-first** routes:
- Real files (`/sw.js`, `/manifest.webmanifest`, `/assets/*`, `/audio/*.wav`, `/icons/*`) are served directly.
- Everything else (`/today`, `/add`, `/calendar`, `/music`, …) falls back to `/index.html` so React Router can handle it (SPA).
- `/sw.js` is `no-cache` so PWA updates roll out immediately; hashed assets + bundled songs are `immutable` for fast offline loads.

> No SPA fallback = browser refresh on `/music` would 404. The fallback above prevents that.

## 4. Install on your Android phone
1. Open your `https://…vercel.app` link in **Chrome**.
2. Tap **⋮ → Install app / Add to Home screen**.
3. Allow **Notifications** when asked, then in Android *Settings → Apps → DayFlow → Notifications* turn on Sound + Vibration.
4. Run it from the installed icon for true standalone behaviour. Keep the browser/app open for on-time rings (see Settings → Alarm behaviour for the honest limits).

## 5. Updates
- Push a commit → Vercel redeploys automatically.
- The PWA (`autoUpdate` + `no-cache` on `/sw.js`) picks up the new build on next load.

## Troubleshooting
- **White page on refresh:** make sure `vercel.json` routes are deployed (check *Deployments → Build Logs* for errors).
- **“Install” missing:** only appears on HTTPS + valid manifest + service worker. Redeploy and hard-refresh; check DevTools → Application → Manifest.
- **Notifications silent:** re-grant in browser site settings + Android app notification settings; try Settings → *Test alarm*.
