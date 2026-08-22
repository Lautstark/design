#!/usr/bin/env node
/*
 * Turn each product's declaration in products/ into its token file.
 *
 *   node build.js            audit, then write tokens/<product>.css
 *   node build.js --check    audit only, write nothing, non-zero on failure
 *   node build.js --sync     also copy into products that cannot import
 *   node build.js vorlaut    one product
 *
 * tokens/ is the deliverable and it is committed. Products that have a build
 * step take it through the package — `@lautstark/design` is a github: dependency
 * exactly like @lautstark/bildquelle and @lautstark/stimmquelle already are, so
 * a version pin is a real pin and `npm update` is the whole update story.
 *
 * `--sync` exists for the products that cannot do that. Today that is vorlaut,
 * which has no package.json, plus mitreden's hand-built ui.html, which is still
 * the live page while its React rewrite lands. Those get the same bytes copied
 * in by CI, with a header saying where they came from. It is the fallback, not
 * the mechanism.
 *
 * `prepare` runs `node build.js` on install, so a consumer of the github:
 * dependency regenerates tokens/ from source rather than trusting what was
 * committed. Nothing is fetched to do it: the generator has no dependencies.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { derive } from './docs/lib/derive.js';
import { toCss, toCssSingle } from './docs/lib/emit.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOKENS = join(HERE, 'tokens');
const SIBLINGS = resolve(HERE, '..');

/* Markers for the targets that inline their tokens. Everything between them is
   replaced; everything outside is left exactly as it was, so a page keeps its
   own hand-written CSS in the same <style> block. */
const OPEN = '/* >>> lautstark-design: generated tokens */';
const CLOSE = '/* <<< lautstark-design */';

const args = process.argv.slice(2);
const check = args.includes('--check');
const sync = args.includes('--sync');
const only = args.filter((a) => !a.startsWith('--'));

const version = JSON.parse(readFileSync(join(HERE, 'package.json'), 'utf8')).version;
const sha = (() => {
  try { return execSync('git rev-parse --short HEAD', { cwd: HERE, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return null; }
})();

let failures = 0;
let written = 0;

const configs = readdirSync(join(HERE, 'products'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(HERE, 'products', f), 'utf8')))
  .filter((c) => !only.length || only.includes(c.product));

if (!configs.length) {
  console.error(only.length ? `no such product: ${only.join(', ')}` : 'no products declared');
  process.exit(1);
}

/** Replace the marked block inside an existing file, leaving the rest alone. */
function inlineInto(target, css, label) {
  if (!existsSync(target)) { console.error(`  ✗ ${label} missing`); failures++; return; }
  const src = readFileSync(target, 'utf8');
  const from = src.indexOf(OPEN);
  const to = src.indexOf(CLOSE);
  if (from === -1 || to === -1 || to < from) {
    console.error(`  ✗ ${label} has no ${OPEN} … ${CLOSE} block — add one where the tokens belong`);
    failures++;
    return;
  }
  const indent = src.slice(src.lastIndexOf('\n', from) + 1, from);
  const body = css.split('\n').map((l) => (l ? indent + l : l)).join('\n');
  const next = `${src.slice(0, from)}${OPEN}\n${body}\n${indent}${src.slice(to)}`;
  if (next === src) { console.log(`  = ${label} already current`); return; }
  writeFileSync(target, next);
  written++;
  console.log(`  → ${label}`);
}

function writeFile(target, css, label) {
  if (existsSync(target) && readFileSync(target, 'utf8') === css) {
    console.log(`  = ${label} already current`);
    return;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, css);
  written++;
  console.log(`  → ${label}`);
}

for (const cfg of configs) {
  const opts = { ok: cfg.state, source: sha ? `v${version} (${sha})` : `v${version}` };
  const schemes = cfg.schemes === 'both' ? ['light', 'dark'] : [cfg.schemes];

  /* Audit first, always — including in write mode. A file that fails is never
     written, so a bad ratio cannot reach a product even by accident. */
  const derived = derive(cfg.accent, opts);
  const bad = schemes.flatMap((s) => derived[s].checks.filter((c) => !c.pass).map((c) => ({ ...c, s })));
  const total = schemes.reduce((n, s) => n + derived[s].checks.length, 0);

  if (bad.length) {
    failures++;
    console.error(`✗ ${cfg.product} — ${bad.length} of ${total} pairings fail`);
    for (const c of bad) console.error(`    ${c.s}: ${c.fg} on ${c.bg} is ${c.ratio}:1, needs ${c.target}:1`);
    continue;
  }
  console.log(`✓ ${cfg.product} — ${total} pairings pass (${cfg.accent}, ${schemes.join(' + ')}, via ${cfg.transport})`);

  if (check) continue;

  const css = cfg.schemes === 'both'
    ? toCss(cfg.accent, cfg.product, opts)
    : toCssSingle(cfg.accent, cfg.product, cfg.schemes, opts);

  /* The package's own copy. This is what an importing product resolves. */
  writeFile(join(TOKENS, `${cfg.product}.css`), css, `tokens/${cfg.product}.css`);

  if (!sync || !cfg.out?.length) continue;

  /* And the copies for whatever cannot import. */
  const root = join(SIBLINGS, cfg.product);
  if (!existsSync(root)) {
    console.log(`  … ${cfg.product} not checked out beside this repo, nothing copied`);
    continue;
  }
  for (const out of cfg.out) {
    const label = `${cfg.product}/${out}`;
    if (cfg.inline) inlineInto(join(root, out), css, label);
    else writeFile(join(root, out), css, label);
  }
}

if (failures) {
  console.error(`\n${failures} failure(s). Nothing was written for them.`);
  process.exit(1);
}
if (!check) console.log(`\n${written} file(s) written.`);
