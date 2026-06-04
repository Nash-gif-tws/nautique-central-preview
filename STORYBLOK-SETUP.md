# Storyblok CMS — setup (one-time, ~15 minutes)

This connects the site to **Storyblok** so the dealer can edit boats, prices,
specs and photos in a friendly dashboard — no code, no developer.

Until these steps are done the site keeps building from `models.json`, so
nothing breaks in the meantime.

---

## 1. Create the space  *(your bit — accounts can't be created for you)*
1. Sign up free at **https://app.storyblok.com** (pick the region closest to Australia when asked).
2. Create a new **Space** and name it "Nautique Central".

## 2. Collect 3 values → put them in `.env`
Copy `.env.example` to `.env`, then fill in:

| Variable | Where to find it |
|---|---|
| `STORYBLOK_DELIVERY_TOKEN` | Space → **Settings → Access Tokens** → the *Preview* or *Public* token (read-only) |
| `STORYBLOK_MGMT_TOKEN` | Your account → **Account Settings → Personal access tokens** → generate one |
| `STORYBLOK_SPACE_ID` | Space → **Settings → General** (the numeric ID) |

> If your space is in the **US** region, also switch `STORYBLOK_CDN` and `STORYBLOK_MAPI`
> to the `-us` hosts shown in `.env.example`.

## 3. Create the content type + load the 6 boats
```
node scripts/storyblok-setup.mjs
```
This creates the **Boat** content type and seeds the current six models, so the
dealer opens a full CMS instead of a blank one. (Safe to re-run — it skips
anything that already exists.)

## 4. Build the site from Storyblok
```
node scripts/build-models.mjs
```
You should see **"loaded N boats from Storyblok"**. Commit/push to deploy as usual.

## 5. Auto-rebuild on publish  *(so edits go live by themselves)*
1. Host the site on **Netlify** or **Cloudflare Pages** and copy its **Build hook** URL.
2. In Storyblok → **Settings → Webhooks** → enable *Story published / unpublished* → paste the build-hook URL.

Now: dealer edits a boat → clicks **Publish** → the site rebuilds in ~1–2 minutes. Hands-off.

---

## What the dealer does day-to-day
- **Edit a boat** — Boats → pick a model → change price/specs/photos → **Publish**.
- **Add a boat** — **+ New story** → type "Boat" → fill it in → **Publish**.
- **Mark sold / remove** — unpublish or delete the story → it drops off the site on the next build.

## Notes
- The 6 seeded boats reuse the existing hosted images. New images the dealer
  uploads go to Storyblok's own CDN (auto-optimised). On final go-live you can
  re-upload the originals through Storyblok so everything lives in one place.
- No tokens set? The build silently falls back to `models.json`. Nothing breaks.
