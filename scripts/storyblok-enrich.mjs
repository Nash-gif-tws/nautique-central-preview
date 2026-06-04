/**
 * storyblok-enrich.mjs — adds the richer PDP fields (price, overview, best_for,
 * features) to the Boat content type and fills them in on all 14 stories from
 * models.json. Idempotent / safe to re-run. Run with .env loaded:
 *   set -a; . ./.env 2>/dev/null; set +a; node scripts/storyblok-enrich.mjs
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MGMT = process.env.STORYBLOK_MGMT_TOKEN, SPACE = process.env.STORYBLOK_SPACE_ID;
const MAPI = process.env.STORYBLOK_MAPI || 'https://mapi.storyblok.com/v1';
if (!MGMT || !SPACE) { console.error('Need STORYBLOK_MGMT_TOKEN + STORYBLOK_SPACE_ID (load .env)'); process.exit(1); }

const api = async (p, m = 'GET', b) => {
  const r = await fetch(`${MAPI}/spaces/${SPACE}${p}`, { method: m, headers: { Authorization: MGMT, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text(); if (!r.ok) throw new Error(`${m} ${p} ${r.status}: ${t}`); return t ? JSON.parse(t) : {};
};

// 1) add the new fields to the boat component (only if missing)
console.log('1) Enrich Boat component schema…');
const comps = await api('/components');
const boat = comps.components.find((c) => c.name === 'boat');
if (!boat) throw new Error('boat component not found — run storyblok-setup.mjs first');
const NEW_FIELDS = {
  price: { type: 'text', display_name: 'Price (AUD, digits only — e.g. 370000)' },
  overview: { type: 'textarea', display_name: 'Overview (2 paragraphs, blank line between)' },
  best_for: { type: 'text', display_name: 'Best for (one line)' },
  features: { type: 'textarea', display_name: 'Key features — one per line as: Title | description' },
};
let pos = Object.keys(boat.schema).length;
let changed = false;
for (const [key, def] of Object.entries(NEW_FIELDS)) {
  if (!boat.schema[key]) { boat.schema[key] = { ...def, pos: ++pos }; changed = true; console.log('   + field', key); }
}
if (changed) { await api(`/components/${boat.id}`, 'PUT', { component: boat }); console.log('   schema updated.'); }
else console.log('   all fields already present.');

// 2) fill the fields on every story (match by slug)
console.log('2) Update stories…');
const models = JSON.parse(await readFile(join(ROOT, 'models.json'), 'utf8'));
const list = (await api('/stories?per_page=100')).stories || [];
const bySlug = new Map(list.map((s) => [s.slug, s]));

for (const m of models) {
  const stub = bySlug.get(m.slug);
  if (!stub) { console.log('   ! no story for', m.slug); continue; }
  const full = (await api(`/stories/${stub.id}`)).story;
  const content = { ...full.content };
  content.price = m.price != null ? String(m.price) : '';
  content.overview = m.overview || '';
  content.best_for = m.best_for || '';
  content.features = (Array.isArray(m.features) ? m.features : []).map((f) => `${f.title} | ${f.body}`).join('\n');
  await api(`/stories/${full.id}`, 'PUT', { story: { content }, publish: 1 });
  console.log('   ✓', m.slug, `($${m.price})`);
}
console.log('done');
