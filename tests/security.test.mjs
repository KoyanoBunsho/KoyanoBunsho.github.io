import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM, VirtualConsole } from 'jsdom';

const root = new URL('../', import.meta.url);
const source = path => readFile(new URL(path, root), 'utf8');

async function siteDOM(t, content = '') {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(`<!doctype html><html><body>
    <nav id="site-nav"><button class="hidden"></button><ul class="visible-links"></ul><ul class="hidden-links"></ul></nav>
    <main id="main">${content}</main><footer class="page__footer"></footer>
    </body></html>`, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://example.test/', virtualConsole });
  t.after(() => dom.window.close());
  dom.window.eval(await source('assets/js/main.min.js'));
  await new Promise(resolve => dom.window.jQuery(resolve));
  assert.deepEqual(errors, [], 'The deployed bundle initializes without errors');
  return dom;
}

test('the deployed bundle rejects jQuery prototype pollution (CVE-2019-11358)', async t => {
  const { window } = await siteDOM(t);
  window.eval('jQuery.extend(true, {}, JSON.parse(\'{"__proto__":{"polluted":true}}\'))');
  assert.equal(window.eval('({}).polluted'), undefined);
});

test('jQuery does not turn inert markup into executable elements (CVE-2020-11022/11023)', async t => {
  const { window } = await siteDOM(t);
  const payloads = [
    '<style><style /><img src=x onerror="window.compromised=true">',
    '<option><style></option></select><img src=x onerror="window.compromised=true"></style>',
  ];
  for (const payload of payloads) {
    const target = window.jQuery('<div>').appendTo(window.document.body);
    target.html(payload);
    assert.equal(target.find('img[onerror]').length, 0);
    target.remove();
  }
  assert.equal(window.compromised, undefined);
});

test('image titles and loading errors are displayed without interpreting HTML', async t => {
  const { window } = await siteDOM(t, '<a class="image-popup" href="/images/profile.jpeg">Photo</a>');
  const $ = window.jQuery;
  const payload = '<img src=x onerror="window.compromised=true">';
  $('.image-popup').attr('title', payload).magnificPopup('open');
  assert.equal($('.mfp-title').text(), payload);
  assert.equal($('.mfp-title img, .mfp-title script').length, 0);
  $.magnificPopup.instance.updateStatus('error', payload);
  assert.equal($('.mfp-preloader').text(), payload);
  assert.equal($('.mfp-preloader img, .mfp-preloader script').length, 0);
  $.magnificPopup.close();
});

test('the talk map treats location labels as text and requests HTTPS tiles', async t => {
  const dom = new JSDOM(await source('talkmap/map.html'), {
    runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://example.test/talkmap/map.html',
  });
  t.after(() => dom.window.close());
  const { window } = dom;
  window.eval(await source('talkmap/leaflet_dist/leaflet.js'));
  window.eval(await source('talkmap/leaflet_dist/leaflet.markercluster-src.js'));
  const payload = '<img src=x onerror="window.compromised=true">';
  window.addressPoints = [[payload, 35, 139]];
  window.eval(window.document.querySelector('script:not([src])').textContent);
  const markers = window.markers.getLayers();
  assert.equal(markers.length, 1);
  const content = markers[0].getPopup().getContent();
  assert.equal(content.textContent, payload);
  assert.equal(content.querySelector('img, script'), null);
  assert.ok(window.tiles._url.startsWith('https://'));
});
