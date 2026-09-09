import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import ts from 'typescript';

const root = process.cwd();
const dist = path.join(root, 'dist');
const locales = ['en', 'es', 'fr', 'de', 'pt'];
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const redirects = new Set(fs.readFileSync(path.join(dist, '_redirects'), 'utf8').split('\n').map(line => line.trim().split(/\s+/)[0]));
const failures = [];
let checked = 0;
for (const locale of locales) {
  const pages = walk(path.join(dist, locale)).filter(file => file.endsWith('.html'));
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    const relative = path.relative(dist, file).replaceAll('\\', '/').replace(/index\.html$/, '');
    for (const match of html.matchAll(/\bhref="(\/[^"#?]*)(?:[^"#]*)?"/g)) {
      const href = match[1];
      if (href.startsWith('//') || redirects.has(href)) continue;
      const target = path.join(dist, decodeURIComponent(href));
      if (!fs.existsSync(target) && !fs.existsSync(path.join(target, 'index.html'))) failures.push(`${relative}: missing ${href}`);
    }
    if (!relative.includes('/stretches/')) {
      const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
      if (canonical !== `https://stretchesfor.com/${relative}`) failures.push(`${relative}: canonical ${canonical}`);
      for (const language of locales) {
        const alternate = html.match(new RegExp(`<link[^>]+hreflang="${language}"[^>]+href="([^"]+)"`))?.[1];
        if (!alternate) failures.push(`${relative}: missing alternate ${language}`);
        else if (!fs.existsSync(path.join(dist, new URL(alternate).pathname, 'index.html'))) failures.push(`${relative}: broken alternate ${alternate}`);
      }
    }
    for (const match of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(match[1]); } catch { failures.push(`${relative}: invalid JSON-LD`); }
    }
    if (relative.includes('/guide/') && !html.includes('noindex, follow')) failures.push(`${relative}: guide must be noindex`);
    checked++;
  }
  const home = fs.readFileSync(path.join(dist, locale, 'index.html'), 'utf8');
  if (/model-viewer|BodyModel\.|\.glb["']/.test(home)) failures.push(`${locale}: body model loaded on homepage`);
  const library = fs.readFileSync(path.join(dist, locale, 'exercises/index.html'), 'utf8');
  const dom = new JSDOM(library, { url: `https://stretchesfor.com/${locale}/exercises/`, runScripts: 'outside-only' });
  const source = fs.readFileSync(path.join(root, 'src/pages/exercises/index.astro'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
  dom.window.eval(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('[data-exercise-card]').length, 48);
  const area = doc.querySelector('select[name="area"]');
  area.value = 'neck'; area.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  const visible = [...doc.querySelectorAll('[data-exercise-card]')].filter(card => !card.hidden);
  assert(visible.length > 0 && visible.every(card => card.dataset.area === 'neck'));
  const search = doc.querySelector('input[name="q"]');
  search.value = 'zzzz-no-such-exercise'; search.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(doc.querySelector('[data-no-matches]').hidden, false);
  doc.querySelector('form').reset();
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(doc.querySelector('[data-exercise-count]').textContent, '48');
  dom.window.close();
}
const sitemap = walk(dist).filter(file => /sitemap.*\.xml$/.test(file)).map(file => fs.readFileSync(file, 'utf8')).join('');
assert(!sitemap.includes('/guide/') && !sitemap.includes('/stretches/'));
for (const locale of locales) assert(sitemap.includes(`/${locale}/routines/desk-break/`));
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/site-verification.json'), JSON.stringify({ checked, failures }, null, 2));
assert.equal(failures.length, 0, [...new Set(failures)].slice(0, 40).join('\n'));
console.log(`Verified ${checked} localized pages: internal links, canonical URLs, hreflang, JSON-LD, guide indexing, model loading, and exercise filtering in all five languages.`);
