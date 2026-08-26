/*
 * One accent hue in, a full token set out, for both schemes.
 *
 * The rule this file implements: a product declares exactly one thing about
 * itself, its accent. Everything else — the planes it stacks, the three weights
 * of text, the five accent tokens, the danger family — follows from that hue by
 * arithmetic, and every value that has to clear a contrast ratio is *solved* for
 * that ratio rather than chosen by eye.
 *
 * The ladder below (the L and C constants) is not invented. It is bildhaft's
 * shipped light and dark ramps, measured: the only neutral ramp in the family
 * that was authored deliberately and used consistently in both schemes. mitreden
 * copied its light values byte-for-byte and then invented an unrelated cool dark;
 * vorlaut invented a cool dark of its own. Taking bildhaft's ladder as the shape
 * and rotating it onto each product's own hue is what makes those two consistent
 * without anybody having to re-choose a grey.
 *
 * Why solving matters: the family has shipped three contrast bugs, all of them a
 * hex picked by hand — 2.48:1 white-on-salmon on the button that deletes
 * everything, 2.89:1 on --text-faint, and 4.04:1 on a --text-faint ported from a
 * sibling. See src/oklch.js.
 */

import { hexToOklch, oklchToHex, contrast, solveContrast } from './oklch.js';

/* ------------------------------------------------------------- the ladder */

/* Planes, as [OKLab L, chroma]. Chroma rises as a plane darkens in light mode
   and as it lightens in dark mode: a neutral that holds its tint at every step
   reads as one material rather than as grey with a colour cast on top. */
const PLANES = {
  light: { bg: [0.9400, 0.0029], surface: [1.0000, 0.0000], 'surface-2': [0.9350, 0.0057], 'surface-3': [0.8950, 0.0087] },
  dark:  { bg: [0.2005, 0.0042], surface: [0.3100, 0.0058], 'surface-2': [0.3600, 0.0062], 'surface-3': [0.4050, 0.0075] },
};

/* The hairline. One step off --surface-2, away from the text. */
/* The hairline, and the only thing on the ladder that carries a boundary on
 * its own. It used to sit one step off --surface-2, which made it a shade
 * rather than an edge: 1.45:1 against --surface in dark, 1.39:1 in light, so a
 * card outlined with it was a card with no outline. WCAG 1.4.11 asks 3:1 of
 * anything that says where a component is, and unlike the planes — three steps
 * of 3:1 need 27:1 of range and black to white gives 21:1 — a single hairline
 * can reach it. */
const LINE = { light: [0.6600, 0.0090], dark: [0.5800, 0.0080] };

/*
 * --text is a fixed point on the ladder, not a solved value. It is the colour
 * you read everything in, so it belongs at the end of the ramp rather than
 * wherever a threshold happens to fall: solving it lands it on the minimum that
 * passes, which is how you get a body text of #302c2b when the product authored
 * #1c1a17. As shipped it measures 16.5:1 in light and 15.2:1 in dark; the audit
 * below still checks it, it just is not what places it.
 */
const TEXT_ANCHOR = { light: [0.2189, 0.0065], dark: [0.9410, 0.0074] };

/*
 * The two secondary weights, as [chroma, contrast target], and these *are*
 * solved — a threshold is exactly what they mean.
 *
 * Both are solved against --surface-2, not --bg. That is the tightest ground
 * either actually sits on, because --surface-2 is the fill of every field, and
 * it is the distinction the ported-value bug turned on: the value that failed
 * had been checked against --bg, where it passed at 3.92:1 while reading
 * 3.18:1 on the fill it was really printed on.
 */
const TEXT = {
  'text-dim':   [0.0145, 5.3],
  'text-faint': [0.0145, 4.5],
};

/* Danger's hue is fixed rather than derived: red means this in every product,
   and a product whose accent is already red does not get to make it ambiguous. */
const DANGER_HUE = 27.5;

