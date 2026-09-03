/* Hand-written, like theme.d.ts and dialog.d.ts beside it: this package ships
   source and has no compile step, so without this file the import is `any` and
   the shape below is checked nowhere. */

/** What each language calls itself, in itself. Not a translation table. */
export declare const NAMES: Record<string, string>;

export interface LanguagePickerOptions {
  /** The codes to offer, in the order to offer them. */
  languages: readonly string[];
  /** The code in force, read on every repaint rather than captured. */
  current: () => string;
  /** What to do when one is pressed. The product owns what a switch means. */
  choose: (code: string) => void;
  /** The group's accessible name — the product's word for "Language". */
  label: string;
  /** Names for languages `NAMES` does not know, or better ones for those it does. */
  names?: Record<string, string>;
}

export interface LanguagePicker {
  /** The `.segmented` row itself. Where it sits is the product's business. */
  node: HTMLElement;
  /** Move the pressed button. Two of the three products switch without reloading. */
  refresh: () => void;
}

export declare function languagePicker(options: LanguagePickerOptions): LanguagePicker;
