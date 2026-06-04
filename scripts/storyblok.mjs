/**
 * storyblok.mjs — data source for the model-page generator.
 *
 * If STORYBLOK_DELIVERY_TOKEN is set, pull the boats from Storyblok's Content
 * Delivery API. Otherwise fall back to the local models.json so the site still
 * builds with zero config (and nothing breaks before the CMS is wired up).
 *
 * build-models.mjs calls loadModels() and doesn't care which source it gets.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const CDN = process.env.STORYBLOK_CDN || 'https://api.storyblok.com';

// Storyblok stores each spec as its own field; map field name -> display label.
const SPEC_FIELDS = {
  length: 'Length',
  beam: 'Beam',
  capacity: 'Capacity',
  ballast: 'Ballast',
  dry_weight: 'Dry weight',
  fuel: 'Fuel',
  standard_engine: 'Standard engine',
  top_engine: 'Top engine',
};

// An asset field is an object { filename, ... }; tolerate a plain string too.
function assetUrl(field, fallback = '') {
  if (!field) return fallback;
  if (typeof field === 'string') return field || fallback;
  return field.filename || fallback;
}

function mapStory(story) {
  const c = story.content || {};
  const specs = {};
  for (const [field, label] of Object.entries(SPEC_FIELDS)) {
    if (c[field]) specs[label] = c[field];
  }
  return {
    name: c.name || story.name,
    slug: story.slug,
    brand: c.brand || 'Nautique',
    class: c.class || '',
    discipline: c.discipline || '',
    tagline: c.tagline || '',
    description: c.description || '',
    specs,
    hero: assetUrl(c.hero),
    profile: assetUrl(c.profile),
    stern: assetUrl(c.stern),
    helm: assetUrl(c.helm),
    order: Number.isFinite(+c.order) ? +c.order : 999,
  };
}

export async function loadModels(ROOT) {
  const token = process.env.STORYBLOK_DELIVERY_TOKEN;

  if (token) {
    const params = new URLSearchParams({
      token,
      version: process.env.STORYBLOK_VERSION || 'published',
      per_page: '100',
      cv: String(Date.now()), // bust Storyblok's CDN cache so fresh edits build
    });
    // boats live at the space root (full_slug == slug) so the Visual Editor preview
    // resolves to /<slug> on the site; we select them by component below.
    const res = await fetch(`${CDN}/v2/cdn/stories?${params}`);
    if (!res.ok) {
      throw new Error(`Storyblok fetch failed: ${res.status} ${res.statusText}. Check STORYBLOK_DELIVERY_TOKEN / region.`);
    }
    const data = await res.json();
    const models = (data.stories || [])
      .filter((s) => !s.is_folder && (s.content?.component === 'boat'))
      .map(mapStory)
      .sort((a, b) => a.order - b.order);
    if (!models.length) {
      throw new Error('Storyblok returned 0 boats under "boats/". Run scripts/storyblok-setup.mjs, or check the token.');
    }
    console.log(`loaded ${models.length} boats from Storyblok`);
    return models;
  }

  const local = JSON.parse(await readFile(join(ROOT, 'models.json'), 'utf8'));
  console.log(`loaded ${local.length} boats from models.json (local fallback — STORYBLOK_DELIVERY_TOKEN not set)`);
  return local;
}
