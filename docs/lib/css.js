/*
 * The two halves of the CSS contract, conventions.md §4.12: a shared module
 * that emits markup brings its CSS.
 *
 * Until 2026-09-16 that was prose. Then sicherung, bildquelle and stimmquelle
 * each grew a `test/css-contract.test.ts` that renders its panels, collects
 * every class token underneath them and holds the difference against
 * `components.css` to empty. The check was worth having three times; the two
 * functions were not. All three copies are character-identical and all three
 * say in their header that they belong here, beside the file they read, the
 * day a release of design can carry them. This is that day.
 *
 * What stays with the packages is the `KNOWN_MISSING` map. Those are dated
 * local exceptions with a reason each, and sicherung's guard test — which
 * asserts its three exceptions are *still* undrawn, so the entry goes the day
 * the rule lands — only makes sense next to them.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

/**
 * Every class name that has a rule in `components.css`.
 *
 * Read off the shipped file rather than off a list, because a list is a third
 * copy of the vocabulary and would drift from the rules the same way the rules
 * drifted from each other.
 *
 * @param {string} [path] The stylesheet to read. Defaults to the
 *   `@lautstark/design/components.css` this package resolves to, which is what
 *   a consumer's own test wants: the assertion is that what the products
 *   import draws what the package emits.
 * @returns {Set<string>}
 */
export function drawnClasses(path) {
  const file = path ?? createRequire(import.meta.url).resolve('@lautstark/design/components.css');
  const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const drawn = new Set();
  // The text before each `{` is a selector list (or an at-rule prelude, which
  // holds no class). Declarations never reach this: they sit after the brace.
  for (const [, prelude] of css.matchAll(/([^{};]+)\{/g)) {
    for (const [, name] of prelude.matchAll(/\.([A-Za-z_][\w-]*)/g)) drawn.add(name);
  }
  return drawn;
}

/* Svelte's scoping hash, which is on the element beside the real names.
 *
 * Measured 2026-09-17: a panel component with a `<style>` block emitted
 * `["panel", "svelte-1fnslke", "section", "state", "body"]`. The hash has no
 * selector in components.css and never will — it is the mechanism by which a
 * component's own arrangement travels with it — so an unfiltered contract test
 * fails every Svelte component that styles itself and reports a hash as the
 * missing class, which is a message nobody can act on. */
const SCOPE = /^svelte-[0-9a-z]+$/;

/**
 * Every class token on a node and everything under it, minus Svelte's own.
 *
 * @param {Element} root
 * @returns {Set<string>}
 */
export function emittedClasses(root) {
  const names = new Set();
  for (const el of [root, ...root.querySelectorAll('*')]) {
    for (const name of el.classList) if (!SCOPE.test(name)) names.add(name);
  }
  return names;
}
