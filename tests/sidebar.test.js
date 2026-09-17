import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Sidebar from '../svelte/Sidebar.svelte';
import Scrim from '../svelte/Scrim.svelte';
import Reveal from '../svelte/Reveal.svelte';
import TopBar from '../svelte/TopBar.svelte';
import Shell from './fixtures/Shell.svelte';
import { NARROW } from '../svelte/sidebar.js';
import { props } from './props.svelte.js';

/* The sidebar and its three satellites. conventions.md §6.3.
 *
 * Three consumers, not four, and what they disagreed about is what most of
 * these cases are: which element the column is, who owns the collapse control,
 * whether the scrim is focusable, and what the remembered collapse means on a
 * phone. The two that would fail silently rather than loudly are the scrim's
 * border — mitreden's rule has none, and a <button> at inset:0 draws the user
 * agent's two-pixel frame around the whole viewport, which no test that clicks
 * a position can see — and the breakpoint being live rather than read once.
 *
 * happy-dom answers matchMedia against a fixed viewport, so the breakpoint is
 * stubbed here: the thing under test is a subscription, and a stub is the only
 * way to move it while something is mounted.
 */

let app;
let given;
let media;

/** A matchMedia that can be moved, and that says who asked. */
function stubMedia(matches) {
  const listeners = new Set();
  const query = {
    matches,
    media: NARROW,
    addEventListener: (_, fn) => listeners.add(fn),
    removeEventListener: (_, fn) => listeners.delete(fn),
  };
  media = {
    query,
    asked: [],
    move(now) {
      query.matches = now;
      for (const fn of [...listeners]) fn(query);
      flushSync();
    },
    get listening() {
      return listeners.size;
    },
  };
  window.matchMedia = (text) => {
    media.asked.push(text);
    return query;
  };
}

beforeEach(() => {
  stubMedia(false);
});

afterEach(() => {
  if (app) unmount(app);
  app = undefined;
  document.body.innerHTML = '';
});

/** The class tokens a node carries, without Svelte's scoping hash — which is
 *  on every element of a component that styles itself, and which `./css`'s
 *  `emittedClasses` skips for the same reason. */
const classes = (node) => [...node.classList].filter((name) => !/^svelte-[0-9a-z]+$/.test(name));

/* The style blocks are compiled into a separate module rather than injected
   into this document, so the scoped rules are asserted against the shipped
   source. That is also the claim worth holding: these four declarations are in
   the file a product installs, and cannot be left out of an adoption. */
const SVELTE = join(dirname(fileURLToPath(import.meta.url)), '..', 'svelte');
const styleOf = (name) => {
  const file = readFileSync(join(SVELTE, `${name}.svelte`), 'utf8');
  return /<style>([\s\S]*)<\/style>/.exec(file)[1];
};

const render = (Component, initial) => {
  given = props(initial);
  app = mount(Component, { target: document.body, props: given });
  flushSync();
  return document.body.firstElementChild;
};

