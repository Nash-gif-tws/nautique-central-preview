/**
 * storyblok-realpaths.mjs — point each boat's Visual Editor preview at its built
 * page. Story "boats/super-air-g23" -> real_path "/super-air-g23.html".
 * Run with .env loaded:  node scripts/storyblok-realpaths.mjs
 */
const MGMT = process.env.STORYBLOK_MGMT_TOKEN;
const SPACE = process.env.STORYBLOK_SPACE_ID;
const MAPI = process.env.STORYBLOK_MAPI || 'https://mapi.storyblok.com/v1';
if (!MGMT || !SPACE) { console.error('Need STORYBLOK_MGMT_TOKEN + STORYBLOK_SPACE_ID'); process.exit(1); }

const api = async (p, m = 'GET', b) => {
  const r = await fetch(`${MAPI}/spaces/${SPACE}${p}`, {
    method: m,
    headers: { Authorization: MGMT, 'Content-Type': 'application/json' },
    body: b ? JSON.stringify(b) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${m} ${p} -> ${r.status}: ${t}`);
  return t ? JSON.parse(t) : {};
};

const { stories } = await api('/stories?starts_with=boats/&per_page=100');
for (const s of stories) {
  if (s.is_folder) continue;
  const slug = s.full_slug.replace(/^boats\//, '');
  const real_path = `/${slug}.html`;
  await api(`/stories/${s.id}`, 'PUT', { story: { real_path } });
  console.log('set', s.full_slug, '->', real_path);
}
console.log('done');
