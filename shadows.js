#!/usr/bin/env node
/*
 * Whether a product still draws what components.css draws for it.
 *
 *     node node_modules/@lautstark/design/shadows.js            warns
 *     node node_modules/@lautstark/design/shadows.js --strict   non-zero when any is unexplained
 *
 * pins.js asks whether a product has the right version of this package. This
 * asks the question underneath it, which nothing asked before: whether it is
 * *using* it.
 *
 * A product's own stylesheet is loaded after components.css, so a bare rule of
 * the same name always wins. Shipping a shared drawing therefore does nothing
 * on its own - and it looks exactly like it worked, because the product carries
 * on rendering the way it always did. On 2026-09-03 two products discovered
 * this within an hour of each other, both while migrating to a shared component
 * whose CSS had been published days earlier: mitreden had all five `.voice*`
 * names in app.css, wochenwerk had them in kalender.css, and in both the shared
 * drawing had been dead since the day it shipped. The six screenshot baselines
 * that should have caught it came back byte-identical, because none of them
 * photographed that surface. Two ways of not looking, agreeing.
 *
 * ## What counts as shadowing, and what does not
 *
 * Only a selector whose LAST part is the bare class, optionally with pseudo
 * classes: `.btn`, `.btn:hover`, `.sheet`. Those replace the shared rule for
 * every element that has the class.
 *
 * Not `dialog.sheet`, not `a.btn`, not `.speech-row .btn` - a product narrowing
 * a shared name to one place is adding to the drawing rather than replacing it,
 * and every one of those in this family today is deliberate and says so.
 *
 * ## Saying why
 *
 * A product that means it writes a comment in the same file:
 *
 *     /* shadows .btn: the board is read from four metres away, so its
 *        buttons are sized for that and not for a laptop. *​/
 *
 * The marker is `shadows .<class>:` and the words after it are for whoever
 * reads it next. This does not check that the reason is a good one. It checks
 * that somebody wrote one down, which is the difference between a decision and
 * an accident - and an accident is what this exists to catch.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const strict = process.argv.includes('--strict');
const ROOT = resolve(process.cwd());
const SHARED = join(ROOT, 'node_modules', '@lautstark', 'design', 'docs', 'components.css');

/* Comments first, so a class name mentioned only inside prose is never taken
   for a rule. components.css is more comment than CSS by line count. */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Classes a stylesheet draws as the bare, last part of a selector. */
function drawn(css) {
  const found = new Map();
  /* Split on the braces rather than matching around them: a selector is
     whatever stands between the end of the last rule and the next `{`, and an
     anchored regex missed nearly all of them - it reported zero classes on a
     file with fifty, and then said everything was fine. A count of zero is not
     a clean bill of health, which is why the caller refuses to believe one. */
  for (const chunk of stripComments(css).split('}')) {
    const block = chunk.slice(0, chunk.indexOf('{'));
    if (chunk.indexOf('{') === -1 || block.includes('@')) continue;
    for (const selector of block.split(',')) {
      const parts = selector.trim().split(/\s+|(?=>)/).filter(Boolean);
      const last = parts.at(-1) ?? '';
      const match = /^\.([A-Za-z][\w-]*)((?::[\w-]+(?:\([^)]*\))?)*)$/.exec(last);
      if (match) found.set(match[1], (found.get(match[1]) ?? 0) + 1);
    }
  }
  return found;
}

/** Every `shadows .x:` a file admits to, whatever else the comment says. */
function admitted(css) {
  const said = new Set();
  for (const [, body] of css.matchAll(/\/\*([\s\S]*?)\*\//g)) {
    for (const [, name] of body.matchAll(/shadows\s+\.([A-Za-z][\w-]*)\s*:/g)) said.add(name);
  }
  return said;
}

function stylesheets(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) stylesheets(path, out);
    else if (name.endsWith('.css')) out.push(path);
  }
  return out;
}

let shared;
try {
  shared = new Set(drawn(readFileSync(SHARED, 'utf8')).keys());
} catch {
  console.log('No @lautstark/design installed here, so there is nothing to shadow.');
  process.exit(0);
}

/* A parser that finds nothing looks exactly like a product with nothing to
   fix. This file was published once in that state. So an empty set is a
   failure of this tool, reported as one, rather than a pass. */
if (shared.size === 0) {
  console.error(`Read ${SHARED} and found no classes in it. That is this tool
being broken, not the stylesheet being empty - nothing was checked.`);
  process.exit(2);
}

const clashes = [];
for (const file of stylesheets(join(ROOT, 'src'))) {
  const css = readFileSync(file, 'utf8');
  const excused = admitted(css);
  for (const name of drawn(css).keys()) {
    if (shared.has(name)) clashes.push({ file: relative(ROOT, file), name, excused: excused.has(name) });
  }
}

if (clashes.length === 0) {
  console.log(`Nothing here redraws any of the ${shared.size} classes components.css draws.`);
  process.exit(0);
}

const quiet = clashes.filter((c) => !c.excused);
const said = clashes.filter((c) => c.excused);

for (const { file, name } of quiet) console.log(`  ✗ .${name}  ${file}`);
for (const { file, name } of said) console.log(`  · .${name}  ${file}  (says why)`);

console.log(`\n${quiet.length} unexplained, ${said.length} written down.`);
if (quiet.length) {
  console.log(`
A bare rule of the same name is loaded after components.css and wins, so the
shared drawing is not reaching the page. Either delete the local rule and take
what the package draws, or narrow the selector to the one place it is meant for
(\`dialog.sheet\`, \`.speech-row .btn\`), or say why in a comment beside it:

    /* shadows .btn: <the reason> */`);
}
/* Not --strict's business either way: this warns by default because a product
   may be mid-migration, and a half-migrated surface is a state worth shipping
   from. --strict is for whoever wants the opposite. */
if (strict && quiet.length) process.exit(1);
