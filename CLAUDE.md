# Nautique Central — Client Preview Site

Static premium homepage + model pages for a Nautique dealership client. No build step, no framework.

## Stack & layout
- Vanilla HTML/CSS/JS: `index.html`, `models.html`, per-model pages (`super-air-*.html`, `matrix-*.html`, etc.)
- `app.js` + `styles.css` shared across pages; model data in `models.json`; assets in `images/`
- `PRODUCT.md` — product/spec source; `STORYBLOK-SETUP.md` — CMS notes

## Run locally
```bash
cd ~/Desktop/Claude/nautique-central-site && python3 -m http.server 8000
```
Then open http://localhost:8000 (or just open `index.html` directly).

## Deploy
GitHub Pages off `origin` = https://github.com/Nash-gif-tws/nautique-central-preview (Nash's GitHub account).
Live at https://nash-gif-tws.github.io/nautique-central-preview/ — deploys on push to the default branch.

## Known gaps before client-ready
- Placeholder reviews still in place
- Contact/enquiry form not wired to anything
