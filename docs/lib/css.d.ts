/* Hand-written, because css.js is hand-written JavaScript rather than build
   output: this package ships source and has no compile step. The provider
   packages that consume this are TypeScript and resolve types through
   `exports`, so without this file the import is `any`. Same reasoning as
   menu.d.ts and theme.d.ts beside it. */

/**
 * Every class name that has a rule in `components.css`.
 *
 * `path` defaults to the `@lautstark/design/components.css` this package
 * resolves to — which is the one a consumer's contract test wants, since what
 * is being asserted is that what the products import draws what the package
 * under test emits.
 */
export declare function drawnClasses(path?: string): Set<string>;

/**
 * Every class token on a node and everything under it.
 *
 * Svelte's scoping hash (`svelte-1fnslke`) is skipped: it is on the element
 * beside the real names, it has no selector in `components.css` and never
 * will, and reporting it as a missing class is a failure nobody can act on.
 */
export declare function emittedClasses(root: Element): Set<string>;
