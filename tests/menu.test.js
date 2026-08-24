import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeMenus, menuOn } from '../docs/lib/menu.js';

/* The overflow menu.
 *
 * The three products agreed about the drawing before this package existed and
 * differed in the plumbing, so most of what is pinned here is plumbing: where
 * focus goes, what a second press means, what closes it and what that costs the
 * page behind it.
 *
 * Two cases are the ones worth having. Focus going *into* the list is the whole
 * defect the shape was written to fix - without it a reader is told the list
 * expanded and then has nothing to read, and a keyboard has no way in at all.
 * And Escape claiming the event is what keeps a menu opened inside a <dialog>
 * from taking the whole sheet with it on the first press.
 */

let anchor;
let trigger;

beforeEach(() => {
  document.body.innerHTML = '';
  anchor = document.createElement('div');
  anchor.className = 'menu-anchor';
  trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.textContent = '⋯';
  anchor.appendChild(trigger);
  document.body.appendChild(anchor);
});

afterEach(() => {
  closeMenus();
});

const menu = () => document.querySelector('.menu');
const items = () => [...document.querySelectorAll('.menu button')];
const labels = () => items().map((i) => i.textContent);

const open = (build) => menuOn(trigger, build ?? ((add) => {
  add('Export', () => {});
  add('Delete', () => {}, { danger: true });
}));

const press = (key, target = menu()) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

