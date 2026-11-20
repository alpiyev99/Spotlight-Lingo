import { cp, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'dist');
const dst = path.join(root, 'dist-firefox');

if (!existsSync(src)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

await rm(dst, { recursive: true, force: true });
await cp(src, dst, { recursive: true });

const manifestPath = path.join(dst, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

// Firefox: MV2 so host permissions are granted at install time
// (MV3 in Firefox requires the user to opt in to each site manually).
const sw = manifest.background?.service_worker;
manifest.manifest_version = 2;
manifest.background = {
  scripts: sw ? [sw] : manifest.background?.scripts ?? [],
};
manifest.browser_action = { ...manifest.action, default_area: 'navbar' };
delete manifest.action;
manifest.permissions = [
  ...(manifest.permissions ?? []),
  ...(manifest.host_permissions ?? []),
  'https://api.mymemory.translated.net/*',
  'https://dictionary.yandex.net/*',
  'https://translate.googleapis.com/*',
];
delete manifest.host_permissions;
manifest.web_accessible_resources = (manifest.web_accessible_resources ?? []).flatMap(
  (r) => (typeof r === 'string' ? [r] : r.resources),
);

manifest.browser_specific_settings = {
  gecko: {
    id: 'spotlight-lingo@alpiev.dev',
    strict_min_version: '127.0',
    data_collection_permissions: {
      required: ['websiteContent'],
    },
  },
};

manifest.name = 'Spotlight Lingo: Subtitle Translator';

await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Firefox build ready at ${path.relative(root, dst)}/`);
