/*
 * The one number the sidebar and its three satellites have to agree on.
 * conventions.md §6.3.
 *
 * 820px is §3.1's breakpoint and it is written down four times in every
 * product: in the stylesheet, where the column becomes a layer; in a `narrow()`
 * helper, where a press decides whether to dismiss; in the media query that
 * hides the reveal; and in the one that hides the drawer's `✕`. Three of those
 * four move into these components. This is the fourth, exported so the
 * product's stylesheet and the product's own helper can be written against the
 * same string rather than against the same memory of it — the two have to
 * agree, or the controls and the layout disagree about which arrangement is on
 * screen, and nothing on either side says so.
 *
 * A media query string rather than a number, because the thing a caller
 * actually wants is `matchMedia(NARROW)`, and a number would be reassembled
 * into this string at every call site with a chance of a `<=` in it.
 */

/** Below this the sidebar is a layer over the work, not a column beside it. */
export const NARROW = '(max-width: 820px)';
