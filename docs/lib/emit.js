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
 * @param {{ok?:boolean, source?:string}} opts  `source` is the design-repo commit
 *   this was generated from; build.js passes the real one
 */
export function toCss(accent, product, opts = {}) {
  const { light, dark } = derive(accent, opts);
  const src = opts.source ? `Lautstark/design@${opts.source}` : 'Lautstark/design';

  return `/*
 * Generated from ${src} — do not edit.
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
`;
}

/**
 * The same tokens as a single scheme, for a product that commits to one ground
 * rather than following the OS.
 */
export function toCssSingle(accent, product, scheme, opts = {}) {
  const { tokens } = derive(accent, opts)[scheme];
  const src = opts.source ? `Lautstark/design@${opts.source}` : 'Lautstark/design';

  return `/*
 * Generated from ${src} — do not edit.
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
