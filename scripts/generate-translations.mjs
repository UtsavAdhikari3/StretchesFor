import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const sourceRoot = join(root, 'src');
const outputRoot = join(root, 'artifacts', 'i18n');
const manifestPath = join(outputRoot, 'manifest.json');
const configPath = join(outputRoot, 'curl-config.txt');
const catalogPath = join(sourceRoot, 'i18n', 'catalog.ts');
const targets = ['es', 'fr', 'de', 'pt'];

function readExistingCatalog() {
  if (!existsSync(catalogPath)) return Object.fromEntries(targets.map((locale) => [locale, {}]));
  const source = readFileSync(catalogPath, 'utf8');
  const start = source.indexOf('= {');
  if (start < 0) return Object.fromEntries(targets.map((locale) => [locale, {}]));
  try { return JSON.parse(source.slice(start + 2).replace(/;\s*$/, '')); }
  catch { return Object.fromEntries(targets.map((locale) => [locale, {}])); }
}

const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name);
  return entry.isDirectory() ? walk(path) : [path];
});

const utilityWords = new Set(['flex', 'grid', 'block', 'hidden', 'relative', 'absolute', 'fixed', 'sticky', 'container-shell', 'surface-card', 'prose-sf', 'group', 'font-semibold', 'text-muted', 'text-ink', 'text-brand']);
const looksLikeCode = (value) => {
  if (/^[\d\s.,+%-]*(?:m|deg|px|rem|s)?(?:\s+[\d\s.,+%-]+(?:m|deg|px|rem|s)?)*$/i.test(value)) return true;
  if (/[{}<>]|(?:^|\s)(?:const|return|function|import|export|className|undefined|null|true|false)(?:\s|$)/.test(value)) return true;
  if (/^[?&]|(?:\?|&)\w+=/.test(value)) return true;
  if (/^(?:https?:|mailto:|\/|\.\/|\.\.\/|[.#@])/.test(value)) return true;
  if (/^[a-z0-9_-]+\.(?:astro|tsx?|jsx?|css|json|svg|png|webp|mp4)$/i.test(value)) return true;
  if (/^[a-z][a-z0-9]*(?:[-_:][a-z0-9./[\]-]+)+$/i.test(value) && !value.includes(' ')) return true;
  const tokens = value.split(/\s+/);
  if (tokens.length > 1) {
    const utilityCount = tokens.filter((token) => utilityWords.has(token) || /^(?:[a-z-]+:)?-?(?:m|p|h|w|min|max|gap|space|rounded|border|bg|text|font|leading|tracking|items|justify|place|overflow|transition|duration|shadow|opacity|cursor|object|z|top|left|right|bottom|inset|translate|rotate|scale|col|row|sm|md|lg|xl|2xl)[-:[\]/0-9a-z.%(),]+$/i.test(token)).length;
    if (utilityCount / tokens.length > 0.55) return true;
  }
  return false;
};

function collectSources() {
  const values = new Set();
  const add = (raw) => {
    const value = raw.replace(/&amp;/g, '&').replace(/\\(['"`\\])/g, '$1').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (value.length < 2 || value.length > 450 || !/[A-Za-z]/.test(value) || value.includes('${') || looksLikeCode(value)) return;
    values.add(value);
  };
  const files = walk(sourceRoot).filter((path) => /\.(?:astro|tsx?|jsx?)$/.test(path) && path !== catalogPath && !/\.test\.[^.]+$/.test(path));
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    if (!file.endsWith('.astro')) {
      const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const visit = (node) => {
        if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && !ts.isImportDeclaration(node.parent) && !ts.isExportDeclaration(node.parent)) add(node.text);
        if (ts.isJsxText(node)) add(node.getText(sourceFile));
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);
      continue;
    }
    for (const match of source.matchAll(/(['"])([^'"\r\n]*?)\1/g)) add(match[2]);
    for (const match of source.matchAll(/>([^<{][^<>]*?)</g)) add(match[1]);
  }
  const englishDist = join(root, 'dist', 'en');
  if (existsSync(englishDist)) {
    for (const file of walk(englishDist).filter((path) => path.endsWith('.html'))) {
      let html = readFileSync(file, 'utf8');
      for (const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
          const visit = (value) => {
            if (typeof value === 'string') add(value);
            else if (Array.isArray(value)) value.forEach(visit);
            else if (value && typeof value === 'object') Object.values(value).forEach(visit);
          };
          visit(JSON.parse(match[1]));
        } catch { /* Ignore malformed structured data while collecting copy. */ }
      }
      for (const match of html.matchAll(/\b(?:aria-label|content|placeholder|title|alt)="([^"]+)"/g)) add(match[1]);
      html = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
      for (const match of html.matchAll(/>([^<>]+)</g)) add(match[1].replace(/&#(?:x27|39);/gi, "'").replace(/&quot;/gi, '"').replace(/&amp;/gi, '&'));
    }
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}

function makeBatches(values) {
  const batches = [];
  let current = [];
  let length = 0;
  for (const value of values) {
    const encodedLength = encodeURIComponent(value).length + 3;
    if (current.length >= 35 || (current.length && length + encodedLength > 5000)) {
      batches.push(current);
      current = [];
      length = 0;
    }
    current.push(value);
    length += encodedLength;
  }
  if (current.length) batches.push(current);
  return batches;
}

function prepare() {
  rmSync(outputRoot, { recursive: true, force: true });
  mkdirSync(outputRoot, { recursive: true });
  const existing = readExistingCatalog();
  const allSources = collectSources();
  const sources = allSources.filter((source) => targets.some((locale) => !existing[locale]?.[source]));
  const batches = makeBatches(sources);
  const config = [];
  for (const locale of targets) {
    for (let index = 0; index < batches.length; index += 1) {
      const query = batches[index].map((value) => `q=${encodeURIComponent(value)}`).join('&');
      const output = join(outputRoot, `${locale}-${String(index).padStart(3, '0')}.json`).replaceAll('\\', '/');
      config.push(`url = "https://translate.googleapis.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=${locale}&${query}"`);
      config.push(`output = "${output}"`);
      config.push('next');
    }
  }
  writeFileSync(manifestPath, JSON.stringify({ sources, batches, targets }, null, 2));
  writeFileSync(configPath, `${config.join('\n')}\n`);
  console.log(`Prepared ${sources.length} new source strings (${allSources.length} total) in ${batches.length} batches per language.`);
  console.log(`Run: curl.exe -sS -L --retry 4 --retry-all-errors -K "${relative(root, configPath)}"`);
}

function combine() {
  if (!existsSync(manifestPath)) throw new Error('Run this script without --combine first.');
  const { batches } = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const catalog = readExistingCatalog();
  for (const locale of targets) {
    catalog[locale] ??= {};
    for (let index = 0; index < batches.length; index += 1) {
      const path = join(outputRoot, `${locale}-${String(index).padStart(3, '0')}.json`);
      if (!existsSync(path) || statSync(path).size === 0) throw new Error(`Missing translation response: ${path}`);
      const translated = JSON.parse(readFileSync(path, 'utf8'));
      if (!Array.isArray(translated) || translated.length !== batches[index].length) throw new Error(`Unexpected response in ${path}`);
      batches[index].forEach((source, itemIndex) => { catalog[locale][source] = translated[itemIndex]; });
    }
  }
  const output = `import type { Locale } from './config';\n\n// Generated static catalog. Re-run scripts/generate-translations.mjs when source copy changes.\nexport const catalog: Record<Exclude<Locale, 'en'>, Record<string, string>> = ${JSON.stringify(catalog, null, 2)};\n`;
  writeFileSync(catalogPath, output);
  console.log(`Wrote ${catalogPath}`);
}

if (process.argv.includes('--combine')) combine();
else prepare();
