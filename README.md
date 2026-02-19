# Belatstrap Website

## What changed (hardening for Vercel)

- **vercel.json**: Added strong security headers/CSP without unsafe-inline. Allows your CDN (Tailwind, unpkg, fonts.googleapis). Long-term cache for assets, no-store for HTML.
- **Frontend**: Moved huge inline CSS/JS from strapper.html into minified files (`app.min.css`, `app.min.js`). Makes “View Source” much less useful to casual copiers.
- **No functional changes**: Site works the same; music player, cursor, nav, and AOS animations unchanged.

## How to deploy on Vercel

1) Push your repo to GitHub.
2) Connect the repo on Vercel.
3) Vercel will use `vercel.json` for routing and headers automatically.
4) No build step required (assets are already minified).

If you want to run locally (Express):
```bash
npm install
npm start
```
Then visit http://localhost:3000

## Security notes (important)

- This setup **hinders casual copying** but **cannot stop a determined user** from extracting what the browser receives.
- If you ever need true protection, you must move logic to a backend API and/or require login (Vercel Edge Middleware).
- Never put secrets in frontend code.

## Files

- `strapper.html`, `about.html`, `note.html` — pages
- `app.min.css` — minified styles (from strapper.html inline)
- `app.min.js` — minified page scripts (from strapper.html inline)
- `cursor.css`, `trail.css`, `trail.min.js` — existing assets
- `vercel.json` — routing + security headers
- `package.json` — metadata/scripts (Express if you run locally)

## Optional: further hardening

- Add Vercel Edge Middleware to require auth
- Use a build step (esbuild/webpack) to bundle everything and obfuscate JS
- Move any sensitive endpoints to serverless functions

---