const NON_COLOUR = {
  radius: '14px',
  'radius-sm': '9px',
  'radius-pill': '999px',
  'radius-item': '7px',
  font: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  /* The other half of the typographic contract, and it is here because --font
     alone was not enough to keep the three the same size. Two products set
     1.55 and one 1.45, so a row built from the *same* shared rules came out
     1.4px shorter in one of them - a difference nothing could be wrong
     against, because there was no value to disagree with. */
  leading: '1.55',
};

const SHADOW = {
  light: {
    'shadow-sm': '0 1px 2px rgba(28, 26, 23, .05)',
    shadow: '0 2px 6px rgba(28, 26, 23, .06), 0 12px 32px rgba(28, 26, 23, .08)',
  },
  dark: {
    'shadow-sm': '0 1px 2px rgba(0, 0, 0, .3)',
    shadow: '0 2px 6px rgba(0, 0, 0, .3), 0 12px 32px rgba(0, 0, 0, .4)',
  },
};

/* ------------------------------------------------------------- derivation */

/**
 * Derive one scheme's tokens from an accent hex.
 *
 * @param {string} accent  the product's hue, as authored
 * @param {'light'|'dark'} scheme
 * @param {{ok?:boolean}} opts  `ok` adds the optional --ok/--warn/--miss trio,
 *   which per the token table only exists for products that track per-item state
 * @returns {{tokens: Object<string,string>, checks: Array}}
 */
export function deriveScheme(accent, scheme, opts = {}) {
  const [, accentC, hue] = hexToOklch(accent);
  const dark = scheme === 'dark';
  const t = {};

  /* Planes and hairline, on the product's own hue. */
  for (const [name, [L, C]] of Object.entries(PLANES[scheme])) t[name] = oklchToHex([L, C, hue]);
  t.line = oklchToHex([...LINE[scheme], hue]);

  t.text = oklchToHex([...TEXT_ANCHOR[scheme], hue]);

  /* The secondary weights, solved. Dark goes lighter to gain contrast against
     its ground, light goes darker. */
  for (const [name, [C, target]] of Object.entries(TEXT)) {
    t[name] = solveContrast([dark ? 0.62 : 0.56, C, hue], t['surface-2'], target, dark ? +1 : -1);
  }

  /* Accent. The fill is exactly what the product declared — never adjusted. */
  t.accent = accent;
  const [accentL] = hexToOklch(accent);

  /* --accent-soft first: --accent-strong is solved against it as well as against
     --bg, so it has to exist by then. */
  t['accent-soft'] = oklchToHex(dark ? [0.245, 0.035, hue] : [0.963, 0.030, hue]);

  /*
   * --accent-ink: text placed ON the fill. Try both directions and keep the
   * winner. Which one wins is a property of the hue, not of the scheme: a
   * saturated orange or purple takes near-black, a deep blue would take white,
   * and hardcoding either is how the 2.48:1 button happened.
   *
   * The bar is 6:1 rather than the 4.5 AA minimum. This is the one pairing that
   * carries a primary action's label, it is often set small and semibold, and
   * every hand-authored ink in the family independently landed near 6.2.
   */
  const ink = (target) => {
    const lo = solveContrast([0.30, Math.min(accentC, 0.06), hue], accent, target, -1);
    const hi = solveContrast([0.90, Math.min(accentC, 0.02), hue], accent, target, +1);
    return contrast(lo, accent) >= contrast(hi, accent) ? lo : hi;
  };
  t['accent-ink'] = ink(6.0);

  /*
   * --accent-strong: the accent legible as TEXT. Solved against whichever of
   * --bg and --accent-soft is tighter, because it labels both — an accent-tinted
   * row uses --accent-soft behind --accent-strong, and a value solved only
   * against --bg can fail there. On a dark ground the accent frequently clears
   * both already, and the token table allows it to equal --accent.
   */
  const strongGround = contrast(accent, t.bg) <= contrast(accent, t['accent-soft']) ? t.bg : t['accent-soft'];
  t['accent-strong'] = solveContrast([accentL, accentC, hue], strongGround, 4.5, dark ? +1 : -1);

  /* --accent-hover: an explicit value, never filter: brightness(), which shifts
     hue on a saturated accent and cannot darken — the direction light needs. */
  t['accent-hover'] = oklchToHex([accentL + (dark ? 0.06 : -0.045), accentC, hue]);

  /* Danger, the same three roles on the fixed red, at the same 6:1 as accent. */
  t.danger = solveContrast([dark ? 0.70 : 0.52, 0.16, DANGER_HUE], t.bg, 6.0, dark ? +1 : -1);
  const dLo = solveContrast([0.30, 0.06, DANGER_HUE], t.danger, 6.0, -1);
  const dHi = solveContrast([0.90, 0.02, DANGER_HUE], t.danger, 6.0, +1);
  t['danger-ink'] = contrast(dLo, t.danger) >= contrast(dHi, t.danger) ? dLo : dHi;
  t['danger-soft'] = oklchToHex(dark ? [0.255, 0.040, DANGER_HUE] : [0.955, 0.030, DANGER_HUE]);

  /* The optional per-item state trio. --miss reads as absence, so it is a
     neutral at --text-dim's weight rather than a colour. */
  if (opts.ok) {
    t.ok = solveContrast([dark ? 0.70 : 0.52, 0.14, 150], t.bg, 4.5, dark ? +1 : -1);
    t.warn = solveContrast([dark ? 0.78 : 0.60, 0.13, 75], t.bg, 4.5, dark ? +1 : -1);
    t.miss = t['text-faint'];
  }

  Object.assign(t, SHADOW[scheme], NON_COLOUR);

  return { tokens: t, checks: auditScheme(t, opts) };
}

