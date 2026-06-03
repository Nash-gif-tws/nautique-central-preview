# Nautique Central — homepage (starter)

Premium dealer homepage for **Nautique Central** (authorised Nautique / Supreme / Matrix dealer, NSW / QLD / VIC).
Visual language adapted from the USA manufacturer site **nautique.com**; content and contact data from **nautiquecentral.com.au**.

## View it
```
python3 -m http.server 8123 --directory .
```
then open http://localhost:8123/  (or just open `index.html`).

## Files
- `index.html` — the page (semantic HTML, JSON-LD for the 3 dealerships)
- `styles.css` — design tokens + all section styles (one dark theme, red accent #ED1C24). Hero entrance is pure CSS so it never waits on a CDN.
- `app.js` — GSAP + ScrollTrigger motion layer: scroll reveals, hero/statement parallax, count-up stats, and the pinned horizontal "Three states" centerpiece. Header state + mobile menu run without GSAP. All gated behind reduced-motion and desktop breakpoints (mobile gets a clean vertical stack, no pin).
- `images/` — real Nautique photography + brand logos (Nautique, Supreme, Matrix)

## Motion
GSAP loads from a CDN. The flagship moment is the pinned horizontal pan through NSW / QLD / VIC with per-state stock counters. On mobile or with `prefers-reduced-motion`, this collapses to a static vertical stack and everything stays visible. Hero text animates via CSS regardless of GSAP.

## What's real vs placeholder
- **Real:** all three showroom addresses, phones, hours, emails, map links; nav; brands (Nautique, Supreme, Matrix); socials. Stock tiles link to their live in-stock pages on nautiquecentral.com.au.
- **Approximate:** stock counts (11 / 10 / 8, "30+") are from a scrape on 03/06/2026 and will drift. No prices shown (they live on boatsales).
- **To improve:** the header uses their current logo inverted to white; a proper white logo file would sharpen it. Imagery is Nautique USA's (manufacturer) photography — fine for a dealer site, but confirm licensing before a full public launch.

## Before launch (real data + wiring)
- **Enquiry form** (`#demo`): currently front-end only with a success state. Wire `#demoForm` submit to a real handler (Formspree / CRM / email) — see the NOTE in `app.js`.
- **Reviews** (Proof section): the 4.9 Google rating and the three owner quotes are PLACEHOLDERS. Replace with the real Google rating + count and genuine customer quotes (the TODO comment marks the spot in `index.html`).
- **Imagery** is Nautique USA's (manufacturer) photography — confirm licensing, and ideally swap in real per-state customer/showroom shots.
- **Stock counts** (11 / 10 / 8, "30+") are from a scrape on 03/06/2026 and will drift.

## How this grows
This is intentionally a single static page so it previews instantly. The markup is structured to drop straight into an Astro project (the Malibu build pattern), at which point the stock section can be wired to a live boatsales / AutoGate feed instead of static tiles.
