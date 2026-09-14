# Bon Appétit — Weekly Meal Planner

A single-page weekly meal planner: plan breakfast/lunch/snack/dinner at a
glance, save meals to a library (with protein / healthy fats / liver /
thyroid / metabolic tags), and keep a swipe-to-check grocery list.

## What's in here

- **`index.html`** — the entire app. It's a static file with no build step:
  React, Babel (for in-browser JSX), Tailwind, and the fonts all load from
  public CDNs at runtime. This is the only file Netlify needs to serve.
- **`source/bon-appetit-meal-planner.jsx`** — the plain React source, kept
  here for reference if you (or Claude) want to keep editing the app later.
  Netlify doesn't need this file; it's not built or bundled.
- **`netlify.toml`** — tells Netlify to publish the root folder as-is, with
  no build command.

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
- **Requires internet:** the app loads React/Tailwind/fonts from CDNs on
  each load, so it won't work fully offline.
- **No backend:** everything is client-side. There's nothing to configure
  on Netlify beyond the static file hosting above.
