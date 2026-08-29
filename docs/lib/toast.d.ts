/* Hand-written, because toast.js is hand-written JavaScript rather than build
   output: this package ships source and has no compile step. The three products
   are TypeScript and all three resolve types through `exports`, so without this
   file the import is `any` — and here that would cost the one thing this module
   is for, since `node` being required is what makes "the region is already in
   the page" a type rather than a hope. The same reasoning as rename.d.ts beside
   it. */

/** What a caller may vary. Everything here is a product's own answer to "and
 *  then what"; the invariant this module holds is not configurable. */
export interface AnnouncerOpts {
  /** Milliseconds after a message before `onRest` runs. 0, the default, means
   *  the message stays as it is. */
  rest?: number;
  /** What happens then — empty the line, dim it, whatever this product does
   *  when a message has been up long enough. Never called for `busy()`: a job
   *  in flight has not finished. */
  onRest?: (node: HTMLElement) => void;
  /** A class `busy()` adds and every `say()` removes. Omit it in a product
   *  with no busy state. */
  /** The inverse of `onRest`, run whenever the line becomes current again.
   *
   *  Needed exactly when `onRest` does not undo itself. bildhaft's empties the
   *  text and the next message overwrites it, so it has none; vorlaut's adds a
   *  class, and without this its line came back carrying the fade that
   *  belonged to the message before. */
  onWake?: (node: HTMLElement) => void;
  busyClass?: string;
}

/** The handle a wrapped region gives back. */
export interface Announcer {
  /** The region itself, for a product that has to mount or measure it. */
  node: HTMLElement;
  /** Something finished. Cancels any pending rest; the line stays lit. */
  say(text: string): HTMLElement;
  /** Said, and then allowed to go quiet - `onRest` after `rest` ms. A second
   *  verb rather than an option, because which one a message wants is a
   *  property of the message rather than of the region: vorlaut's failed write
   *  stays lit and its "saved" fades, on the same element. */
  rests(text: string): HTMLElement;
  /** Something started. Rests nothing, and marks the line busy if this
   *  announcer was given a class for it. */
  busy(text: string): HTMLElement;
  /** Quiet, now. The node stays exactly where it is. */
  clear(): HTMLElement;
}

/**
 * Wraps a live region that is **already in the page**.
 *
 * The node is the caller's and is never added or removed here. That is the
 * whole point of the module: a live region is announced because a reader was
 * already watching it, so one that arrives carrying its message announces
 * nothing. All three products had that bug at once, each by a different route.
 */
export declare function announcer(node: HTMLElement, options?: AnnouncerOpts): Announcer;
