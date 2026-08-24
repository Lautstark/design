/*
 * A button that opens a list of things to do, and the keyboard that goes with
 * it.
 *
 * The three products each had one of these, and the audit called it the closest
 * agreement in the whole comparison: mitreden's `.menu` and bildhaft's popover
 * matched to the pixel before either had heard of this package. What differed
 * was the plumbing around the same DOM — which is the definition of a thing
 * that belongs here rather than three times.
 *
 * It replaces the native <select> all three used to open. A select's list is
 * drawn by the operating system, so it is the one control on a page that cannot
 * follow the tokens; that was survivable while a product committed to a dark
 * ground and stopped being survivable when the scheme became a choice, because
 * the tokens set color-scheme per theme and the OS list follows the OS instead.
 *
 * Nothing here draws anything. `.menu`, `.menu-anchor`, `.menu button.danger`
 * and the tick on a checked item are all components.css's, and this file only
 * writes the class names and the roles that stylesheet is written against.
 *
 * ## What the caller provides
 *
 * A trigger that is already in the document, inside a `.menu-anchor` — the menu
 * is appended to the trigger's parent and positioned against it, so the anchor
 * is what decides where the list hangs. `.menu-anchor.start` opens it to the
 * left. Building the trigger is deliberately not this file's job: one product
 * draws a `⋯`, one a labelled dropdown, and the markup for those lives with the
 * page that reads.
 *
 * ## Nothing is listening while nothing is open
 *
 * The two document listeners — a press outside closes the open menu, Escape
 * closes it — are attached when a menu opens and removed when it closes. Two of
 * the three products attached them at module scope instead, which works and
 * costs two things worth not paying: a page with no menu on it still runs a
 * handler on every click, and importing the module at all requires a document,
 * so it throws in a test runner that has none. bildhaft's copy already did it
 * this way; this is that half of it kept.
 */

/** The trigger the open menu belongs to, so focus has somewhere to go back to. */
let opener = null;

/** The items worth landing on. A disabled one is skipped, not stepped through. */
const rows = (menu) => [...menu.querySelectorAll('button:not(:disabled)')];

/** Closes whatever is open. Safe to call when nothing is. */
export function closeMenus() {
  removeEventListener('click', onPress);
  removeEventListener('keydown', onEscape, true);
  for (const menu of document.querySelectorAll('.menu')) {
    // Focus returns to the trigger only when it was inside the menu to begin
    // with. Escape and an activated item both arrive here with focus in the
    // list, and both want it back on the button that opened it; a click
    // somewhere else on the page arrives here too, and pulling focus back
    // would yank it out of whatever that click just gave it to.
    if (menu.contains(document.activeElement)) opener?.focus();
    menu.remove();
  }
  opener = null;
  for (const button of document.querySelectorAll('[aria-expanded="true"]'))
    button.setAttribute('aria-expanded', 'false');
}

/**
 * Home/End and the arrows, so an open list is walkable without a mouse.
 *
 * On the menu element rather than on the document, which is what keeps it from
 * stealing an arrow press meant for the page behind it: the listener only ever
 * fires while focus is inside the list it belongs to.
 */
function stepMenu(event) {
  const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
  if (!keys.includes(event.key)) return;
  const menu = event.currentTarget;
  const list = rows(menu);
  const at = list.indexOf(document.activeElement);
  if (at < 0 || !list.length) return;
  event.preventDefault();
  const to = event.key === 'Home' ? 0
    : event.key === 'End' ? list.length - 1
      : event.key === 'ArrowDown'
        ? (at + 1) % list.length
        : (at - 1 + list.length) % list.length;
  list[to]?.focus();
}

/*
 * Dismissal, both ways round. Named rather than inline so that closeMenus() can
 * take them off again.
 *
 * The press listener asks whether the click landed inside an anchor rather than
 * inside the menu, because the trigger is in the anchor too and its own handler
 * has to be the thing that decides what a second press means.
 */
const onPress = (event) => {
  if (!event.target?.closest?.('.menu-anchor')) closeMenus();
};

/*
 * Escape dismisses the menu and stops there.
 *
 * Capture phase, so it runs before anything below it gets the key. A menu can
 * be opened inside a <dialog> shown with showModal(), and the browser closes
 * that dialog on Escape too — so without claiming the event the first press
 * took the whole sheet with it, which is not what somebody dismissing a
 * drop-down asked for. The listener only exists while a menu is open, so with
 * none open Escape still closes the dialog, which is the way out of it.
 */
const onEscape = (event) => {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  event.stopPropagation();
  closeMenus();
};

/**
 * Opens a menu under `button`, or closes the one already there.
 *
 * `build` is handed an `add(label, run, opts)` and calls it once per item. It
 * runs while the menu is being assembled, so an item's label and its checked
 * state are read at the moment of opening rather than captured when the trigger
 * was wired — which is what lets a product pass a function that reads current
 * state and get a menu that is right every time it opens.
 */
export function menuOn(button, build) {
  const open = button.getAttribute('aria-expanded') === 'true';
  closeMenus();
  if (open) return;                       // a second press is a dismissal
  button.setAttribute('aria-expanded', 'true');
  // "menu" rather than "true": both open a menu as far as the ARIA spec goes,
  // but the first says which kind. Set here rather than trusted to the markup,
  // because it was in the markup on some triggers and not others.
  button.setAttribute('aria-haspopup', 'menu');

  const menu = document.createElement('div');
  menu.className = 'menu';
  menu.setAttribute('role', 'menu');

  build((label, run, opts = {}) => {
    const item = document.createElement('button');
    // Explicit, because a <button> inside a <form> submits it by default and
    // these are drawn into whatever the page happens to be.
    item.type = 'button';
    item.textContent = label;
    // A menu of alternatives, one of which is in force. aria-checked on
    // menuitemradio is what says which; a plain list would read as five equal
    // commands and leave the current one to be inferred from the drawing.
    item.setAttribute('role', opts.checked === undefined ? 'menuitem' : 'menuitemradio');
    if (opts.checked !== undefined) item.setAttribute('aria-checked', String(opts.checked));
    if (opts.danger) item.className = 'danger';
    if (opts.disabled) item.disabled = true;
    item.onclick = (event) => { event.stopPropagation(); run(); };
    menu.appendChild(item);
  });

  menu.addEventListener('keydown', stepMenu);
  button.parentNode?.appendChild(menu);
  opener = button;
  // Focus goes in, or the menu is only open in the drawing: a reader left on
  // the trigger is told the list expanded and then has nothing to read, and a
  // keyboard has no way into it at all. That was the whole of the defect this
  // shape was written to fix.
  rows(menu)[0]?.focus();

  /* Attached last, once there is something for them to dismiss. The click that
   * opened this menu is still in flight and will reach the document after this
   * line — onPress sees the trigger's own .menu-anchor and leaves it alone,
   * which is the same answer it gives to a second press. */
  addEventListener('click', onPress);
  addEventListener('keydown', onEscape, true);
}

