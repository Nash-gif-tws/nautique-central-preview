/**
 * storyblok-sync.mjs — make Storyblok match models.json exactly.
 * Adds the `statement` field to the boat component, then UPSERTS every model
 * (update existing by slug, create missing e.g. Supreme) with all fields.
 * Safe to re-run. Run with .env loaded:
 *   set -a; . ./.env 2>/dev/null; set +a; node scripts/storyblok-sync.mjs
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MGMT = process.env.STORYBLOK_MGMT_TOKEN, SPACE = process.env.STORYBLOK_SPACE_ID;
const MAPI = process.env.STORYBLOK_MAPI || 'https://mapi.storyblok.com/v1';
const SITE = 'https://nash-gif-tws.github.io/nautique-central-preview/';
if (!MGMT || !SPACE) { console.error('Need STORYBLOK_MGMT_TOKEN + STORYBLOK_SPACE_ID (load .env)'); process.exit(1); }

const api = async (p, m = 'GET', b) => {
  const r = await fetch(`${MAPI}/spaces/${SPACE}${p}`, { method: m, headers: { Authorization: MGMT, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text(); if (!r.ok) throw new Error(`${m} ${p} ${r.status}: ${t}`); return t ? JSON.parse(t) : {};
};

const SPEC_MAP = { Length: 'length', Beam: 'beam', Capacity: 'capacity', Ballast: 'ballast', 'Dry weight': 'dry_weight', Fuel: 'fuel', 'Standard engine': 'standard_engine', 'Top engine': 'top_engine' };

// 1) ensure the `statement` field exists on the boat component
console.log('1) statement field on Boat component…');
const comps = await api('/components');
const boat = comps.components.find((c) => c.name === 'boat');
if (!boat) throw new Error('boat component not found — run storyblok-setup.mjs first');
if (!boat.schema.statement) {
  boat.schema.statement = { type: 'text', pos: Object.keys(boat.schema).length + 1, display_name: 'Statement (one cinematic line for the on-water band)' };
  await api(`/components/${boat.id}`, 'PUT', { component: boat });
  console.log('   added.');
} else { console.log('   already present.'); }

// 2) upsert every model from models.json
console.log('2) Upserting models…');
const models = JSON.parse(await readFile(join(ROOT, 'models.json'), 'utf8'));
const list = (await api('/stories?per_page=100')).stories || [];
const bySlug = new Map(list.map((s) => [s.slug, s]));

let i = 0;
for (const m of models) {
  const content = {
    component: 'boat', name: m.name, brand: m.brand || 'Nautique', order: String(i),
    class: m.class || '', discipline: m.discipline || '', tagline: m.tagline || '',
    statement: m.statement || '', price: m.price != null ? String(m.price) : '',
    description: m.description || '', overview: m.overview || '', best_for: m.best_for || '',
    features: (Array.isArray(m.features) ? m.features : []).map((f) => `${f.title} | ${f.body}`).join('\n'),
  };
  for (const [label, field] of Object.entries(SPEC_MAP)) if (m.specs && m.specs[label]) content[field] = m.specs[label];
  for (const t of ['hero', 'profile', 'stern', 'helm']) if (m[t]) content[t] = { fieldtype: 'asset', filename: SITE + m[t] };

  const stub = bySlug.get(m.slug);
  if (stub) { await api(`/stories/${stub.id}`, 'PUT', { story: { content }, publish: 1 }); console.log('   ~', m.slug); }
  else { await api('/stories', 'POST', { story: { name: m.name, slug: m.slug, parent_id: 0, content }, publish: 1 }); console.log('   +', m.slug, '(new)'); }
  i++;
}
console.log('done —', models.length, 'models synced');
