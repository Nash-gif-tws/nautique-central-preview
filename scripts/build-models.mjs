/**
 * build-models.mjs — generates a page per Nautique model + a range index,
 * from models.json. Plain Node, no deps. Run: node scripts/build-models.mjs
 * Output: <slug>.html (root) + models.html. Re-run after editing models.json.
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadModels } from './storyblok.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const V = '11'; // asset cache-bust version (bump on each deploy)

const ARROW = `<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M221.66 133.66l-72 72a8 8 0 0 1-11.32-11.32L196.69 136H40a8 8 0 0 1 0-16h156.69l-58.35-58.34a8 8 0 0 1 11.32-11.32l72 72a8 8 0 0 1 0 11.32Z"/></svg>`;
const HAMBURGER = `<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M224 128a8 8 0 0 1-8 8H40a8 8 0 0 1 0-16h176a8 8 0 0 1 8 8ZM40 72h176a8 8 0 0 0 0-16H40a8 8 0 0 0 0 16Zm176 112H40a8 8 0 0 0 0 16h176a8 8 0 0 0 0-16Z"/></svg>`;
const IG = `<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128 80a48 48 0 1 0 48 48 48 48 0 0 0-48-48Zm0 80a32 32 0 1 1 32-32 32 32 0 0 1-32 32Zm44-94a12 12 0 1 1-12-12 12 12 0 0 1 12 12Zm44 2a54.06 54.06 0 0 0-15.54-38.46A54.06 54.06 0 0 0 162 14c-15.8-.9-52.2-.9-68 0a54.06 54.06 0 0 0-38.46 15.54A54.06 54.06 0 0 0 14 68c-.9 15.8-.9 52.2 0 68a54.06 54.06 0 0 0 15.54 38.46A54.06 54.06 0 0 0 94 190c15.8.9 52.2.9 68 0a54.06 54.06 0 0 0 38.46-15.54A54.06 54.06 0 0 0 216 136c.9-15.8.9-52.16 0-68Zm-19 80a38 38 0 0 1-21 21c-14.55 5.74-49.06 4.42-65 4.42s-50.5 1.3-65-4.42a38 38 0 0 1-21-21c-5.74-14.55-4.42-49.06-4.42-65s-1.3-50.5 4.42-65a38 38 0 0 1 21-21c14.55-5.74 49.06-4.42 65-4.42s50.5-1.3 65 4.42a38 38 0 0 1 21 21c5.74 14.55 4.42 49.06 4.42 65s1.32 50.5-4.42 65Z"/></svg>`;
const FB = `<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128 24a104 104 0 0 0-16 207.21V152H88a8 8 0 0 1 0-16h24v-20.4c0-26 15.46-40.4 39.19-40.4a160.34 160.34 0 0 1 23.27 2v25.6h-13.1c-12.89 0-16.9 8-16.9 16.2V136h28.8a8 8 0 0 1 7.89 9.32l-3.2 19.2a8 8 0 0 1-7.89 6.68H144v59.21A104 104 0 0 0 128 24Z"/></svg>`;

const head = (title, desc, jsonld) => `<!doctype html>
<html lang="en-AU">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <script>(function(d){d.documentElement.className+=' js';try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)d.documentElement.className+=' anim';}catch(e){}})(document);</script>
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <link rel="preconnect" href="https://api.fontshare.com" crossorigin />
  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=switzer@400,500,600,700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css?v=${V}" />
  ${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body id="top">
  <a href="#main" class="skip-link">Skip to content</a>
  <div class="grain" aria-hidden="true"></div>`;

const header = `
  <header class="header" id="header">
    <div class="wrap header__row">
      <a href="index.html" aria-label="Nautique Central home"><img class="brand-logo" src="images/nc-logo.png" alt="Nautique Central" /></a>
      <nav class="nav" aria-label="Primary">
        <a href="models.html">Range</a>
        <a href="index.html#stock">Stock</a>
        <a href="index.html#why">Why Nautique</a>
        <a href="index.html#showrooms">Showrooms</a>
        <a href="index.html#demo">Contact</a>
      </nav>
      <a class="btn btn--primary header__cta" href="index.html#demo">Book a Demo</a>
      <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false">${HAMBURGER}</button>
    </div>
  </header>
  <div class="mnav" id="mnav">
    <a href="models.html" data-mclose>Range</a>
    <a href="index.html#stock" data-mclose>Stock</a>
    <a href="index.html#why" data-mclose>Why Nautique</a>
    <a href="index.html#showrooms" data-mclose>Showrooms</a>
    <a class="btn btn--primary" href="index.html#demo" data-mclose>Book a Demo</a>
  </div>
  <main id="main">`;

const footer = `
  </main>
  <footer class="footer">
    <div class="wrap">
      <div class="footer__grid">
        <div>
          <img class="footer__logo" src="images/nc-logo.png" alt="Nautique Central" />
          <p>Authorised dealer for Nautique, Supreme and Matrix tow boats. It's not just a boat. It's a lifestyle.</p>
          <div class="footer__socials">
            <a href="https://www.instagram.com/nautique_central" rel="noopener" aria-label="Instagram">${IG}</a>
            <a href="https://www.facebook.com/nautiquecentral" rel="noopener" aria-label="Facebook">${FB}</a>
          </div>
        </div>
        <div>
          <h4>Explore</h4>
          <div class="footer__links">
            <a href="models.html">The Range</a>
            <a href="index.html#stock">In-Stock Boats</a>
            <a href="index.html#why">Why Nautique</a>
            <a href="index.html#demo">Book a Demo</a>
            <a href="index.html#showrooms">Showrooms</a>
          </div>
        </div>
        <div>
          <h4>Showrooms</h4>
          <div class="footer__locs">
            <p class="footer__loc"><strong>New South Wales</strong>Penrith &middot; <a href="tel:+61247318744">02 4731 8744</a></p>
            <p class="footer__loc"><strong>Queensland</strong>Yatala &middot; <a href="tel:+61756792246">07 5679 2246</a></p>
            <p class="footer__loc"><strong>Victoria</strong>Braeside &middot; <a href="tel:+61370714469">03 7071 4469</a></p>
          </div>
        </div>
      </div>
      <div class="footer__legal">
        <span>&copy; 2026 Nautique Central. All rights reserved.</span>
        <span><a href="mailto:admin@nautiquecentral.com.au">admin@nautiquecentral.com.au</a></span>
      </div>
    </div>
  </footer>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollToPlugin.min.js"></script>
  <script src="app.js?v=${V}"></script>
</body>
</html>`;

function modelPage(m) {
  const specRows = Object.entries(m.specs).map(([k, v]) =>
    `<div class="spec"><span class="spec__val">${v}</span><span class="spec__label">${k}</span></div>`).join('');
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'Product', name: m.name,
    brand: { '@type': 'Brand', name: 'Nautique' }, description: m.description,
    image: m.hero.startsWith('http') ? m.hero : 'https://nash-gif-tws.github.io/nautique-central-preview/' + m.hero,
    category: 'Tow boat'
  };
  return head(`${m.name} | Nautique Central`, m.description.replace(/"/g, "'"), jsonld) + header + `
    <section class="mhero">
      <div class="mhero__media"><img src="${m.hero}" alt="${m.name} on the water" fetchpriority="high" /></div>
      <div class="wrap mhero__inner">
        <a class="mback" href="models.html">${ARROW}<span>All models</span></a>
        <p class="mhero__kicker">${m.class} &middot; ${m.discipline}</p>
        <h1>${m.name.replace('Super Air Nautique ', '')}</h1>
        <p class="mhero__tagline">${m.tagline}</p>
        <div class="mhero__cta">
          <a class="btn btn--primary" href="index.html#demo">Book a demo ${ARROW}</a>
          <a class="btn btn--ghost" href="index.html#stock">Browse stock</a>
        </div>
      </div>
    </section>

    <section class="section mbody">
      <div class="wrap mbody__grid">
        <div class="mbody__intro" data-reveal>
          <p class="mhero__kicker" style="color:var(--accent)">${m.name}</p>
          <p class="mbody__desc">${m.description}</p>
          <div class="mbody__profile"><img src="${m.profile}" alt="${m.name} profile" loading="lazy" /></div>
        </div>
        <div class="mspecs" data-reveal>
          ${specRows}
        </div>
      </div>
    </section>

    <section class="mfeatures">
      <figure class="mfeature" data-reveal-img><img src="${m.stern}" alt="${m.name} stern" loading="lazy" /><figcaption>Surf-ready stern</figcaption></figure>
      <figure class="mfeature" data-reveal-img><img src="${m.helm}" alt="${m.name} helm" loading="lazy" /><figcaption>The helm</figcaption></figure>
    </section>

    <section class="section closer">
      <div class="wrap" data-reveal>
        <h2 data-mask>Ride the ${m.name.replace('Super Air Nautique ', '')}.</h2>
        <div class="closer__cta">
          <a class="btn btn--primary" href="index.html#demo">Book an On-Water Demo ${ARROW}</a>
          <a class="btn btn--ghost" href="index.html#showrooms">Find Your Showroom</a>
        </div>
      </div>
    </section>` + footer;
}

function indexPage(models) {
  const cards = models.map((m) => `
        <a class="mcard" href="${m.slug}.html">
          <div class="mcard__media"><img src="${m.profile}" alt="${m.name}" loading="lazy" /></div>
          <div class="mcard__body">
            <span class="mcard__kicker">${m.class} &middot; ${m.discipline}</span>
            <h3>${m.name.replace('Super Air Nautique ', '')}</h3>
            <p>${m.tagline}</p>
            <span class="mcard__go">${m.specs.Length} &middot; ${m.specs.Capacity} ${ARROW}</span>
          </div>
        </a>`).join('');
  return head('The Range | Nautique Central', 'Explore the Nautique range — G-Series, GS-Series and the Ski Nautique. Book an on-water demo at your nearest showroom.', null) + header + `
    <section class="section range-index">
      <div class="wrap">
        <div class="head" data-reveal>
          <p class="eyebrow">The Range</p>
          <h2 class="section-h" data-mask>Every boat<br>we build.</h2>
          <p class="lede">From the record-setting Ski Nautique to the award-winning G-Series. Pick the one that fits how you ride, then come and feel it on the water.</p>
        </div>
        <div class="models-grid" data-reveal>
          ${cards}
        </div>
      </div>
    </section>

    <section class="section closer">
      <div class="wrap" data-reveal>
        <h2 data-mask>Not sure which one?</h2>
        <div class="closer__cta">
          <a class="btn btn--primary" href="index.html#demo">Book a demo ${ARROW}</a>
          <a class="btn btn--ghost" href="index.html#showrooms">Talk to our team</a>
        </div>
      </div>
    </section>` + footer;
}

const models = await loadModels(ROOT);
for (const m of models) {
  await writeFile(join(ROOT, `${m.slug}.html`), modelPage(m), 'utf8');
  console.log('wrote', `${m.slug}.html`);
}
await writeFile(join(ROOT, 'models.html'), indexPage(models), 'utf8');
console.log('wrote models.html');
console.log(`done — ${models.length} model pages + index`);
