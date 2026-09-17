import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Overflow from '../svelte/Overflow.svelte';
import Dropdown from '../svelte/Dropdown.svelte';
import { fit } from '../svelte/fit.js';
import { closeMenus } from '../docs/lib/menu.js';
import { drawnClasses, emittedClasses } from '../docs/lib/css.js';
import { props } from './props.svelte.js';

/* The ⋯ and the labelled picker. conventions.md §6.10.
 *
 * Eleven call sites and seven class strings, promoted to bildhaft's shape.
 * Three things are worth pinning: the ARIA is there before the first press,
 * the component does not anchor itself where a host already has, and the
 * collision handling that came from vorlaut actually runs.
 */

let app;

afterEach(() => {
  closeMenus();
  if (app) unmount(app);
  app = undefined;
  document.body.innerHTML = '';
});

const render = (Component, initial) => {
  app = mount(Component, { target: document.body, props: props(initial) });
  flushSync();
  return document.body.firstElementChild;
};

const items = () => [...document.querySelectorAll('.menu button')].map((b) => b.textContent);

describe('Overflow', () => {
  const three = (add) => {
    add('Exportieren', () => {});
    add('Symbolquelle', () => {});
    add('Löschen', () => {}, { danger: true });
  };

  it('draws its own anchor and a .btn.quiet.icon trigger', () => {
    const node = render(Overflow, { label: 'Mehr', build: three });
    expect([...node.classList]).toEqual(['menu-anchor']);
    const button = node.querySelector('button');
    expect([...button.classList]).toEqual(['btn', 'quiet', 'icon']);
    expect(button.textContent).toBe('⋯');
  });

  it('says it opens a menu before it has opened one', () => {
    /* menuOn setting this on first open leaves wochenwerk's two triggers
       correct only after the first press, and a trigger that does not say it
       opens a menu until it has opened one is one nobody was told about. */
    const button = render(Overflow, { label: 'Mehr', build: three }).querySelector('button');
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Mehr');
    expect(button.title).toBe('Mehr');
  });

  it('emits nothing components.css does not draw', () => {
    const drawn = drawnClasses();
    const node = render(Overflow, { label: 'Mehr', build: three });
    node.querySelector('button').click();
    flushSync();
    expect([...emittedClasses(node)].filter((name) => !drawn.has(name))).toEqual([]);
  });

  it('opens the menu, and a second press dismisses it', () => {
    const button = render(Overflow, { label: 'Mehr', build: three }).querySelector('button');
    button.click();
    expect(items()).toEqual(['Exportieren', 'Symbolquelle', 'Löschen']);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    button.click();
    expect(document.querySelector('.menu')).toBe(null);
  });

  it('draws no anchor of its own where the host supplies one', () => {
    /* wochenwerk's Row provides the `.menu-anchor`, and a component that
       anchored itself anyway would nest two — a position: relative inside a
       position: relative, and the list hung off the wrong one. */
    const node = render(Overflow, { label: 'Mehr', build: three, anchor: false });
    expect(node.tagName).toBe('BUTTON');
    expect(document.querySelector('.menu-anchor')).toBe(null);
  });

  it('finds the host\'s anchor anyway, so the list is still positioned', () => {
    const host = document.createElement('div');
    host.className = 'menu-anchor';
    document.body.appendChild(host);
    app = mount(Overflow, { target: host, props: props({ label: 'Mehr', build: three, anchor: false }) });
    flushSync();
    host.querySelector('button').click();
    expect(host.querySelector('.menu')).not.toBe(null);
  });

  it('takes a glyph of its own', () => {
    const node = render(Overflow, { label: 'Mehr', build: three, class: 'btn icon' });
    expect([...node.querySelector('button').classList]).toEqual(['btn', 'icon']);
  });
});

