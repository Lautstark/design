/* Hand-written, because menu.js is hand-written JavaScript rather than build
   output: this package ships source and has no compile step. The three products
   are TypeScript and all three resolve types through `exports`, so without this
   file the import is `any` — and `ItemOpts` is the whole point, since the field
   names are what stopped two copies of this function meaning opposite things by
   the same third argument. The same reasoning as theme.d.ts beside it. */

/**
 * What an item is besides its label. All three optional, because the common
 * item is a plain command and should read as one at the call site.
 *
 * `checked` is deliberately a tri-state. Left off, the item is a command and
 * gets `role="menuitem"`; set either way, the menu is a set of alternatives and
 * the item gets `role="menuitemradio"` with `aria-checked`, which is what says
 * *which* alternative is in force — a plain list reads as equal commands and
 * leaves that to be inferred from the drawing.
 *
 * These were positional booleans in two products and the position drifted: the
 * same third argument meant "this is destructive" in one and "this one is in
 * force" in the other, so two copies of one function announced opposite things.
 * Naming the fields is what stops that recurring, and it is why bildhaft's own
 * copy carried `checked` before it had anything to check.
 */
export interface ItemOpts {
  /** Drawn in the danger colour. For the item that destroys something. */
  danger?: boolean;
  /** Present at all makes this a set of alternatives. See above. */
  checked?: boolean;
  /** Present but not reachable: skipped by the arrows rather than stepped on. */
  disabled?: boolean;
}

/** What `build` is handed. Call it once per item, in the order they appear. */
export type AddItem = (label: string, run: () => void, opts?: ItemOpts) => void;

/**
 * Opens a menu under `button`, or closes the one already there.
 *
 * The trigger must already be in the document inside a `.menu-anchor`: the list
 * is appended to the trigger's parent, and that anchor is what positions it.
 */
export declare function menuOn(button: HTMLElement, build: (add: AddItem) => void): void;

/** Closes whatever is open, and puts focus back on its trigger. */
export declare function closeMenus(): void;