describe('Sidebar', () => {
  it('is an <aside>, because one product locates it by role', () => {
    /* bildhaft's e2e does getByRole('complementary'), which is the kind of
       locator that fails as a timeout rather than as a diff. */
    const node = render(Sidebar, { closeLabel: 'Schließen' });
    expect(node.tagName).toBe('ASIDE');
    expect(classes(node)).toEqual(['sidebar']);
  });

  it('takes an id and an accessible name', () => {
    const node = render(Sidebar, { id: 'sidebar', label: 'Sammlungen', closeLabel: 'Zu' });
    expect(node.id).toBe('sidebar');
    expect(node.getAttribute('aria-label')).toBe('Sammlungen');
  });

  it('marks the drawer open with the class two products already switch on', () => {
    const node = render(Sidebar, { closeLabel: 'Zu', drawer: true });
    expect(classes(node)).toEqual(['sidebar', 'open']);
    given.drawer = false;
    flushSync();
    expect(classes(node)).toEqual(['sidebar']);
  });

  it('draws the brand row, the search, the sections and the foot in that order', () => {
    /* The order is the seam. `search` is rendered bare — the two products that
       have one wrap it in their own name, `.rail__part` and `.sidebar__section`
       — and what the separate snippet buys is that the field sits above
       whatever a search replaces rather than being swapped out with it. */
    const node = render(Sidebar, { closeLabel: 'Zu' });
    // Snippets cannot be written from a plain object, so this case asserts the
    // frame the snippets land in; the sections case below does the seam.
    expect([...node.children].map(classes)).toEqual([['sidebar__brand']]);
  });

  it('draws no foot region where there is no foot', () => {
    const node = render(Sidebar, { closeLabel: 'Zu' });
    expect(node.querySelector('.sidebar__foot')).toBeNull();
  });

  describe('the drawer’s ✕', () => {
    it('is not drawn while the sidebar is a column', () => {
      /* Which is what all three stylesheets already say, by id:
         @media (min-width:821px) { #railclose { display: none } }. A control
         that is not on screen is better absent than hidden. */
      const node = render(Sidebar, { closeLabel: 'Zu' });
      expect(node.querySelector('button')).toBeNull();
    });

    it('is drawn below the breakpoint, with its label, its id and the quiet tier', () => {
      stubMedia(true);
      const node = render(Sidebar, { closeLabel: 'Sammlungen zu', closeId: 'railclose' });
      const close = node.querySelector('button');
      expect(close.id).toBe('railclose');
      expect(close.getAttribute('aria-label')).toBe('Sammlungen zu');
      expect(close.textContent).toBe('✕');
      expect(classes(close)).toEqual(['btn', 'quiet', 'icon']);
      expect(close.type).toBe('button');
    });

    it('appears when the window becomes narrow, without a remount', () => {
      const node = render(Sidebar, { closeLabel: 'Zu' });
      expect(node.querySelector('button')).toBeNull();
      media.move(true);
      expect(node.querySelector('button')).not.toBeNull();
    });

    it('dismisses', () => {
      stubMedia(true);
      let dismissed = 0;
      const node = render(Sidebar, { closeLabel: 'Zu', ondismiss: () => { dismissed += 1; } });
      node.querySelector('button').click();
      expect(dismissed).toBe(1);
    });
  });

  describe('Escape, and the focus round trip', () => {
    /* §6.3 promised both and the first build shipped neither. mitreden adopted
       the component, found them missing and declined to write a product-local
       copy — which was right: a copy in one of three products is the divergence
       this extraction exists to end. These four cases are what the entry
       claimed all along. */

    it('dismisses on Escape while the drawer is up', () => {
      stubMedia(true);
      let asked = 0;
      render(Sidebar, { closeLabel: 'Zu', drawer: true, ondismiss: () => { asked += 1; } });
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      flushSync();
      expect(asked).toBe(1);
    });

    it('leaves Escape alone while it is a column', () => {
      /* Up there the column is furniture, and Escape belongs to whatever the
         person is actually working in — a sheet, a menu. Stealing it would be
         worse than not having it. */
      stubMedia(false);
      let asked = 0;
      render(Sidebar, { closeLabel: 'Zu', drawer: true, ondismiss: () => { asked += 1; } });
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      flushSync();
      expect(asked).toBe(0);
    });

    it('takes focus to the way out when the drawer opens', () => {
      /* The ✕ rather than the first row: it is the way out, which is what
         somebody just handed a layer needs to find, and Tab reaches the list
         from there in one press. */
      stubMedia(true);
      const node = render(Sidebar, { closeLabel: 'Zu', drawer: false });
      given.drawer = true;
      flushSync();
      expect(document.activeElement).toBe(node.querySelector('button'));
    });

    it('gives focus back to whatever opened it', () => {
      stubMedia(true);
      const opener = document.createElement('button');
      document.body.append(opener);
      opener.focus();
      render(Sidebar, { closeLabel: 'Zu', drawer: false });
      given.drawer = true;
      flushSync();
      expect(document.activeElement).not.toBe(opener);
      given.drawer = false;
      flushSync();
      expect(document.activeElement).toBe(opener);
      opener.remove();
    });
  });

  describe('the breakpoint', () => {
    it('subscribes to 820px, and to the one string the package exports', () => {
      render(Sidebar, { closeLabel: 'Zu' });
      expect(media.asked).toEqual(['(max-width: 820px)']);
      expect(NARROW).toBe('(max-width: 820px)');
    });

    it('unsubscribes when the sidebar goes', () => {
      render(Sidebar, { closeLabel: 'Zu' });
      expect(media.listening).toBe(1);
      unmount(app);
      app = undefined;
      flushSync();
      expect(media.listening).toBe(0);
    });

    it('reports the column showing when it is not collapsed', () => {
      render(Sidebar, { closeLabel: 'Zu', collapsed: false, showing: false });
      expect(given.showing).toBe(true);
      given.collapsed = true;
      flushSync();
      expect(given.showing).toBe(false);
    });

    it('ignores the remembered collapse below the breakpoint rather than consulting it', () => {
      /* §6.3, and the live bug it prevents: the collapsed state is remembered
         across visits, so a sidebar put away on a laptop would otherwise
         arrive on a phone as a drawer that cannot be opened. Down here the
         only question is whether the drawer is up. */
      stubMedia(true);
      render(Sidebar, { closeLabel: 'Zu', collapsed: true, drawer: true, showing: false });
      expect(given.showing).toBe(true);
      given.drawer = false;
      flushSync();
      expect(given.showing).toBe(false);
    });

    it('answers the other question again the moment the window widens', () => {
      stubMedia(true);
      render(Sidebar, { closeLabel: 'Zu', collapsed: true, drawer: true, showing: false });
      expect(given.showing).toBe(true);
      media.move(false);
      expect(given.showing).toBe(false);
    });
  });
});

