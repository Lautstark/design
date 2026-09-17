/*
 * Keeps an open list inside the sheet it was opened in, or inside the window
 * where there is no sheet.
 *
 * vorlaut's `shell/fit.ts`, which conventions.md §6.10 brings along with
 * bildhaft's `ActionMenu` shape: it is the only one of the eleven call sites
 * that flips the anchor upwards and caps the height, and both are things a
 * long list in a sheet needs.
 *
 * A sheet's body is the one scrolling area (see `.sheet > .body`), and a list
 * positioned inside a scrolling box is clipped by it and adds to what it
 * scrolls. So a long menu near the foot of a sheet — Wortart is eleven entries
 * — pushed the sheet's own scrollbar out and hid its own last rows behind the
 * foot.
 *
 * Two answers, in this order. Open upward where there is more room above than
 * below, which is what a menu at the foot of a form needs and all a chooser of
 * three or four ever needs. Then cap what is left, so that a list too long for
 * either side scrolls within itself rather than out of the sheet.
 *
 * ## Why the scroll is written here and not in components.css
 *
 * vorlaut draws it as `.form__row .menu { overflow-y: auto }`, scoped to the
 * rows it knows are in a sheet. The shared component cannot scope it that way
 * and the alternative — `overflow-y` on `.menu` itself — would put a scroll
 * container on every menu in four products to serve the ones that get a cap.
 * A cap and its scroll are one decision, so they are written by the same line.
 * `overscroll-behavior: contain` is the other half: without it, scrolling to
 * the end of the list carries on scrolling the sheet behind it.
 */

/**
 * @param {HTMLElement} anchor The `.menu-anchor` the list was appended to.
 * @param {HTMLElement} button The trigger that opened it.
 */
export function fit(anchor, button) {
  const menu = /** @type {HTMLElement | null} */ (anchor.querySelector('.menu'));
  // A second press on the trigger is a dismissal, and menuOn has already
  // closed the list rather than opened one.
  if (!menu) {
    anchor.classList.remove('menu-anchor--up');
    return;
  }

  const box = anchor.closest('.body');
  const view = box
    ? box.getBoundingClientRect()
    : new DOMRect(0, 0, window.innerWidth, window.innerHeight);
  const at = button.getBoundingClientRect();
  // The 6px components.css hangs the list at, spent again at the far end so a
  // capped list does not sit flush against the edge it was capped by.
  const gap = 12;
  const below = view.bottom - at.bottom - gap;
  const above = at.top - view.top - gap;
  const up = menu.offsetHeight > below && above > below;

  anchor.classList.toggle('menu-anchor--up', up);
  // A floor, because a cap small enough to show nothing is worse than a list
  // that overhangs: two rows and a scrollbar is still a menu.
  menu.style.maxHeight = `${Math.max(96, Math.floor(up ? above : below))}px`;
  menu.style.overflowY = 'auto';
  menu.style.overscrollBehavior = 'contain';
}
