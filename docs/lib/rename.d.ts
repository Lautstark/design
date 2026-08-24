/* Hand-written, because rename.js is hand-written JavaScript rather than build
   output: this package ships source and has no compile step. The three products
   are TypeScript and all three resolve types through `exports`, so without this
   file the import is `any` — and the distinction between `refresh` and a bare
   assignment is the whole point, so it is worth being a type rather than a
   convention. The same reasoning as menu.d.ts beside it. */

/** What a caller may vary. One field, because the rest of the behaviour is the
 *  thing being agreed rather than configured. */
export interface RenameOpts {
  /** Milliseconds after the last keystroke before the name is written.
   *  Defaults to 400. */
  delay?: number;
}

/** The handle a bound field gives back. */
export interface RenameField {
  /**
   * Put the stored name in the field, unless the field is the better authority
   * — which it is while somebody is typing in it, and while a keystroke is
   * waiting out its debounce.
   *
   * **This is the only way to assign the field.** Every product had a repaint
   * that assigned it directly, and doing so is the bug this module exists to
   * remove: the stored name lands on top of what somebody has just typed, and
   * the write that follows saves it.
   */
  refresh(name: string): void;

  /** Write now if the value has moved since it was last written; resolve when
   *  that write does. Call it before anything that would leave a pending
   *  keystroke nowhere to land. */
  flush(): Promise<void>;

  /** Remove the listeners and drop any pending write. */
  stop(): void;
}

/**
 * Binds a field so that typing in it renames the thing it names — debounced
 * while typing, written on blur and on Enter, and never written when the value
 * has not moved.
 *
 * `write` receives the field's raw value: untrimmed, and possibly empty.
 * Whether either is acceptable is the product's decision and is made there —
 * one of the three refuses an empty name and another draws a fallback for it.
 */
export declare function renameField(
  input: HTMLInputElement,
  write: (name: string) => void | Promise<void>,
  opts?: RenameOpts,
): RenameField;
