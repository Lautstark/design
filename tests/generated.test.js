import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { toCss, toCssSingle } from '../docs/lib/emit.js';

/* A generated file may only contain what its inputs determine.
 *
 * conventions.md §7 is the family statement; the head of build.js is the local
 * history. This is the enforcement, and it exists because the rule has been
 * broken here twice in opposite directions and both times the thing that
 * noticed was a CI step nobody read.
 *
 * The failure is never loud. A stamp in generated output looks helpful, costs
 * nothing at the moment it is added, and quietly makes "are the committed files
 * current?" unanswerable - the regenerated copy differs from the committed one
 * for a reason that has nothing to do with the content. The check then fails
 * forever, and a check that always fails is one people learn to scroll past,
 * which is the state this repository was actually in.
 *
 * So the test is on the emitter rather than on the committed files: it fails
 * the moment somebody writes the stamp, not one release later.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const TOKENS = join(ROOT, 'tokens');

const products = readdirSync(join(ROOT, 'products'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(ROOT, 'products', f), 'utf8')));

describe('the emitted header', () => {
  /* The two that have actually stood in this header, and the one that would
   * have been next. Each is matched by what it looks like rather than by its
   * current value, so the test does not need updating when the version moves. */
  const EXTRINSIC = [
    [/@v?\d+\.\d+\.\d+/, 'a release version — changes on a bump that changed no input'],
    [/\b[0-9a-f]{7,40}\b/, 'a commit sha — changes on every commit'],
    [/\b\d{4}-\d{2}-\d{2}\b/, 'a date — changes without a commit at all'],
    [/\b\d{4}\/\d{2}\/\d{2}\b/, 'a date'],
  ];

  for (const product of products) {
    const emitted = product.schemes === 'both'
      ? toCss(product.accent, product.product, { ok: product.state })
      : toCssSingle(product.accent, product.product, product.schemes, { ok: product.state });
    const header = emitted.slice(0, emitted.indexOf('*/'));

    it(`${product.product}: says what generated it and what from`, () => {
      expect(header).toContain('Lautstark/design');
      expect(header, 'the input, which is the part that is actually provenance')
        .toContain(product.accent);
      expect(header).toContain(product.product);
    });

    for (const [pattern, what] of EXTRINSIC) {
      it(`${product.product}: carries no ${what.split(' —')[0]}`, () => {
        expect(header, `${what}. See the head of build.js.`).not.toMatch(pattern);
      });
    }
  }
});

describe('regenerating', () => {
  /* The property all of the above is protecting, stated directly: the same
   * inputs give the same bytes, so the committed files can be checked by
   * regenerating and diffing. */
  it('gives byte-for-byte the same output twice', () => {
    for (const product of products) {
      const once = product.schemes === 'both'
        ? toCss(product.accent, product.product, { ok: product.state })
        : toCssSingle(product.accent, product.product, product.schemes, { ok: product.state });
      const twice = product.schemes === 'both'
        ? toCss(product.accent, product.product, { ok: product.state })
        : toCssSingle(product.accent, product.product, product.schemes, { ok: product.state });
      expect(twice).toBe(once);
    }
  });

  /* And the committed files are that output. CI checks this too, by running
   * build.js and diffing; having it here as well means a stale tokens/ is a
   * red test locally rather than a surprise on a push - which is how six
   * releases went out with the files a version behind.
   *
   * By reading, never by running build.js. A test that shells the generator
   * writes tokens/ as a side effect, so a run against a broken or half-edited
   * emitter leaves the deliverable overwritten in the working tree - and the
   * next run then fails for that reason instead of the one it names. Written
   * that way first and it did exactly this, twice, before the cause was
   * obvious. CI runs the generator; a test only ever reads. */
  it('gives what is committed in tokens/', () => {
    for (const product of products) {
      const emitted = product.schemes === 'both'
        ? toCss(product.accent, product.product, { ok: product.state })
        : toCssSingle(product.accent, product.product, product.schemes, { ok: product.state });
      const committed = readFileSync(join(TOKENS, `${product.product}.css`), 'utf8');
      expect(committed, `tokens/${product.product}.css is stale — run \`npm run build\``)
        .toBe(emitted);
    }
  });
});
