/**
 * storyblok-seed-new.mjs — adds a Brand field to the Boat content type and seeds
 * the Paragon / S-Series / Matrix models into Storyblok (at the space root, like
 * the existing boats). Images point at the deployed copies. Safe to re-run.
 * Run with .env loaded:  node scripts/storyblok-seed-new.mjs
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MGMT = process.env.STORYBLOK_MGMT_TOKEN, SPACE = process.env.STORYBLOK_SPACE_ID;
const MAPI = process.env.STORYBLOK_MAPI || 'https://mapi.storyblok.com/v1';
const SITE = 'https://nash-gif-tws.github.io/nautique-central-preview/';
if (!MGMT || !SPACE) { console.error('Need STORYBLOK_MGMT_TOKEN + STORYBLOK_SPACE_ID'); process.exit(1); }

const api = async (p, m = 'GET', b) => {
  const r = await fetch(`${MAPI}/spaces/${SPACE}${p}`, { method: m, headers: { Authorization: MGMT, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text(); if (!r.ok) throw new Error(`${m} ${p} ${r.status}: ${t}`); return t ? JSON.parse(t) : {};
};

const NEW_SLUGS = ['super-air-paragon-23', 'super-air-paragon-25', 'super-air-s21', 'super-air-s23', 'super-air-s25', 'matrix-mx22', 'matrix-mxv', 'matrix-super-sport'];
const SPEC_MAP = { Length: 'length', Beam: 'beam', Capacity: 'capacity', Ballast: 'ballast', 'Dry weight': 'dry_weight', Fuel: 'fuel', 'Standard engine': 'standard_engine', 'Top engine': 'top_engine' };
const asset = (p) => (p ? { fieldtype: 'asset', filename: SITE + p } : null);

// 1. add a Brand field to the boat component (if not present)
console.log('1) Brand field on Boat component…');
const comps = await api('/components');
const boat = comps.components.find((c) => c.name === 'boat');
if (!boat) throw new Error('boat component not found');
if (!boat.schema.brand) {
  boat.schema.brand = { type: 'option', pos: 1, display_name: 'Brand', default_value: 'Nautique',
    options: [{ name: 'Nautique', value: 'Nautique' }, { name: 'Matrix', value: 'Matrix' }, { name: 'Supreme', value: 'Supreme' }] };
  await api(`/components/${boat.id}`, 'PUT', { component: boat });
  console.log('   added.');
} else { console.log('   already present.'); }

// 2. seed the new boats
console.log('2) Seeding new models…');
const models = JSON.parse(await readFile(join(ROOT, 'models.json'), 'utf8'));
let order = 6; // existing 6 are 0-5
for (const slug of NEW_SLUGS) {
  const m = models.find((x) => x.slug === slug);
  if (!m) { console.log('   ! missing in models.json:', slug); continue; }
  const content = { component: 'boat', name: m.name, brand: m.brand, order: String(order), class: m.class, discipline: m.discipline, tagline: m.tagline, description: m.description };
  for (const [label, field] of Object.entries(SPEC_MAP)) if (m.specs[label]) content[field] = m.specs[label];
  for (const t of ['hero', 'profile', 'stern', 'helm']) { const a = asset(m[t]); if (a) content[t] = a; }
  try {
    await api('/stories', 'POST', { story: { name: m.name, slug: m.slug, parent_id: 0, content }, publish: 1 });
    console.log('   +', m.slug, `(${m.brand})`);
  } catch (e) { if (/already been taken/.test(String(e))) console.log('   •', m.slug, 'exists'); else throw e; }
  order++;
}
console.log('done');
