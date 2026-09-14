# Bon Appétit — Weekly Meal Planner

A single-page weekly meal planner: plan breakfast/lunch/snack/dinner at a
glance, save meals to a library (with protein / healthy fats / liver /
thyroid / metabolic tags), and keep a swipe-to-check grocery list.

## What's in here

- **`index.html`** — the entire app, precompiled. The JSX has already been
  turned into plain JavaScript ahead of time and is inlined directly in this
  file, so the browser never has to transpile anything on the fly. It still
  loads React and Tailwind from public CDNs at runtime (there's no bundler
  or server involved), but the actual app code itself runs as-is.
- **`source/bon-appetit-meal-planner.jsx`** — the plain React/JSX source,
  kept here for reference if you (or Claude) want to keep editing the app
  later. This file is not used by the live site at all — `index.html` is
  self-contained.
- **`netlify.toml`** — tells Netlify to publish the root folder as-is, with
  no build command.
- **`favicon.ico`**, **`icons/`**, **`manifest.json`** — the browser-tab icon
  and the icon used when you "Add to Home Screen" on your phone (a small
  line-art bowl with steam). `index.html` already links to all of these.

## Deploying on Netlify

1. Push this folder to your new GitHub repo (see below).
2. In Netlify: **Add new site → Import an existing project → Deploy with
   GitHub**, and pick the repo.
3. Build settings:
   - **Build command:** leave blank
   - **Publish directory:** `.`
4. Deploy. Netlify will give you a `*.netlify.app` URL — open that on your
   phone and use "Add to Home Screen" for an app-like icon.

## Pushing this folder to your GitHub repo

From inside this folder:

```bash
git init
git add .
git commit -m "Bon Appétit meal planner"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Good to know

- **Data storage:** the app saves your meals, grocery list, and weekly plans
  in the browser's `localStorage`, scoped to whatever URL it's opened at.
  That means data won't carry over between, say, opening `index.html`
  locally vs. opening it at your Netlify URL — they're treated as different
  origins. Once you're using the Netlify URL day to day, your data will
  persist there across visits.
- **Requires internet:** the app loads React, Tailwind, and fonts from CDNs
  on each load, so it won't work fully offline. It no longer depends on an
  in-browser JSX transpiler, though — the app code itself is precompiled and
  inlined, which is what was causing the earlier stuck-on-loading screen.
- **No backend:** everything is client-side. There's nothing to configure
  on Netlify beyond the static file hosting above.
