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

const sw = manifest.background?.service_worker;
manifest.background = {
  scripts: sw ? [sw] : manifest.background?.scripts ?? [],
  type: 'module',
};

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
