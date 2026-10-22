import { chmod, copyFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { minify } from 'terser';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));

// Keep deployed assets tied to the versions and integrity hashes in package-lock.json.
const copies = [
  ['jquery/dist/jquery.min.js', 'assets/js/vendor/jquery/jquery.min.js'],
  ['jquery/LICENSE.txt', 'assets/js/vendor/jquery/LICENSE.txt'],
  ['magnific-popup/dist/jquery.magnific-popup.js', 'assets/js/plugins/jquery.magnific-popup.js'],
  ['magnific-popup/LICENSE', 'assets/js/vendor/magnific-popup/LICENSE'],
  ['leaflet/dist/leaflet.js', 'talkmap/leaflet_dist/leaflet.js'],
  ['leaflet/dist/leaflet.js.map', 'talkmap/leaflet_dist/leaflet.js.map'],
  ['leaflet/dist/leaflet.css', 'talkmap/leaflet_dist/leaflet.css'],
  ['leaflet/LICENSE', 'talkmap/leaflet_dist/leaflet-LICENSE'],
  ['leaflet.markercluster/dist/leaflet.markercluster.js', 'talkmap/leaflet_dist/leaflet.markercluster.js'],
  ['leaflet.markercluster/dist/leaflet.markercluster-src.js', 'talkmap/leaflet_dist/leaflet.markercluster-src.js'],
  ['leaflet.markercluster/dist/leaflet.markercluster.js.map', 'talkmap/leaflet_dist/leaflet.markercluster.js.map'],
  ['leaflet.markercluster/dist/leaflet.markercluster-src.js.map', 'talkmap/leaflet_dist/leaflet.markercluster-src.js.map'],
  ['leaflet.markercluster/dist/MarkerCluster.css', 'talkmap/leaflet_dist/MarkerCluster.css'],
  ['leaflet.markercluster/dist/MarkerCluster.Default.css', 'talkmap/leaflet_dist/MarkerCluster.Default.css'],
  ['leaflet.markercluster/MIT-LICENCE.txt', 'talkmap/leaflet_dist/markercluster-LICENSE'],
];

const sources = [
  'assets/js/vendor/jquery/jquery.min.js',
  'assets/js/plugins/jquery.fitvids.js',
  'assets/js/plugins/jquery.greedy-navigation.js',
  'assets/js/plugins/jquery.magnific-popup.js',
  'assets/js/plugins/jquery.smooth-scroll.min.js',
  'assets/js/plugins/stickyfill.min.js',
  'assets/js/_main.js',
];

async function build() {
  const input = Object.fromEntries(await Promise.all(sources.map(async path => [path, await readFile(path, 'utf8')])));
  const { code } = await minify(input, { format: { comments: /^!|@license|@preserve/ } });
  await writeFile('assets/js/main.min.js', code + '\n');
  console.log('Built assets/js/main.min.js');
}

for (const [source, destination] of copies) {
  await mkdir(dirname(destination), { recursive: true });
  if (/\.(js|css)$/.test(source)) {
    // Normalize upstream CRLF and trailing whitespace without changing code.
    const text = await readFile('node_modules/' + source, 'utf8');
    await writeFile(destination, text.replace(/\r\n/g, '\n').replace(/[\t ]+$/gm, ''));
  } else {
    await copyFile('node_modules/' + source, destination);
  }
  await chmod(destination, 0o644);
}
await cp('node_modules/leaflet/dist/images', 'talkmap/leaflet_dist/images', { recursive: true });
await build();

if (process.argv.includes('--watch')) {
  let pending;
  let builds = Promise.resolve();
  watch('assets/js', { recursive: true }, (_event, filename) => {
    if (!filename || !filename.endsWith('.js') || filename === 'main.min.js') return;
    clearTimeout(pending);
    pending = setTimeout(() => {
      builds = builds.then(build).catch(error => console.error(error));
    }, 100);
  });
  console.log('Watching JavaScript sources');
}
