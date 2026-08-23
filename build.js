#!/usr/bin/env node
/*
 * Turn each product's declaration in products/ into its token file.
 *
 *   node build.js            audit, then write tokens/<product>.css
 *   node build.js --check    audit only, write nothing, non-zero on failure
 *   node build.js vorlaut    one product
 *
 * tokens/ is the deliverable and it is committed. Every product takes it
 * through the package — `@lautstark/design` is a github: dependency exactly
 * like @lautstark/bildquelle and @lautstark/stimmquelle already are, so a
 * version pin is a real pin and `npm update` is the whole update story.
 *
 * There was a `--sync` that copied the file into the products that could not
 * import it: vorlaut before it had a package.json, and mitreden's hand-built
 * ui.html. Both of those pages are gone, so the flag spent its last stretch
 * addressing files that no longer existed — `npm run sync` failed on two
 * missing paths, and no check ran it, so nothing said so. It is removed, along
 * with the `out` and `inline` fields it read. That makes three delivery
 * mechanisms this repository has now deleted for being elaborate answers to a
 * question npm had already answered; the rule they keep teaching is that a
 * delivery mechanism should be sized to how often the thing is delivered.
 *
 * There is deliberately no `prepare` script. A consumer reads tokens/ straight
 * off the package and nothing runs on their machine at install time — this
 * family allowlists install scripts, and a token set that is static CSS has no
 * business asking for an exemption. CI checks the committed files are current
 * instead, which is why the header names a version and not a commit.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { derive } from './docs/lib/derive.js';
import { toCss, toCssSingle } from './docs/lib/emit.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOKENS = join(HERE, 'tokens');

const args = process.argv.slice(2);
const check = args.includes('--check');
const only = args.filter((a) => !a.startsWith('--'));

/*
 * The header names the version and nothing else. It used to carry the commit sha
 * too, which made the output different on every commit — and therefore made
 * "are the committed tokens current?" impossible to answer by regenerating and
 * diffing, because the answer was always no. tokens/ is now a pure function of
 * products/*.json, the derivation, and this version.
 */
const version = JSON.parse(readFileSync(join(HERE, 'package.json'), 'utf8')).version;

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
  const opts = { ok: cfg.state, source: `v${version}` };
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
}

if (failures) {
  console.error(`\n${failures} failure(s). Nothing was written for them.`);
  process.exit(1);
}
if (!check) console.log(`\n${written} file(s) written.`);
