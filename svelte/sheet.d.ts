/* Hand-written, because sheet.js is hand-written JavaScript rather than build
   output: this package ships source and has no compile step. Every consumer is
   TypeScript and resolves types through `exports`, so without this file the
   import is `any` — and `closeLabel` being required, `title` taking a thunk and
   the handle carrying `body` are the three things worth being types rather than
   conventions. Same reasoning as dialog.d.ts, which types the vanilla half. */

import type { Component } from 'svelte';

/** What `openSheet` hands back. vorlaut's superset: `body` is on it because a
 *  caller sometimes has to reach the region — a sheet that rewrites its own
 *  contents, or one that has to scroll a row into view. */
export interface Handle {
  /** However it closes, `onClose` runs once and the sheet leaves the document. */
  close(): void;
  dialog: HTMLDialogElement;
  body: HTMLElement;
}

/** What the body, head and foot components are handed: the caller's own state,
 *  and the handle — so a foot button can close the sheet it is in without the
 *  caller threading a closure through. */
export interface SheetContent<S> {
  s: S;
  handle: Handle;
}

export interface SheetOptions<S> {
  /**
   * The heading, and the accessible name.
   *
   * A thunk where it changes: wochenwerk's appointment sheet renames the dialog
   * as its title field is typed into, and five of its e2e cases find that
   * dialog by its *current* name. Today that only survives because
   * `handle.dialog.setAttribute` reaches past the frame, which works until
   * anything re-renders the attribute.
   */
  title: string | (() => string);
  /** The accessible name of the corner ✕. Required, and with no fallback: a
   *  sheet with both a ✕ and a footer dismiss must not give them one name. */
  closeLabel: string;
  /** vorlaut's `#legal` is 520px by an id selector, and that id is
   *  load-bearing — see conventions.md §6.1. */
  id?: string;
  /** The heading's id, the ✕'s and the `.body`'s — forwarded to `Sheet`, which
   *  takes all three because the suites are built on them. They are declared
   *  here because an opener that hides a prop its own callers need has not
   *  simplified anything, it has moved the reach one level up: §6.12 wrote that
   *  rule about `Legal` and this file broke it in the same week. wochenwerk
   *  found it — every one of its five sheets goes through `openSheet`, so
   *  `titleId` was unreachable there however much it wanted one. */
  titleId?: string;
  closeId?: string;
  bodyId?: string;
  /** A column of `<details>`, 900px. */
  panels?: boolean;
  /** A grid of cards, 1060px. */
  wide?: boolean;
  /** Lands on the `<dialog>` itself, not on a wrapper: six of vorlaut's rules
   *  are direct-child selectors and a wrapper breaks all six. */
  class?: string;
  /** Handed to each of the three components below. */
  state: S;
  body: Component<SheetContent<S>>;
  /** Replaces the `<h2>`; it does not sit beside a hidden one. */
  head?: Component<SheetContent<S>>;
  /** The `.foot` is drawn only when this is given. */
  foot?: Component<SheetContent<S>>;
  /** Called once, however the sheet closed. For the dismissal paths only where
   *  the caller wants an answer — see the note in sheet.js. */
  onClose?: () => void;
}

/** Opens a modal sheet. Returns a handle, and never a promise. */
export declare function openSheet<S>(options: SheetOptions<S>): Handle;
