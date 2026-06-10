/**
 * build-models.mjs — generates a rich page per Nautique/Matrix model + a
 * price-sorted range index, from the data source (Storyblok or models.json).
 * Plain Node, no deps. Run: node scripts/build-models.mjs
 * Output: <slug>.html (root) + models.html. Re-run after editing the data.
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadModels } from './storyblok.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const V = '19'; // asset cache-bust version (bump on each deploy)
// Master price switch. false => every boat shows "Price on application" (the range
// still SORTS by the indicative price set in the data). Flip to true once real
// drive-away prices are set in Storyblok; boats with an empty price field then
// fall back to "Price on application" individually.
const SHOW_PRICES = false;
const SITE = 'https://nash-gif-tws.github.io/nautique-central-preview/';

const ARROW = `<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M221.66 133.66l-72 72a8 8 0 0 1-11.32-11.32L196.69 136H40a8 8 0 0 1 0-16h156.69l-58.35-58.34a8 8 0 0 1 11.32-11.32l72 72a8 8 0 0 1 0 11.32Z"/></svg>`;
const HAMBURGER = `<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M224 128a8 8 0 0 1-8 8H40a8 8 0 0 1 0-16h176a8 8 0 0 1 8 8ZM40 72h176a8 8 0 0 0 0-16H40a8 8 0 0 0 0 16Zm176 112H40a8 8 0 0 0 0 16h176a8 8 0 0 0 0-16Z"/></svg>`;
const IG = `<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128 80a48 48 0 1 0 48 48 48 48 0 0 0-48-48Zm0 80a32 32 0 1 1 32-32 32 32 0 0 1-32 32Zm44-94a12 12 0 1 1-12-12 12 12 0 0 1 12 12Zm44 2a54.06 54.06 0 0 0-15.54-38.46A54.06 54.06 0 0 0 162 14c-15.8-.9-52.2-.9-68 0a54.06 54.06 0 0 0-38.46 15.54A54.06 54.06 0 0 0 14 68c-.9 15.8-.9 52.2 0 68a54.06 54.06 0 0 0 15.54 38.46A54.06 54.06 0 0 0 94 190c15.8.9 52.2.9 68 0a54.06 54.06 0 0 0 38.46-15.54A54.06 54.06 0 0 0 216 136c.9-15.8.9-52.16 0-68Zm-19 80a38 38 0 0 1-21 21c-14.55 5.74-49.06 4.42-65 4.42s-50.5 1.3-65-4.42a38 38 0 0 1-21-21c-5.74-14.55-4.42-49.06-4.42-65s-1.3-50.5 4.42-65a38 38 0 0 1 21-21c14.55-5.74 49.06-4.42 65-4.42s50.5-1.3 65 4.42a38 38 0 0 1 21 21c5.74 14.55 4.42 49.06 4.42 65s1.32 50.5-4.42 65Z"/></svg>`;
const FB = `<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128 24a104 104 0 0 0-16 207.21V152H88a8 8 0 0 1 0-16h24v-20.4c0-26 15.46-40.4 39.19-40.4a160.34 160.34 0 0 1 23.27 2v25.6h-13.1c-12.89 0-16.9 8-16.9 16.2V136h28.8a8 8 0 0 1 7.89 9.32l-3.2 19.2a8 8 0 0 1-7.89 6.68H144v59.21A104 104 0 0 0 128 24Z"/></svg>`;

const head = (title, desc, jsonld, preload) => `<!doctype html>
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
  ${preload ? `<link rel="preload" as="image" href="${preload}" type="image/webp" fetchpriority="high" />` : ''}
  ${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body id="top">
  <div class="preloader" id="preloader" aria-hidden="true"><span class="preloader__bar"><i></i></span></div>
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
  <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>
  <script src="app.js?v=${V}"></script>
  <script>/* Storyblok Visual Editor bridge — only loads inside the editor */(function(){if(!/[?&]_storyblok/.test(location.search))return;var s=document.createElement('script');s.src='https://app.storyblok.com/f/storyblok-v2-latest.js';s.onload=function(){try{var b=new StoryblokBridge();b.on(['published','change'],function(){location.reload();});}catch(e){}};document.head.appendChild(s);})();</script>