describe('Scrim', () => {
  it('is a focusable button with a name, not a div', () => {
    /* The argument is consistency rather than necessity — §6.3 corrects its
       own first draft on that — but one of the three has to move, and a
       control a keyboard can reach is the one that moves fewest things. */
    const node = render(Scrim, { label: 'Menü schließen', shown: true });
    expect(node.tagName).toBe('BUTTON');
    expect(node.type).toBe('button');
    expect(node.getAttribute('aria-label')).toBe('Menü schließen');
    expect(classes(node)).toEqual(['scrim']);
  });

  it('resets the user agent’s border, which is the cost of it being a button', () => {
    /* Found by inspection, and no test in any of the three products would
       catch it: mitreden's .scrim rule has no border declaration, and with
       box-sizing: border-box a <button> picks up `border: 2px outset
       ButtonBorder` — a frame around the whole viewport. The one test that
       exists over there clicks a position, and a position inside a two-pixel
       border is still inside the scrim. */
    expect(styleOf('Scrim')).toMatch(/\.scrim\s*\{[^}]*border:\s*0/);
  });

  it('restores [hidden], which loses to any .scrim rule a product has', () => {
    /* vorlaut's stylesheet carries the comment about this element and the
       reveal beside it. The scoped rule carries the hash and cannot lose. */
    expect(styleOf('Scrim')).toMatch(/\.scrim\[hidden\]\s*\{[^}]*display:\s*none/);
  });

  it('is hidden while the drawer is down and not while it is up', () => {
    const node = render(Scrim, { label: 'Zu', shown: false });
    expect(node.hasAttribute('hidden')).toBe(true);
    given.shown = true;
    flushSync();
    expect(node.hasAttribute('hidden')).toBe(false);
  });

  it('dismisses when pressed', () => {
    let dismissed = 0;
    const node = render(Scrim, { label: 'Zu', shown: true, ondismiss: () => { dismissed += 1; } });
    node.click();
    expect(dismissed).toBe(1);
  });

  it('takes an id, because two products name it in a stylesheet', () => {
    expect(render(Scrim, { id: 'scrim', label: 'Zu' }).id).toBe('scrim');
  });
});