describe('opening', () => {
  it('hangs the list off the trigger\'s anchor, so it is positioned by it', () => {
    open();
    expect(menu().parentElement).toBe(anchor);
  });

  it('says what it opened, on the trigger', () => {
    open();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-haspopup'), 'which kind, not merely that there is one')
      .toBe('menu');
  });

  it('is a menu, and its items are menu items', () => {
    open();
    expect(menu().getAttribute('role')).toBe('menu');
    expect(items().map((i) => i.getAttribute('role'))).toEqual(['menuitem', 'menuitem']);
  });

  /* The defect this shape was written to fix. */
  it('puts focus on the first item', () => {
    open();
    expect(document.activeElement).toBe(items()[0]);
  });

  it('builds the items at the moment of opening, not when the trigger was wired', () => {
    let n = 0;
    const build = (add) => { n += 1; add(`Opened ${n} time(s)`, () => {}); };
    open(build);
    expect(labels()).toEqual(['Opened 1 time(s)']);
    closeMenus();
    open(build);
    expect(labels(), 'so an item can read state that has moved since').toEqual(['Opened 2 time(s)']);
  });

  it('a second press on the trigger is a dismissal', () => {
    open();
    expect(menu()).not.toBeNull();
    open();
    expect(menu()).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('opening a second menu closes the first', () => {
    const other = document.createElement('div');
    other.className = 'menu-anchor';
    const otherTrigger = document.createElement('button');
    other.appendChild(otherTrigger);
    document.body.appendChild(other);

    open();
    menuOn(otherTrigger, (add) => add('Elsewhere', () => {}));

    expect(document.querySelectorAll('.menu')).toHaveLength(1);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(otherTrigger.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('the items', () => {
  /* Every call site in all three products opened with closeMenus() as its first
   * statement - a line repeated a dozen times and silent when forgotten, and
   * what it left behind was the menu sitting over the dialog the item had just
   * opened. */
  it('runs an item with the list already gone', () => {
    let openAtRunTime = true;
    open((add) => add('Export', () => { openAtRunTime = menu() !== null; }));
    items()[0].click();
    expect(openAtRunTime, 'so an item never has to dismiss the list it is in').toBe(false);
  });

  it('gives focus back to the trigger when an item is chosen', () => {
    open();
    items()[0].click();
    expect(document.activeElement).toBe(trigger);
  });

  it('marks a destructive item, and does not submit a form around it', () => {
    open();
    expect(items()[1].className).toBe('danger');
    expect(items().map((i) => i.type)).toEqual(['button', 'button']);
  });

  /* `checked` is a tri-state on purpose. Left off, the item is a command; set
   * either way, the menu is a set of alternatives and the item says which one
   * is in force - a plain list reads as equal commands and leaves that to be
   * inferred from the drawing. */
  it('is a command when checked is left off', () => {
    open((add) => add('Export', () => {}));
    expect(items()[0].getAttribute('role')).toBe('menuitem');
    expect(items()[0].hasAttribute('aria-checked')).toBe(false);
  });

  it('is an alternative when checked is given, either way round', () => {
    open((add) => {
      add('Deutsch', () => {}, { checked: true });
      add('English', () => {}, { checked: false });
    });
    expect(items().map((i) => i.getAttribute('role')))
      .toEqual(['menuitemradio', 'menuitemradio']);
    expect(items().map((i) => i.getAttribute('aria-checked'))).toEqual(['true', 'false']);
  });

  it('can be present without being reachable', () => {
    open((add) => {
      add('Export', () => {});
      add('Send', () => {}, { disabled: true });
    });
    expect(items()[1].disabled).toBe(true);
  });
});

describe('the keyboard', () => {
  const four = (add) => {
    add('One', () => {});
    add('Two', () => {});
    add('Three', () => {});
    add('Four', () => {});
  };

  it('walks down and wraps', () => {
    open(four);
    press('ArrowDown');
    expect(document.activeElement.textContent).toBe('Two');
    press('ArrowDown'); press('ArrowDown');
    expect(document.activeElement.textContent).toBe('Four');
    press('ArrowDown');
    expect(document.activeElement.textContent, 'round to the top').toBe('One');
  });

  it('walks up and wraps', () => {
    open(four);
    press('ArrowUp');
    expect(document.activeElement.textContent, 'round to the bottom').toBe('Four');
  });

  it('Home and End go to the ends', () => {
    open(four);
    press('End');
    expect(document.activeElement.textContent).toBe('Four');
    press('Home');
    expect(document.activeElement.textContent).toBe('One');
  });

  /* Skipped, not stepped on: an item that cannot be activated is not somewhere
   * to leave a keyboard user standing. */
  it('steps over a disabled item', () => {
    open((add) => {
      add('One', () => {});
      add('Two', () => {}, { disabled: true });
      add('Three', () => {});
    });
    press('ArrowDown');
    expect(document.activeElement.textContent).toBe('Three');
  });

  it('claims the arrow, so the page behind does not scroll', () => {
    open(four);
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    menu().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('leaves a key it has no use for alone', () => {
    open(four);
    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
    menu().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});

describe('dismissal', () => {
  it('Escape closes it and hands focus back', () => {
    open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  /* A menu can be opened inside a <dialog> shown with showModal(), and the
   * browser closes that dialog on Escape too. Without claiming the event the
   * first press took the whole sheet with it, which is not what somebody
   * dismissing a drop-down asked for. */
  it('Escape claims the press, so a dialog around it stays open', () => {
    // Both halves, because they fail differently: preventDefault stops the
    // browser's own handling of the key, and stopPropagation is what keeps the
    // press from reaching anything below - which, for a menu opened inside a
    // sheet, is the sheet's own Escape.
    const below = [];
    document.addEventListener('keydown', (event) => below.push(event.key));

    open();
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    // From inside the list, the way a press arrives when focus is in the menu.
    items()[0].dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(below, 'nothing underneath ever saw it').toEqual([]);
    expect(menu()).toBeNull();
  });

  /* The other half of the same rule: nothing is listening while nothing is
   * open, so with no menu up Escape is the page's again - which is how the
   * dialog is closed. Two of the three products attached at module scope, so a
   * page with no menu on it ran a handler on every press. */
  it('lets Escape through once nothing is open', () => {
    open();
    closeMenus();
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented, 'the listener went with the menu').toBe(false);
  });

  it('a press elsewhere on the page closes it', () => {
    const elsewhere = document.createElement('p');
    document.body.appendChild(elsewhere);
    open();
    elsewhere.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(menu()).toBeNull();
  });

  /* The press listener asks about the anchor rather than the menu, because the
   * trigger is in the anchor too and its own handler has to be what decides
   * what a second press means. */
  it('a press on the trigger is left to the trigger', () => {
    open();
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(menu(), 'not closed out from under the second-press rule').not.toBeNull();
  });

  it('a press outside does not drag focus away from wherever it landed', () => {
    const field = document.createElement('input');
    document.body.appendChild(field);
    open();
    field.focus();
    field.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(menu()).toBeNull();
    expect(document.activeElement, 'focus stays where the click put it').toBe(field);
  });

  it('closeMenus() with nothing open is safe', () => {
    expect(() => closeMenus()).not.toThrow();
  });

  it('clears aria-expanded on every trigger it finds', () => {
    open();
    closeMenus();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
