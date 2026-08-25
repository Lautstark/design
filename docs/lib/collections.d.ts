/* Hand-written, because collections.js is hand-written JavaScript rather than
   build output: this package ships source and has no compile step. The same
   reasoning as menu.d.ts and rename.d.ts beside it. */

/** One Sammlung, as a row shows it. */
export interface CollectionRow {
  id: string;
  /** Exactly what to draw, including a product's own fallback for a Sammlung
   *  nobody has named. Nothing here derives a display name. */
  name: string;
  /** How much is inside. Left off where it is not known yet — a row can exist
   *  before its number does, and drawing 0 would claim the Sammlung is empty. */
  count?: number | null;
  /** A second line under the name, drawn exactly as passed.
   *
   *  The same rule `name` above carries, and for the same reason: nothing here
   *  derives it. The row does not know what a Sammlung is *for*, and the one
   *  product that has an answer — vorlaut, where a Sammlung is built either for
   *  the DIY talker or for the tablet, and a tablet one has a page size —
   *  writes the words in its own texts. A field of `{ target, grid }` was the
   *  other candidate and is the reason this one is a string: it would have put
   *  one product's model, and then its German, into a file the other two read.
   *
   *  Left off by the products that have no second fact about a Sammlung.
   *  Absent draws no second line and no gap where one would have been — the row
   *  is then exactly the row it was before this field existed, which is what
   *  mitreden and bildhaft get without changing a caller. */
  subtitle?: string | null;
}

export interface CollectionRowsOpts {
  rows: CollectionRow[];
  /** Which ids are open. A set rather than one id because arity is per product
   *  (conventions.md §4.1): one in vorlaut and bildhaft, several in mitreden. */
  open: Iterable<string>;
  /**
   * A row was pressed. `additive` is true when the press carried Cmd or Ctrl —
   * the "and also this one" chord §4.2 settles, decided here so that it cannot
   * drift to a different key in one product. A product whose arity is one
   * ignores it.
   */
  onPick(id: string, additive: boolean): void;
}

/**
 * Empties `container` and draws one row per Sammlung: the name, the count, and
 * `aria-current` on the ones that are open.
 *
 * `container` carries `.collections` and belongs to the caller — where in a
 * sidebar the list sits, what is above it and what is under it all differ, and
 * so does the sidebar itself.
 */
export declare function drawCollections(
  container: HTMLElement,
  opts: CollectionRowsOpts,
): void;
