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
 * instead, by regenerating them and diffing.
 *
 * ## A generated file may only contain what its inputs determine
 *
 * That check is the whole reason for the rule, and this file has now broken it
 * twice in opposite directions, so it is written down rather than rediscovered.
 *
 * The header used to name the commit sha. That made the output different on
 * every commit, so "are the committed tokens current?" could never be answered
 * by regenerating and diffing — the answer was always no. It was replaced with
 * the package version, which is stabler and still not an input: a version bump
 * changes the file without changing anything the file is derived from, so the
 * check went red on the release after every release and stayed red through six
 * of them. Nobody read it, which is what a check that is always failing buys.
 * A date would have been the same defect a third time, and worse — it moves
 * without a commit at all.
 *
 * So the header names the generator and the input accent, both of which are
 * intrinsic, and nothing else. tokens/ is a pure function of products/*.json
 * and the derivation, and the check is answerable forever.
 *
 * Where a file came from, when that is genuinely the question: `git log -1
 * tokens/<product>.css` in here, and the pin in a consumer's package.json,
 * which is the authoritative answer and cannot disagree with what is installed.
 * A stamp in the file can, and did, for six releases.
 *
 * conventions.md §7 states this as the family rule. tests/generated.test.js
 * enforces it here.
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
  const opts = { ok: cfg.state };
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