describe('Dropdown', () => {
  const two = (add) => {
    add('Wort', () => {}, { checked: true });
    add('Satz', () => {}, { checked: false });
  };

  it('draws a .btn.dropdown inside an anchor, saying what is chosen', () => {
    const node = render(Dropdown, { label: 'Wort', build: two });
    expect([...node.classList]).toEqual(['menu-anchor']);
    const button = node.querySelector('button');
    expect([...button.classList]).toEqual(['btn', 'dropdown']);
    expect(button.textContent).toBe('Wort');
  });

  it('composes onto .field in a column of questions', () => {
    // vorlaut's argued variant: the fields above and below are full width, and
    // a trigger as wide as its word leaves no left edge to follow down.
    const node = render(Dropdown, { label: 'Wort', build: two, field: true, start: true });
    expect([...node.classList]).toEqual(['menu-anchor', 'start']);
    expect([...node.querySelector('button').classList]).toEqual(['field', 'dropdown']);
  });

  it('is named by aria-labelledby and never by a wrapping label', () => {
    /* wochenwerk's call site wraps the trigger in a <label>, which does not
       label a <button> — so getByLabel finds nothing there today. */
    const node = render(Dropdown, { label: 'Wort', build: two, id: 'p-kind', labelledBy: 'kindq' });
    const button = node.querySelector('button');
    expect(button.id).toBe('p-kind');
    expect(button.getAttribute('aria-labelledby')).toBe('kindq');
  });

  it('takes aria-label where there is no element to point at', () => {
    const button = render(Dropdown, { label: 'Wort', build: two, ariaLabel: 'Wortart' })
      .querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Wortart');
    expect(button.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('emits nothing components.css does not draw', () => {
    const drawn = drawnClasses();
    const node = render(Dropdown, { label: 'Wort', build: two, field: true, start: true });
    node.querySelector('button').click();
    flushSync();
    expect([...emittedClasses(node)].filter((name) => !drawn.has(name))).toEqual([]);
  });

  it('opens a set of alternatives', () => {
    render(Dropdown, { label: 'Wort', build: two }).querySelector('button').click();
    const rows = [...document.querySelectorAll('.menu button')];
    expect(rows.map((r) => r.getAttribute('role'))).toEqual(['menuitemradio', 'menuitemradio']);
    expect(rows.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false']);
  });
});

describe('fit', () => {
  /* happy-dom answers zeroes for getBoundingClientRect and offsetHeight, so
     the rectangles are stubbed. What is under test is a comparison between
     rectangles, and a zero-sized one would make every answer the same. */
  const box = (top, bottom) => ({
    getBoundingClientRect: () => new DOMRect(0, top, 300, bottom - top),
  });

  const scene = ({ menuHeight, triggerTop, triggerBottom, bodyTop, bodyBottom }) => {
    document.body.innerHTML = '<div class="body"><span class="menu-anchor">'
      + '<button type="button">x</button></span></div>';
    const body = document.querySelector('.body');
    const anchor = document.querySelector('.menu-anchor');
    const button = document.querySelector('button');
    const menu = document.createElement('div');
    menu.className = 'menu';
    anchor.appendChild(menu);
    Object.assign(body, box(bodyTop, bodyBottom));
    Object.assign(button, box(triggerTop, triggerBottom));
    Object.defineProperty(menu, 'offsetHeight', { value: menuHeight, configurable: true });
    return { anchor, button, menu };
  };

  it('leaves the list downward where it fits below', () => {
    const { anchor, button, menu } = scene({
      menuHeight: 120, triggerTop: 100, triggerBottom: 130, bodyTop: 0, bodyBottom: 600,
    });
    fit(anchor, button);
    expect(anchor.classList.contains('menu-anchor--up')).toBe(false);
    expect(menu.style.maxHeight).toBe('458px');
  });

  it('flips upward where there is more room above', () => {
    // A menu near the foot of a sheet: vorlaut's eleven word classes.
    const { anchor, button, menu } = scene({
      menuHeight: 300, triggerTop: 500, triggerBottom: 530, bodyTop: 0, bodyBottom: 600,
    });
    fit(anchor, button);
    expect(anchor.classList.contains('menu-anchor--up')).toBe(true);
    expect(menu.style.maxHeight).toBe('488px');
  });

  it('never caps below a menu worth opening', () => {
    // Two rows and a scrollbar is still a menu; a cap small enough to show
    // nothing is worse than a list that overhangs.
    const { anchor, menu, button } = scene({
      menuHeight: 300, triggerTop: 560, triggerBottom: 580, bodyTop: 550, bodyBottom: 600,
    });
    fit(anchor, button);
    expect(menu.style.maxHeight).toBe('96px');
  });

  it('gives the cap the scroll it needs, rather than every menu one', () => {
    const { anchor, button, menu } = scene({
      menuHeight: 120, triggerTop: 100, triggerBottom: 130, bodyTop: 0, bodyBottom: 600,
    });
    fit(anchor, button);
    expect(menu.style.overflowY).toBe('auto');
    // Or scrolling to the end of the list carries on scrolling the sheet.
    expect(menu.style.overscrollBehavior).toBe('contain');
  });

  it('takes the flip back off when the press was a dismissal', () => {
    // menuOn has already closed the list, so there is nothing to place.
    document.body.innerHTML = '<span class="menu-anchor menu-anchor--up">'
      + '<button type="button">x</button></span>';
    const anchor = document.querySelector('.menu-anchor');
    fit(anchor, document.querySelector('button'));
    expect(anchor.classList.contains('menu-anchor--up')).toBe(false);
  });

  it('measures against the window where there is no sheet', () => {
    const { anchor, button, menu } = scene({
      menuHeight: 120, triggerTop: 100, triggerBottom: 130, bodyTop: 0, bodyBottom: 600,
    });
    anchor.closest('.body').className = 'elsewhere';
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(400);
    fit(anchor, button);
    expect(menu.style.maxHeight).toBe('258px');
    vi.restoreAllMocks();
  });
});
