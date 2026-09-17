import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Sheet from '../svelte/Sheet.svelte';
import { openSheet } from '../svelte/sheet.js';
import Line from './fixtures/Line.svelte';
import { drawnClasses, emittedClasses } from '../docs/lib/css.js';
import { props } from './props.svelte.js';

/* The one dialog idiom, both openings. conventions.md §6.1.
 *
 * happy-dom implements show/showModal/close and fires `close`, which is why
 * this package chose it over jsdom in the first place and why the open and
 * close paths below can be asserted rather than inferred.
 *
 * What is worth pinning here is everything the six hand-written copies
 * disagreed about — the ✕'s tier, the heading element, where the accessible
 * name comes from, where `class` lands — plus the three seams §6.1 had to
 * invent because a product is reaching past the frame to get them today.
 */

let app;
let given;
const sheet = () => document.body.querySelector('dialog');

afterEach(() => {
  if (app) unmount(app);
  app = undefined;
  document.body.innerHTML = '';
});

const render = (initial) => {
  given = props({ closeLabel: 'Schließen', ...initial });
  app = mount(Sheet, { target: document.body, props: given });
  flushSync();
  return sheet();
};

describe('Sheet', () => {
  it('draws the sheet, the head with its heading and ✕, and the body', () => {
    const node = render({ open: true, title: 'Einstellungen' });
    expect(node.className).toBe('sheet');
    expect(node.getAttribute('aria-label')).toBe('Einstellungen');
    expect(node.querySelector('.head > h2').textContent).toBe('Einstellungen');
    expect(node.querySelector('.body')).not.toBe(null);
  });

  it('draws the ✕ as .btn.icon, which is what the frame has always emitted', () => {
    /* All six hand-written sheets use `.btn.quiet.icon` and three name it as
       the reason they could not adopt the frame. Converging the other way
       would move every sheet in the family that already goes through
       openDialog, and those are not the copies being replaced. */
    const close = render({ open: true, title: 'x' }).querySelector('.head button');
    expect([...close.classList]).toEqual(['btn', 'icon']);
    expect(close.getAttribute('aria-label')).toBe('Schließen');
    expect(close.hasAttribute('title')).toBe(false);
    expect(close.textContent).toBe('✕');
  });

  it('emits nothing components.css does not draw', () => {
    const drawn = drawnClasses();
    const node = render({ open: true, title: 'x', panels: true });
    expect([...emittedClasses(node)].filter((name) => !drawn.has(name))).toEqual([]);
  });

  it('draws no .foot unless a foot is given', () => {
    expect(render({ open: true, title: 'x' }).querySelector('.foot')).toBe(null);
  });

  it('takes an id, because #legal is 520px by an id selector', () => {
    expect(render({ open: true, title: 'x', id: 'legal' }).id).toBe('legal');
  });

  it('takes an id for the ✕ and one for the body, so a suite need not reach past it', () => {
    /* mitreden locates #infoclose, #setupclose and #colvoiceclose and reads
       #infobody; vorlaut clicks #voiceClose in fourteen places across six spec
       files. Without these a product writes them onto the frame's own elements
       after the fact, which works and is still a reach past the component —
       mitreden did exactly that on 2026-09-17 and said so. */
    const node = render({ open: true, title: 'x', closeId: 'infoclose', bodyId: 'infobody' });
    expect(node.querySelector('.head > button').id).toBe('infoclose');
    expect(node.querySelector('.body').id).toBe('infobody');
  });

  it('leaves both off when they are not given, rather than writing an empty one', () => {
    const node = render({ open: true, title: 'x' });
    expect(node.querySelector('.head > button').hasAttribute('id')).toBe(false);
    expect(node.querySelector('.body').hasAttribute('id')).toBe(false);
  });

  it('puts panels, wide and the caller\'s class on the dialog itself', () => {
    // Not on a wrapper: six of vorlaut's rules are direct-child selectors.
    const node = render({ open: true, title: 'x', panels: true, wide: true, class: 'sheet--page' });
    expect(node.getAttribute('class')).toBe('sheet panels wide sheet--page');
  });

  it('re-reads a thunked title, in the heading and in the accessible name', () => {
    /* wochenwerk renames the dialog as its title field is typed into, and five
       of its e2e cases find the dialog by its *current* name. Today that works
       only by reaching past the frame with setAttribute. */
    let name = 'Termin';
    const node = render({ open: true, title: () => name });
    expect(node.getAttribute('aria-label')).toBe('Termin');
    name = 'Zahnarzt';
    given.title = () => name;
    flushSync();
    expect(node.getAttribute('aria-label')).toBe('Zahnarzt');
    expect(node.querySelector('h2').textContent).toBe('Zahnarzt');
  });

  it('shows and hides from the prop', () => {
    const node = render({ open: false, title: 'x' });
    expect(node.open).toBe(false);
    given.open = true;
    flushSync();
    expect(node.open).toBe(true);
    given.open = false;
    flushSync();
    expect(node.open).toBe(false);
  });

  it('writes open back and calls onclose, however it closed', () => {
    const onclose = vi.fn();
    const node = render({ open: true, title: 'x', onclose });
    node.querySelector('.head button').click();
    flushSync();
    expect(node.open).toBe(false);
    expect(given.open).toBe(false);
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('supports the one-way form, for the caller holding a Page | null', () => {
    /* Two of mitreden's three sheets hold a `Page | null` and a `string | null`
       rather than a boolean, and `bind:` cannot take a `$derived`, so they pass
       `open={x !== null} onclose={() => x = null}`. Neither form is blessed. */
    let page = 'lang';
    const onclose = vi.fn(() => { page = null; });
    const node = render({ open: page !== null, title: 'x', onclose });
    node.close();
    flushSync();
    expect(page).toBe(null);
    expect(onclose).toHaveBeenCalledOnce();
  });
});

describe('openSheet', () => {
  let handle;

  afterEach(() => {
    handle?.close();
    handle = undefined;
    document.body.innerHTML = '';
  });

  const dialog = () => document.body.querySelector('dialog');

  it('opens, and the handle is complete before it is returned', () => {
    handle = openSheet({ title: 'Wortart', closeLabel: 'Zu', state: 'Nomen', body: Line });
    expect(handle.dialog).toBe(dialog());
    expect(handle.dialog.open).toBe(true);
    expect(handle.body).toBe(dialog().querySelector('.body'));
  });

  it('hands the state and the handle to the body component', () => {
    handle = openSheet({ title: 'x', closeLabel: 'Zu', state: 'Nomen', body: Line });
    expect(handle.body.querySelector('.said').textContent).toBe('Nomen');
  });

  it('draws the same markup as the declarative form', () => {
    handle = openSheet({
      title: 'x', closeLabel: 'Zu', state: 's', body: Line, panels: true, id: 'parts',
    });
    const node = handle.dialog;
    expect(node.id).toBe('parts');
    expect(node.getAttribute('class')).toBe('sheet panels');
    expect([...node.querySelector('.head button').classList]).toEqual(['btn', 'icon']);
    expect(node.querySelector('.head > h2').textContent).toBe('x');
  });

  it('replaces the h2 with the head component rather than hiding it', () => {
    handle = openSheet({ title: 'x', closeLabel: 'Zu', state: 'oben', body: Line, head: Line });
    const head = handle.dialog.querySelector('.head');
    expect(head.querySelector('h2')).toBe(null);
    expect(head.querySelector('.said').textContent).toBe('oben');
  });

  it('draws the .foot only with a foot, and never otherwise', () => {
    handle = openSheet({ title: 'x', closeLabel: 'Zu', state: 'unten', body: Line });
    expect(handle.dialog.querySelector('.foot')).toBe(null);
    handle.close();
    handle = openSheet({ title: 'x', closeLabel: 'Zu', state: 'unten', body: Line, foot: Line });
    expect(handle.dialog.querySelector('.foot .said').textContent).toBe('unten');
  });

  it('is closed by the handle it gave its own content', async () => {
    const onClose = vi.fn();
    handle = openSheet({ title: 'x', closeLabel: 'Zu', state: 's', body: Line, onClose });
    handle.body.querySelector('button').click();
    flushSync();
    expect(onClose).toHaveBeenCalledOnce();
    // Off the page again, like openDialog's — one exit for every way out.
    await Promise.resolve();
    expect(document.body.querySelector('dialog')).toBe(null);
    handle = undefined;
  });

  it('calls onClose once, whichever way out was taken', async () => {
    const onClose = vi.fn();
    handle = openSheet({ title: 'x', closeLabel: 'Zu', state: 's', body: Line, onClose });
    handle.dialog.querySelector('.head button').click();
    flushSync();
    handle.close();
    flushSync();
    expect(onClose).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    handle = undefined;
  });

  it('returns a handle and never a promise', () => {
    // §3.4: a caller that wants an answer settles its own promise from the
    // foot's presses with a `settled` guard. A promise resolved from `close`
    // alone hangs forever on a host that closes without firing it.
    handle = openSheet({ title: 'x', closeLabel: 'Zu', state: 's', body: Line });
    expect(handle).not.toBeInstanceOf(Promise);
    expect(typeof handle.close).toBe('function');
  });
});
