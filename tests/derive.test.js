import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { auditScheme, derive } from '../docs/lib/derive.js';
import { contrast, oklchToHex, solveContrast } from '../docs/lib/oklch.js';

/* The derivation, and the audit it is checked by.
 *
 * `node build.js --check` already refuses a product whose pairs fail. What it
 * cannot say is whether the audit asks about every ground a token is actually
 * drawn on, and twice it did not: --accent-strong was never measured on
 * --surface, where the menu and the sheet put it (3.06:1 in wochenwerk's dark
 * scheme), and --accent-ink never on --accent-hover, which is under the label
 * whenever the pointer is (3.93:1 on wochenwerk's light primary button). Both
 * passed every check that existed. So the first thing pinned here is the list
 * of pairs, and then the pairs themselves for the four products and for
 * accents nobody ships but the gallery's picker can produce.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const products = readdirSync(join(ROOT, 'products'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(ROOT, 'products', f), 'utf8')));

const SCHEMES = ['light', 'dark'];
const pairsOf = (checks) => checks.map((c) => `${c.fg} on ${c.bg}`);

describe('the audit', () => {
  const { tokens } = derive('#3B6FF5').light;

  it('measures --accent-strong on every ground it is drawn on', () => {
    expect(pairsOf(auditScheme(tokens))).toEqual(expect.arrayContaining([
      '--accent-strong on --bg',
      '--accent-strong on --accent-soft',
      '--accent-strong on --surface',
      '--accent-strong on --surface-2',
    ]));
  });

  it('measures --accent-ink on the fill and on its hover', () => {
    expect(pairsOf(auditScheme(tokens))).toEqual(expect.arrayContaining([
      '--accent-ink on --accent',
      '--accent-ink on --accent-hover',
    ]));
  });

  it('fails a pair that misses its target, rather than rounding it through', () => {
    const broken = { ...tokens, 'accent-hover': tokens['accent-ink'] };
    const hover = auditScheme(broken).find((c) => c.bg === '--accent-hover');
    expect(hover.pass).toBe(false);
  });
});

describe.each(products)('$product', ({ accent, state }) => {
  const both = derive(accent, { ok: state });

  it.each(SCHEMES)('passes every pair in %s', (scheme) => {
    const failed = both[scheme].checks.filter((c) => !c.pass);
    expect(failed).toEqual([]);
  });

  /* The hover steps away from the ink, so it can only widen the gap the ink
     was solved for. */
  it.each(SCHEMES)('reads the primary label at least as well under the pointer, in %s', (scheme) => {
    const t = both[scheme].tokens;
    expect(contrast(t['accent-ink'], t['accent-hover']))
      .toBeGreaterThanOrEqual(contrast(t['accent-ink'], t.accent));
  });
});

describe('the 6:1 the ink is solved for', () => {
  /* derive.js says 6 is the aim and 4.5 the floor, and names the one product
     whose hue cannot reach the aim. This is what keeps that sentence true. */
  it.each(products)('$product', ({ product, accent }) => {
    for (const scheme of SCHEMES) {
      const t = derive(accent)[scheme].tokens;
      const onFill = contrast(t['accent-ink'], t.accent);
      if (product === 'wochenwerk') expect(onFill).toBeGreaterThanOrEqual(4.5);
      else expect(onFill).toBeGreaterThanOrEqual(6);
    }
  });
});

describe('accents nobody ships', () => {
  /* The gallery's picker takes any colour. Black, white and pure yellow are
     where choosing the tight ground from the unsolved accent inverted: the
     accent lies beyond both grounds, the ground it picked stops being the
     tight one as the solve walks past them, and --accent-strong came out at
     4.17-4.34:1. */
  const EDGES = ['#000000', '#ffffff', '#808080', '#ffff00', '#00ff00', '#0000ff', '#ff0000', '#f0f0f0', '#202020'];

  it.each(EDGES)('%s passes every pair in both schemes', (accent) => {
    for (const scheme of SCHEMES) {
      expect(derive(accent, { ok: true })[scheme].checks.filter((c) => !c.pass)).toEqual([]);
    }
  });

  it('a sweep of the wheel passes every pair in both schemes', () => {
    const failed = [];
    for (let h = 0; h < 360; h += 15) {
      for (const L of [0.35, 0.5, 0.65, 0.8]) {
        for (const C of [0.05, 0.12, 0.2]) {
          const accent = oklchToHex([L, C, h]);
          for (const scheme of SCHEMES) {
            for (const c of derive(accent, { ok: true })[scheme].checks) {
              if (!c.pass) failed.push(`${accent} ${scheme} ${c.fg} on ${c.bg} ${c.ratio}`);
            }
          }
        }
      }
    }
    expect(failed).toEqual([]);
  });
});

describe('solveContrast against several grounds', () => {
  it('stops at the first colour that clears all of them', () => {
    const grounds = ['#ffffff', '#e8e8e8'];
    const hex = solveContrast([0.7, 0.1, 260], grounds, 4.5, -1);
    for (const g of grounds) expect(contrast(hex, g)).toBeGreaterThanOrEqual(4.5);
    // And not one that clears only the easier of the two.
    expect(contrast(hex, '#e8e8e8')).toBeLessThan(4.5 * 1.15);
  });

  it('answers a single ground exactly as before', () => {
    expect(solveContrast([0.7, 0.1, 260], ['#ffffff'], 4.5, -1))
      .toBe(solveContrast([0.7, 0.1, 260], '#ffffff', 4.5, -1));
  });
});