describe('Reveal', () => {
  it('is a container and draws no control of its own', () => {
    /* bildhaft's is a flex container holding two children, the ☰ and a small
       logo, and the other two are the same shape. So the pair inside is the
       product's, and what is shared is the corner it floats in. */
    const node = render(Reveal, { id: 'reveal', shown: true });
    expect(node.tagName).toBe('DIV');
    expect(classes(node)).toEqual(['reveal']);
    expect(node.id).toBe('reveal');
    expect(node.children).toHaveLength(0);
  });

  it('is hidden while the column is there', () => {
    const node = render(Reveal, { shown: false });
    expect(node.hasAttribute('hidden')).toBe(true);
    given.shown = true;
    flushSync();
    expect(node.hasAttribute('hidden')).toBe(false);
  });

  it('carries the [hidden] restoration and drops itself below the breakpoint', () => {
    /* Both rules have to be in the component: a scoped `.reveal { display:
       flex }` is 0-2-0 and out-specifies a product's `@media { .reveal {
       display: none } }` at 0-1-0, which is §6.0's caveat pointing the way
       round people expect least. */
    const css = styleOf('Reveal');
    expect(css).toMatch(/\.reveal\[hidden\]\s*\{[^}]*display:\s*none/);
    expect(css).toMatch(/@media\s*\(max-width:\s*820px\)\s*\{\s*\.reveal\s*\{[^}]*display:\s*none/);
  });
});

describe('TopBar', () => {
  it('is a <header> with the ☰ first', () => {
    const node = render(TopBar, { label: 'Sammlungen zeigen' });
    expect(node.tagName).toBe('HEADER');
    expect(classes(node)).toEqual(['topbar']);
    const button = node.firstElementChild;
    expect(button.tagName).toBe('BUTTON');
    expect(button.textContent).toBe('☰');
    expect(classes(button)).toEqual(['btn', 'quiet', 'icon']);
  });

  it('names the control, takes its id, and takes a tooltip where a product has one', () => {
    const node = render(TopBar, {
      buttonId: 'railopen',
      label: 'Sammlungen zeigen',
      title: 'Sammlungen zeigen',
    });
    const button = node.querySelector('button');
    expect(button.id).toBe('railopen');
    expect(button.getAttribute('aria-label')).toBe('Sammlungen zeigen');
    expect(button.getAttribute('title')).toBe('Sammlungen zeigen');
  });

  it('draws no title attribute for the product that has only a label', () => {
    expect(render(TopBar, { label: 'Menü' }).querySelector('button').hasAttribute('title'))
      .toBe(false);
  });

  it('reveals when pressed', () => {
    let revealed = 0;
    const node = render(TopBar, { label: 'Menü', onreveal: () => { revealed += 1; } });
    node.querySelector('button').click();
    expect(revealed).toBe(1);
  });

  it('owns the breakpoint, for the reason a product cannot', () => {
    const css = styleOf('TopBar');
    expect(css).toMatch(/\.topbar\s*\{[^}]*display:\s*none/);
    expect(css).toMatch(/@media\s*\(max-width:\s*820px\)\s*\{\s*\.topbar\s*\{[^}]*display:\s*flex/);
  });

  describe('the wiring', () => {
    /* The half of a toggle control a product cannot work out for itself,
       because it is about an element inside the component. */
    it('points aria-controls at the sidebar and says what it is doing', () => {
      const node = render(TopBar, { label: 'Menü', controls: 'rail', expanded: false });
      const button = node.querySelector('button');
      expect(button.getAttribute('aria-controls')).toBe('rail');
      expect(button.getAttribute('aria-expanded')).toBe('false');
    });

    it('writes "false" rather than dropping the attribute', () => {
      /* §6.0: Svelte's set_attribute removes only on null, so a boolean
         expression is safe and is the one form — absent and "false" are
         semantically different and a toggle has to say which. */
      const node = render(TopBar, { label: 'Menü', controls: 'rail' });
      expect(node.querySelector('button').hasAttribute('aria-expanded')).toBe(true);
      given.expanded = true;
      flushSync();
      expect(node.querySelector('button').getAttribute('aria-expanded')).toBe('true');
    });
  });
});

describe('a page built out of the four', () => {
  /* The seams §6.3 argues hardest about are snippets, and a snippet cannot be
     written from a plain props object — so this mounts a product's page. */

  const shell = (initial) => {
    given = props(initial ?? {});
    app = mount(Shell, { target: document.body, props: given });
    flushSync();
    return document.querySelector('aside');
  };

  it('puts the product’s markup where the product put it', () => {
    const aside = shell();
    expect([...aside.children].map(classes)).toEqual([
      ['sidebar__brand'],
      ['sidebar__part'],
      ['sidebar__section', 'sidebar__section--collections'],
      ['sidebar__foot'],
    ]);
  });

  it('draws no heading and no section wrapper of its own', () => {
    /* bildhaft is why: the <h2> is part of what a search swaps — Sammlungen
       becomes n Treffer — and a component-owned wrapper around the first
       section leaves an empty section and a 20px gap while searching. It also
       keeps .sidebar__section--words / --collections, which have no CSS rule
       at all and exist purely so ten e2e selectors can tell two lists apart. */
    const aside = shell();
    expect(aside.querySelector('h2').textContent).toBe('Sammlungen');
    given.searching = true;
    flushSync();
    expect(aside.querySelector('h2').textContent).toBe('2 Treffer');
    expect(aside.querySelectorAll('.sidebar__section')).toHaveLength(1);
  });

  it('leaves the collapse control to the product, inside its brand row', () => {
    /* In bildhaft it is the third flex child of the brand row, so a
       component-owned chevron and a product-owned brand cannot both be true. */
    const brand = shell().querySelector('.sidebar__brand');
    expect([...brand.children].map((child) => child.id)).toEqual(['', 'sidebarHide']);
    expect(brand.querySelector('#sidebarHide').textContent).toBe('‹');
  });

  it('hands that control the wiring, which is the half a product cannot know', () => {
    const collapse = shell().querySelector('#sidebarHide');
    expect(collapse.getAttribute('aria-controls')).toBe('sidebar');
    expect(collapse.getAttribute('aria-expanded')).toBe('true');
  });

  it('says the same thing on the reveal’s control and the bar’s', () => {
    shell({ collapsed: true });
    expect(document.querySelector('#sidebarShowBtn').getAttribute('aria-controls')).toBe('sidebar');
    expect(document.querySelector('#sidebarShowBtn').getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('#sidebarOpenBtn').getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('#reveal').hasAttribute('hidden')).toBe(false);
  });

  it('hands the whole page one answer about what is on screen', () => {
    /* `showing` is the one thing the live breakpoint has already been applied
       to, and the reveal and the bar are mounted where they cannot see it. */
    shell({ collapsed: false });
    expect(document.querySelector('#reveal').hasAttribute('hidden')).toBe(true);
    given.collapsed = true;
    flushSync();
    expect(document.querySelector('#reveal').hasAttribute('hidden')).toBe(false);
    expect(document.querySelector('#sidebarHide').getAttribute('aria-expanded')).toBe('false');
  });

  it('turns the same page round when the window narrows', () => {
    shell({ collapsed: true, drawer: true });
    expect(document.querySelector('#reveal').hasAttribute('hidden')).toBe(false);
    media.move(true);
    // The remembered collapse is ignored down here, not consulted: the drawer
    // is up, so the column is showing and the ✕ is the way out of it.
    expect(document.querySelector('#sidebarOpenBtn').getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('#sidebarClose')).not.toBeNull();
  });
});
