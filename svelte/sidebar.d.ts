/* Hand-written, because sidebar.js is hand-written JavaScript rather than build
   output: this package ships source and has no compile step. Same reasoning as
   sheet.d.ts beside it. */

/** Below this the sidebar is a layer over the work, not a column beside it.
 *  conventions.md §3.1, and the string `matchMedia` wants. */
export declare const NARROW: string;

/**
 * What a control that shows or hides the sidebar has to carry.
 *
 * Handed to the `brand` snippets of `Sidebar`, `Reveal` and `TopBar`, and
 * spread onto the product's own button: `<button {...wired} onclick={…}>`.
 * The collapse control is the product's — in bildhaft it is the third flex
 * child of the brand row, so a component-owned chevron and a product-owned
 * brand cannot both be true (conventions.md §6.3) — and this is the half of it
 * that is about an element inside the component and so cannot be the product's.
 *
 * `aria-expanded` is a boolean expression rather than a string: Svelte compiles
 * it to `set_attribute`, which removes only on `null`, so `false` reaches the
 * DOM as `"false"` — which is what a toggle button is supposed to say. §6.0
 * draws that line, and draws the other half of it too: `aria-current` is a
 * token attribute and is `"true"` or absent.
 */
export interface Wired {
  'aria-controls': string | undefined;
  'aria-expanded': boolean;
}