/* ------------------------------------------------------------------ audit */

/* Every pairing the token table promises will clear AA. The generator runs this
   on its own output and refuses to write a file that fails, so a ratio can only
   regress if somebody edits a generated file by hand. */
export function auditScheme(t, opts = {}) {
  const pairs = [
    ['--text', '--bg', t.text, t.bg, 7.0],
    ['--text-dim', '--surface-2', t['text-dim'], t['surface-2'], 4.5],
    ['--text-faint', '--surface-2', t['text-faint'], t['surface-2'], 4.5],
    ['--text-faint', '--bg', t['text-faint'], t.bg, 4.5],
    ['--accent-ink', '--accent', t['accent-ink'], t.accent, 4.5],
    ['--accent-strong', '--bg', t['accent-strong'], t.bg, 4.5],
    ['--accent-strong', '--accent-soft', t['accent-strong'], t['accent-soft'], 4.5],
    ['--danger', '--bg', t.danger, t.bg, 4.5],
    ['--danger-ink', '--danger', t['danger-ink'], t.danger, 4.5],
    ['--text', '--surface-3', t.text, t['surface-3'], 7.0],

    /* Surfaces against each other, which nothing here used to check — every
     * pair above is text on a plane, and for text the table was always right.
     * What went unmeasured was whether the planes can be told apart at all: a
     * card sat on the page at 1.10:1 in dark and 1.05:1 in light, which is a
     * rounding error rather than an edge, and the hairline meant to rescue it
     * was 1.45:1 and 1.39:1.
     *
     * --line carries the 3:1 that WCAG 1.4.11 asks of anything saying where a
     * component is, because it is the one value on the ladder that can. Three
     * plane steps at 3:1 need 27:1 of range and black to white gives 21:1, so
     * the planes are held to being *visible* rather than compliant — 1.15:1 is
     * the floor that stops the ladder collapsing back into one shade. */
    ['--line', '--surface', t.line, t.surface, 3.0],
    ['--surface', '--bg', t.surface, t.bg, 1.15],
    ['--surface-2', '--surface', t['surface-2'], t.surface, 1.15],
  ];
  if (opts.ok) pairs.push(['--ok', '--bg', t.ok, t.bg, 4.5], ['--warn', '--bg', t.warn, t.bg, 4.5]);

  return pairs.map(([fg, bg, a, b, target]) => {
    const ratio = contrast(a, b);
    return { fg, bg, ratio: Math.round(ratio * 100) / 100, target, pass: ratio >= target };
  });
}

/** Both schemes at once. */
export function derive(accent, opts = {}) {
  return { light: deriveScheme(accent, 'light', opts), dark: deriveScheme(accent, 'dark', opts) };
}