</body>
</html>`;

/* ---------- helpers ---------- */
const shortName = (m) => m.name.replace('Super Air Nautique ', '');
const toWebp = (src) => (src ? src.replace(/\.(jpe?g|png)$/i, '.webp') : src);
// <picture> with a webp source + the original as fallback <img>; transparent to CSS (picture{display:contents})
const pic = (src, alt, attrs = '') => {
  if (!src) return '';
  return `<picture><source srcset="${toWebp(src)}" type="image/webp" /><img src="${src}" alt="${alt}"${attrs ? ' ' + attrs : ''} /></picture>`;
};
const abs = (src) => (!src ? '' : src.startsWith('http') ? src : SITE + src);
const fmtAUD = (n) => '$' + Number(n).toLocaleString('en-AU');
const priceNum = (m) => (m.price != null && m.price !== '' && Number(m.price) > 0 ? Number(m.price) : 0);
const showPrice = (m) => SHOW_PRICES && priceNum(m) > 0;
const priceLabel = (m) => (showPrice(m) ? `From ${fmtAUD(priceNum(m))}` : 'Price on application');
// metric-only value for headline stats: "23' 3\" (7.09 m)" / "6.7 m (22')" -> "7.09 m"
const metresOnly = (v = '') => { const s = String(v); const m = s.match(/([\d.]+)\s*m\b/); return m ? `${m[1]} m` : s; };
const peopleOnly = (v = '') => { const m = String(v).match(/(\d[\d,]*)/); return m ? m[1] : String(v); };
const stripMax = (v = '') => String(v).replace(/\s*max\s*$/i, '');

const SPEC_GROUPS = [
  ['Dimensions', ['Length', 'Beam', 'Dry weight']],
  ['Capacity', ['Capacity', 'Ballast', 'Fuel']],
  ['Power', ['Standard engine', 'Top engine']],
];
const BRAND_BLURB = {
  Nautique: 'American-built &middot; wake, surf &amp; ski',
  Matrix: 'Australian-built &middot; performance &amp; value',
  Supreme: 'American-built &middot; surf-first',
};

/* shared range/related card */
function card(m) {
  const meta = [metresOnly(m.specs.Length), m.specs.Capacity ? `${peopleOnly(m.specs.Capacity)} guests` : '']
    .filter(Boolean).join(' &middot; ');
  return `
          <a class="mcard" href="${m.slug}.html">
            <div class="mcard__media">${pic(m.profile || m.hero, m.name, 'loading="lazy"')}</div>
            <div class="mcard__body">
              <span class="mcard__kicker">${m.brand || 'Nautique'} &middot; ${m.class}</span>
              <h3>${shortName(m)}</h3>
              <p class="mcard__tag">${m.tagline}</p>
              <div class="mcard__foot">
                <span class="mcard__price${showPrice(m) ? '' : ' mcard__price--poa'}">${priceLabel(m)}</span>
                ${meta ? `<span class="mcard__meta">${meta}</span>` : ''}
              </div>
              <span class="mcard__go">View boat ${ARROW}</span>
            </div>
          </a>`;
}

function relatedModels(m, all) {
  const mp = priceNum(m);
  const bm = m.brand || 'Nautique';
  return all
    .filter((x) => x.slug !== m.slug)
    .map((x) => ({ x, sameBrand: (x.brand || 'Nautique') === bm ? 0 : 1, dist: Math.abs(priceNum(x) - mp) }))
    .sort((a, b) => a.sameBrand - b.sameBrand || a.dist - b.dist)
    .slice(0, 3)
    .map((o) => o.x);
}

function modelPage(m, all) {
  const heroImg = m.hero || m.profile || '';
  const profileImg = m.profile || m.hero || '';
  const short = shortName(m);

  // headline stat strip — always-present, short, metric
  const statDefs = [
    ['Length', metresOnly(m.specs.Length)],
    ['Beam', metresOnly(m.specs.Beam)],
    ['Guests', m.specs.Capacity ? peopleOnly(m.specs.Capacity) : ''],
    ['Max ballast', stripMax(m.specs.Ballast)],
  ].filter(([, v]) => v);
  const statBar = statDefs.map(([label, val]) =>
    `<div class="mstat"><span class="mstat__val">${val}</span><span class="mstat__label">${label}</span></div>`).join('');

  // overview narrative (richer field, falls back to description)
  const overview = (m.overview || m.description || '').trim();
  const paras = overview.split(/\n\n+/).map((p) => `<p>${p.trim()}</p>`).join('');
  const bestFor = m.best_for ? `<p class="moverview__bestfor"><span>Best for</span> ${m.best_for}</p>` : '';

  // key features
  const features = Array.isArray(m.features) ? m.features.filter((f) => f && f.title) : [];
  const featGrid = features.map((f, i) => `
          <article class="mfeat__item" data-reveal>
            <span class="mfeat__num">${String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3>${f.title}</h3>
              <p>${f.body || ''}</p>
            </div>
          </article>`).join('');
  const featSection = features.length ? `
    <section class="section mfeat">
      <div class="wrap">
        <div class="head" data-reveal>
          <p class="eyebrow">Highlights</p>
          <h2 class="section-h" data-mask>What sets the ${short} apart.</h2>
        </div>
        <div class="mfeat__grid">${featGrid}</div>
      </div>
    </section>` : '';

  // gallery — large detail shots; prefer helm/stern, fall back to hero/profile
  const primary = [[m.helm, 'At the helm'], [m.stern, 'Surf-ready stern']].filter(([s]) => s);
  let gal = primary;
  if (gal.length < 2) {
    const backup = [[m.hero, `${short} on the water`], [m.profile, `${short} profile`]].filter(([s]) => s);
    const seen = new Set(gal.map(([s]) => s));
    gal = [...gal, ...backup.filter(([s]) => !seen.has(s))].slice(0, 2);
  }
  const gallerySection = gal.length >= 2 ? `
    <section class="section mgallery">
      <div class="wrap">
        <div class="head" data-reveal>
          <p class="eyebrow">Up close</p>
          <h2 class="section-h" data-mask>Every detail considered.</h2>
        </div>
        <div class="mgallery__grid">
          ${gal.map(([src, cap]) => `<figure class="mshot" data-reveal-img>${pic(src, m.name + ' — ' + cap, 'loading="lazy"')}<figcaption>${cap}</figcaption></figure>`).join('\n          ')}
        </div>
      </div>
    </section>` : '';

  // full specs, grouped
  const specGroupsHtml = SPEC_GROUPS.map(([title, keys]) => {
    const rows = keys.filter((k) => m.specs[k] != null && m.specs[k] !== '')
      .map((k) => `<div class="specrow"><dt>${k === 'Capacity' ? 'Capacity' : k}</dt><dd>${m.specs[k]}</dd></div>`).join('');
    return rows ? `
          <div class="specgroup">
            <h4>${title}</h4>
            <dl>${rows}</dl>
          </div>` : '';
  }).filter(Boolean).join('');

  // related
  const rel = relatedModels(m, all);
  const relSection = rel.length ? `
    <section class="section mrelated">
      <div class="wrap">
        <div class="head" data-reveal>
          <p class="eyebrow">Keep exploring</p>
          <h2 class="section-h" data-mask>Other boats in the range.</h2>
        </div>
        <div class="models-grid mrelated__grid">${rel.map(card).join('')}</div>
      </div>
    </section>` : '';

  const stmt = m.statement || '';
  const stmtImg = m.stern || m.hero || m.profile || '';
  const statementSection = stmt && stmtImg ? `
    <section class="mstatement">
      <div class="mstatement__media">${pic(stmtImg, m.name + ' on the water', 'loading="lazy"')}</div>
      <div class="wrap mstatement__inner" data-reveal>
        <p class="eyebrow">On the water</p>
        <h2 class="mstatement__quote" data-mask>${stmt}</h2>
      </div>
    </section>` : '';

  const jsonld = {
    '@context': 'https://schema.org', '@type': 'Product', name: m.name,
    brand: { '@type': 'Brand', name: m.brand || 'Nautique' }, description: m.description,
    image: abs(heroImg), category: 'Tow boat',
  };

  return head(`${m.name} | Nautique Central`, (m.description || '').replace(/"/g, "'"), jsonld, toWebp(heroImg)) + header + `
    <section class="mhero">
      <div class="mhero__media">${pic(heroImg, m.name + ' on the water', 'fetchpriority="high"')}</div>
      <div class="wrap mhero__inner">
        <a class="mback" href="models.html">${ARROW}<span>All models</span></a>
        <p class="mhero__kicker">${m.brand || 'Nautique'} &middot; ${m.class} &middot; ${m.discipline}</p>
        <h1>${short}</h1>
        <p class="mhero__tagline">${m.tagline}</p>
        <div class="mhero__price"><span class="mhero__from${showPrice(m) ? '' : ' mhero__from--poa'}">${priceLabel(m)}</span>${showPrice(m) ? '<span class="mhero__pnote">Indicative &middot; drive-away on application</span>' : ''}</div>
        <div class="mhero__cta">
          <a class="btn btn--primary" href="index.html#demo">Book a demo ${ARROW}</a>
          <a class="btn btn--ghost" href="index.html#demo">Enquire about this boat</a>
        </div>
      </div>
    </section>

    <section class="mstatbar">
      <div class="wrap mstatbar__row">
        ${statBar}
      </div>
    </section>

    <section class="section moverview">
      <div class="wrap moverview__grid">
        <div class="moverview__text" data-reveal>
          <p class="eyebrow">Overview</p>
          <h2 class="section-h" data-mask>${m.tagline}</h2>
          <div class="moverview__body">${paras}</div>
          ${bestFor}
          <div class="moverview__cta">
            <a class="text-link" href="index.html#demo">Book an on-water demo ${ARROW}</a>
          </div>
        </div>
        <figure class="moverview__media" data-reveal-img>
          ${pic(profileImg, m.name + ' profile', 'loading="lazy"')}
        </figure>
      </div>
    </section>
${featSection}${gallerySection}${statementSection}
    <section class="section mspecfull">
      <div class="wrap mspecfull__grid">
        <div class="mspecfull__head" data-reveal>
          <p class="eyebrow">Specifications</p>
          <h2 class="section-h" data-mask>The numbers.</h2>
          <p class="mspecfull__note">Manufacturer figures &mdash; may vary by model year and options. Confirm exact specification with our team.</p>
        </div>
        <div class="specgroups" data-reveal>
          ${specGroupsHtml}
        </div>
      </div>
    </section>
${relSection}
    <section class="section closer">
      <div class="wrap" data-reveal>
        <h2 data-mask>Ride the ${short}.</h2>
        <div class="closer__cta">
          <a class="btn btn--primary" href="index.html#demo">Book an On-Water Demo ${ARROW}</a>
          <a class="btn btn--ghost" href="index.html#showrooms">Find Your Showroom</a>
        </div>
      </div>
    </section>` + footer;
}

function indexPage(models) {
  const order = ['Nautique', 'Supreme', 'Matrix'];
  const brands = [...new Set(models.map((m) => m.brand || 'Nautique'))]
    .sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
  const groups = brands.map((b) => {
    const list = models.filter((m) => (m.brand || 'Nautique') === b).sort((x, y) => priceNum(y) - priceNum(x));
    const blurb = BRAND_BLURB[b] ? ` &middot; ${BRAND_BLURB[b]}` : '';
    return `<section class="brand-group" data-reveal>
          <header class="brand-group__head">
            <h2 class="brand-group__title" data-mask>${b}</h2>
            <span class="brand-group__meta">${list.length} model${list.length > 1 ? 's' : ''}${blurb}</span>
          </header>
          <div class="models-grid">${list.map(card).join('')}</div>
        </section>`;
  }).join('\n        ');
  return head('The Range | Nautique Central', 'Explore the full range from Nautique and Matrix — wake, surf and ski boats, grouped by brand. Book an on-water demo at your nearest showroom.', null) + header + `
    <section class="section range-index">
      <div class="wrap">
        <div class="head" data-reveal>
          <p class="eyebrow">The Range</p>
          <h2 class="section-h" data-mask>Every boat<br>we sell.</h2>
          <p class="lede">From the flagship Paragon and the award-winning G-Series to the Australian-built Matrix. Grouped by brand and ordered by price &mdash; pick the one that fits how you ride, then feel it on the water.</p>
          <p class="range-note">${SHOW_PRICES ? 'Prices are indicative new drive-away guides in AUD. Final pricing depends on specification and options &mdash; on application.' : 'Each range is ordered by price, highest to lowest. Contact our team for drive-away pricing on any model.'}</p>
        </div>
        ${groups}
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
  await writeFile(join(ROOT, `${m.slug}.html`), modelPage(m, models), 'utf8');
  console.log('wrote', `${m.slug}.html`);
}
await writeFile(join(ROOT, 'models.html'), indexPage(models), 'utf8');
console.log('wrote models.html');
console.log(`done — ${models.length} model pages + index`);
