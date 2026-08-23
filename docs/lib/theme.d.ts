/* Hand-written, because theme.js is hand-written JavaScript rather than build
   output: this package ships source and has no compile step. The three products
   are TypeScript and all three resolve types through `exports`, so without this
   file the import is `any` and the three-value union — the whole point of the
   type — is not checked anywhere. */

export type Theme = 'system' | 'light' | 'dark';

export declare const THEMES: readonly Theme[];

/** The stored choice, or `system` when nothing is stored or storage throws. */
export declare function readTheme(key: string): Theme;

/** Stores a choice. `system` removes the key rather than writing the word. */
export declare function saveTheme(key: string, theme: Theme): void;

/** Which scheme is on screen, with `system` resolved against the OS. */
export declare function resolveTheme(theme: Theme): Exclude<Theme, 'system'>;

/** Puts a scheme in force and repaints the browser chrome to match. */
export declare function applyTheme(theme: Theme): void;

/** Applies the stored choice and keeps the chrome right; returns what it read. */
export declare function initTheme(key: string): Theme;

/** The stored-choice read, for inlining in <head> ahead of the stylesheet. */
export declare function bootSnippet(key: string): string;
