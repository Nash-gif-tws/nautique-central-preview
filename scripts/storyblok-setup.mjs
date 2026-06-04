/**
 * storyblok-setup.mjs — ONE-TIME setup. Creates the "Boat" content type and
 * seeds the current models.json boats into a Storyblok space, so the dealer
 * starts with a full, editable CMS instead of a blank one.
 *
 * Needs (in .env): STORYBLOK_MGMT_TOKEN (personal access token), STORYBLOK_SPACE_ID
 * Run once after creating the space:  node scripts/storyblok-setup.mjs
 *
 * Safe to re-run: it skips anything that already exists.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MGMT = process.env.STORYBLOK_MGMT_TOKEN;
const SPACE = process.env.STORYBLOK_SPACE_ID;
const MAPI = process.env.STORYBLOK_MAPI || 'https://mapi.storyblok.com/v1';
// Seeded images point at the existing hosted copies; the dealer can replace any
// of them with an upload in Storyblok at any time (the field is a real upload field).
const IMG_BASE = process.env.STORYBLOK_IMG_BASE || 'https://nash-gif-tws.github.io/nautique-central-preview/';

if (!MGMT || !SPACE) {
  console.error('Missing STORYBLOK_MGMT_TOKEN and/or STORYBLOK_SPACE_ID. See STORYBLOK-SETUP.md.');
  process.exit(1);
}

const api = async (path, method = 'GET', body) => {
  const res = await fetch(`${MAPI}/spaces/${SPACE}${path}`, {
    method,
    headers: { Authorization: MGMT, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
};

// ---- 1. "Boat" content type -------------------------------------------------
const boatComponent = {
  name: 'boat',
  display_name: 'Boat',
  is_root: true,
  is_nestable: false,
  schema: {
    name:            { type: 'text',     pos: 0,  required: true, display_name: 'Model name' },
    order:           { type: 'number',   pos: 1,  display_name: 'Sort order (0 = first)' },
    class:           { type: 'text',     pos: 2,  display_name: 'Class (e.g. G-Series)' },
    discipline:      { type: 'text',     pos: 3,  display_name: 'Discipline (e.g. Wake & Surf)' },
    tagline:         { type: 'text',     pos: 4 },
    description:     { type: 'textarea', pos: 5 },
    length:          { type: 'text',     pos: 6,  display_name: 'Length' },
    beam:            { type: 'text',     pos: 7,  display_name: 'Beam' },
    capacity:        { type: 'text',     pos: 8,  display_name: 'Capacity' },
    ballast:         { type: 'text',     pos: 9,  display_name: 'Ballast' },
    dry_weight:      { type: 'text',     pos: 10, display_name: 'Dry weight' },
    fuel:            { type: 'text',     pos: 11, display_name: 'Fuel' },
    standard_engine: { type: 'text',     pos: 12, display_name: 'Standard engine' },
    top_engine:      { type: 'text',     pos: 13, display_name: 'Top engine' },
    hero:            { type: 'asset',    pos: 14, filetypes: ['images'], display_name: 'Hero image' },
    profile:         { type: 'asset',    pos: 15, filetypes: ['images'], display_name: 'Profile cutout (PNG)' },
    stern:           { type: 'asset',    pos: 16, filetypes: ['images'], display_name: 'Stern image' },
    helm:            { type: 'asset',    pos: 17, filetypes: ['images'], display_name: 'Helm image' },
  },
};

console.log('1/3  Creating "Boat" content type…');
try {
  await api('/components', 'POST', { component: boatComponent });
  console.log('     created.');
} catch (e) {
  if (/already been taken|422/.test(String(e))) console.log('     already exists — skipping.');
  else throw e;
}

// ---- 2. "Boats" folder ------------------------------------------------------
console.log('2/3  Creating "Boats" folder…');
let folderId;
try {
  folderId = (await api('/stories', 'POST', { story: { name: 'Boats', slug: 'boats', is_folder: true } })).story.id;
  console.log('     created.');
} catch (e) {
  const existing = (await api('/stories?with_slug=boats')).stories?.[0];
  if (existing) { folderId = existing.id; console.log('     already exists — skipping.'); }
  else throw e;
}

// ---- 3. Seed the boats ------------------------------------------------------
console.log('3/3  Seeding boats from models.json…');
const asset = (p) => ({ fieldtype: 'asset', filename: p.startsWith('http') ? p : IMG_BASE + p });
const models = JSON.parse(await readFile(join(ROOT, 'models.json'), 'utf8'));
let order = 0;
for (const m of models) {
  const content = {
    component: 'boat',
    name: m.name,
    order,
    class: m.class,
    discipline: m.discipline,
    tagline: m.tagline,
    description: m.description,
    length: m.specs['Length'],
    beam: m.specs['Beam'],
    capacity: m.specs['Capacity'],
    ballast: m.specs['Ballast'],
    dry_weight: m.specs['Dry weight'],
    fuel: m.specs['Fuel'],
    standard_engine: m.specs['Standard engine'],
    top_engine: m.specs['Top engine'],
    hero: asset(m.hero),
    profile: asset(m.profile),
    stern: asset(m.stern),
    helm: asset(m.helm),
  };
  try {
    await api('/stories', 'POST', { story: { name: m.name, slug: m.slug, parent_id: folderId, content }, publish: 1 });
    console.log(`     + ${m.name}`);
    order++;
  } catch (e) {
    if (/already been taken/.test(String(e))) console.log(`     • ${m.name} already exists — skipping.`);
    else throw e;
  }
}

console.log('\nDone. Now add STORYBLOK_DELIVERY_TOKEN to .env and run:  node scripts/build-models.mjs');
