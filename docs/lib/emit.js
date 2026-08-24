/*
 * Turning a derived token set into the file a product actually carries.
 *
 * Shared by the gallery (so what you copy is what ships) and by build.js (so
 * what ships is what you saw). The header matters as much as the values: these
 * files land inside repositories whose other CSS is hand-written and heavily
 * commented, and the next person to open one needs to know within a line that
 * editing it is pointless.
 */

import { derive } from './derive.js';

const ORDER = [
  ['Ground and surfaces', ['bg', 'surface', 'surface-2', 'surface-3', 'line']],
  ['Text', ['text', 'text-dim', 'text-faint']],
  ['Accent', ['accent', 'accent-ink', 'accent-strong', 'accent-hover', 'accent-soft']],
  ['Danger', ['danger', 'danger-ink', 'danger-soft']],
  ['Per-item state', ['ok', 'warn', 'miss']],
  ['Shape and type', ['radius', 'radius-sm', 'radius-pill', 'radius-item', 'font', 'mono']],
  ['Shadow', ['shadow-sm', 'shadow']],
];

/* Tokens whose value is the same in both schemes. Repeating them inside the dark
   block would imply they change there, and the next person would keep them in
   sync by hand forever. */
const SCHEME_INVARIANT = new Set(['radius', 'radius-sm', 'radius-pill', 'radius-item', 'font', 'mono', 'accent', 'accent-ink']);

function block(tokens, indent, skip = null) {
  const out = [];
  for (const [heading, names] of ORDER) {
    const rows = names
      .filter((n) => n in tokens && !(skip && skip.has(n)))
      .map((n) => `${indent}  --${n}: ${tokens[n]};`);
    if (!rows.length) continue;
    if (out.length) out.push('');
    out.push(`${indent}  /* ${heading} */`, ...rows);
  }
  return out.join('\n');
}

/**
 * @param {string} accent   the product's declared hue
 * @param {string} product  its name, for the header
 * @param {{ok?:boolean}} opts  passed through to derive()
 *
 * The header names the generator and the input, and nothing about *when* or
 * *from which commit* this ran. See the head of build.js: a generated file may
 * only carry what its inputs determine, and both of the stamps that have stood
 * here broke the check that says the committed files are current.
 */
export function toCss(accent, product, opts = {}) {
  const { light, dark } = derive(accent, opts);

  return `/*
 * Generated from Lautstark/design — do not edit.
 *
 * Every value below follows from one input, ${product}'s accent ${accent}, and is
 * regenerated whenever the design repository moves. Editing this file by hand
 * survives exactly until the next sync and silently drops the contrast
 * guarantees, which are checked at generation time and not at runtime.
 *
 * To change a value here, change the rule that produces it.
 */

:root {
  color-scheme: light dark;

${block(light.tokens, '')}
}

@media (prefers-color-scheme: dark) {
  :root {
${block(dark.tokens, '  ', SCHEME_INVARIANT)}
  }
}

/* A choice, where the two rules above are the absence of one. Nothing sets this
   attribute unless somebody picked a scheme in that product's settings; with it
   unset the media query is still the whole story, which is what "follows the
   OS" has always meant here and stays the default.

   An attribute selector rather than light-dark(). Both express one rule instead
   of two, and light-dark() would express it without repeating a single value —
   but it fails as one piece: a browser that cannot parse it drops every
   declaration holding it, and the page comes up with no tokens at all rather
   than with the wrong scheme. These products run on donated and hand-me-down
   tablets that cannot take a current OS, and a scheme toggle is not worth
   trading a blank page for. The repetition below is in generated output, where
   it costs nothing and nobody maintains it.

   color-scheme is re-declared in each, and it is the half that is easy to drop:
   without it the browser keeps drawing its own furniture — scrollbars, the open
   list of a select, a date picker — in the scheme the OS asked for, and a page
   set to light grows a black scrollbar down the side of it. */
:root[data-theme="light"] {
  color-scheme: light;

${block(light.tokens, '', SCHEME_INVARIANT)}
}

:root[data-theme="dark"] {
  color-scheme: dark;

${block(dark.tokens, '', SCHEME_INVARIANT)}
}
`;
}

/**
 * The same tokens as a single scheme, for a product that commits to one ground
 * rather than following the OS.
 */
export function toCssSingle(accent, product, scheme, opts = {}) {
  const { tokens } = derive(accent, opts)[scheme];

  return `/*
 * Generated from Lautstark/design — do not edit.
 *
 * ${product} commits to a ${scheme} ground, so only that scheme is emitted. The
 * declaration below is what makes the browser draw its own furniture to match:
 * without it a scrollbar or a select drop-down arrives in the opposite scheme.
 *
 * Every value follows from one input, the accent ${accent}. To change one,
 * change the rule that produces it.
 */

:root {
  color-scheme: ${scheme};

${block(tokens, '')}
}
`;
}
