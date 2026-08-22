#!/usr/bin/env node
/*
 * Write each product's token file from its one-line declaration in products/.
 *
 *   node build.js            write the files
 *   node build.js --check    audit only, write nothing, non-zero on failure
 *   node build.js vorlaut    one product
 *
 * --check is what CI runs. It exists so that a contrast regression is caught
 * where it is cheap — in the design repository, before a pull request is opened
 * against three products — rather than in whichever scheme somebody happened to
 * have their laptop set to.
 *
 * Paths are resolved as siblings of this repository, which is how the four
 * repositories already sit on disk and how the sync workflow checks them out.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { derive } from './docs/lib/derive.js';
import { toCss, toCssSingle } from './docs/lib/emit.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SIBLINGS = resolve(HERE, '..');

/* Markers for the products that inline their tokens. Everything between them is
   replaced; everything outside is left exactly as it was, so a product keeps its
   own hand-written CSS in the same <style> block. */
const OPEN = '/* >>> lautstark-design: generated tokens */';
const CLOSE = '/* <<< lautstark-design */';

const args = process.argv.slice(2);
const check = args.includes('--check');
const only = args.filter((a) => !a.startsWith('--'));

const sha = (() => {
  try { return execSync('git rev-parse --short HEAD', { cwd: HERE, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return null; }
})();

let failures = 0;
let written = 0;
let skipped = 0;

const configs = readdirSync(join(HERE, 'products'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(HERE, 'products', f), 'utf8')))
  .filter((c) => !only.length || only.includes(c.product));

if (!configs.length) {
  console.error(only.length ? `no such product: ${only.join(', ')}` : 'no products declared');
  process.exit(1);
}

for (const cfg of configs) {
  const opts = { ok: cfg.state, source: sha };
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
  console.log(`✓ ${cfg.product} — ${total} pairings pass (${cfg.accent}, ${schemes.join(' + ')})`);

  if (check) continue;

  const css = cfg.schemes === 'both'
    ? toCss(cfg.accent, cfg.product, opts)
    : toCssSingle(cfg.accent, cfg.product, cfg.schemes, opts);

  const target = join(SIBLINGS, cfg.product, cfg.out);
  if (!existsSync(dirname(target))) {
    console.log(`  … ${cfg.product} not checked out beside this repo, skipping`);
    skipped++;
    continue;
  }

  if (cfg.inline) {
    if (!existsSync(target)) { console.error(`  ✗ ${cfg.out} missing`); failures++; continue; }
    const src = readFileSync(target, 'utf8');
    const from = src.indexOf(OPEN);
    const to = src.indexOf(CLOSE);
    if (from === -1 || to === -1 || to < from) {
      console.error(`  ✗ ${cfg.out} has no ${OPEN} … ${CLOSE} block — add one where the tokens belong`);
      failures++;
      continue;
    }
    /* Indent to match the marker so the block sits correctly inside <style>. */
    const indent = src.slice(src.lastIndexOf('\n', from) + 1, from);
    const body = css.split('\n').map((l) => (l ? indent + l : l)).join('\n');
    const next = `${src.slice(0, from)}${OPEN}\n${body}\n${indent}${src.slice(to)}`;
    if (next === src) { console.log(`  = ${cfg.out} already current`); continue; }
    writeFileSync(target, next);
  } else {
    if (existsSync(target) && readFileSync(target, 'utf8') === css) {
      console.log(`  = ${cfg.out} already current`);
      continue;
    }
    writeFileSync(target, css);
  }

  written++;
  console.log(`  → ${cfg.product}/${cfg.out}`);
}

if (failures) {
  console.error(`\n${failures} product(s) failed. Nothing was written for them.`);
  process.exit(1);
}
if (!check) console.log(`\n${written} written, ${skipped} skipped, ${configs.length - written - skipped} unchanged.`);
