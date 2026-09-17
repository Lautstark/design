import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Panel from '../svelte/Panel.svelte';
import { drawnClasses, emittedClasses } from '../docs/lib/css.js';
import { props } from './props.svelte.js';

/* The folded panel. conventions.md §6.2.
 *
 * Two of these cases are the reason the component exists rather than a fourth
 * copy of the markup: the emitted vocabulary is the one components.css draws,
 * and `open` survives the browser folding the panel behind Svelte's back. The
 * second is the silent correctness bug §6.2 found in its own first draft, and
 * it needs the native accordion to reproduce, so the test builds one.
 */

let app;
let given;
const panel = () => document.body.querySelector('details');

afterEach(() => {
  if (app) unmount(app);
  app = undefined;
  document.body.innerHTML = '';
});

const render = (initial) => {
  given = props(initial);
  app = mount(Panel, { target: document.body, props: given });
  flushSync();
  return panel();
};

describe('Panel', () => {
  it('draws the details, the summary\'s two spans and the body', () => {
    const node = render({ section: 'Aussehen', state: 'Wie das System' });
    expect(node.className).toBe('panel');
    expect(node.getAttribute('name')).toBe('settings');
    const summary = node.querySelector('summary');
    expect(summary.querySelector('.section').textContent).toBe('Aussehen');
    expect(summary.querySelector('.state').textContent).toBe('Wie das System');
    expect(node.querySelector('.body')).not.toBe(null);
  });

  it('emits nothing components.css does not draw', () => {
    const drawn = drawnClasses();
    const node = render({ section: 'Aussehen', state: 'Hell', class: 'opt' });
    const missing = [...emittedClasses(node)].filter((name) => !drawn.has(name) && name !== 'opt');
    expect(missing).toEqual([]);
  });

  it('takes an id, and an id for the state span', () => {
    // mitreden masks its baselines by these two, and vorlaut's unit test reads
    // the markup as text and matches /id="(\w+Panel)"/.
    const node = render({ id: 'voicePanel', stateId: 'voicestate', section: 'Stimme' });
    expect(node.id).toBe('voicePanel');
    expect(node.querySelector('.state').id).toBe('voicestate');
  });

  it('appends the caller\'s class to .body rather than replacing it', () => {
    const node = render({ section: 'Sprache', class: 'setting' });
    expect([...node.querySelector('div').classList]).toEqual(['body', 'setting']);
  });

  it('leaves .body a bare class when no class is given', () => {
    const node = render({ section: 'Sprache' });
    expect(node.querySelector('div').getAttribute('class')).toBe('body');
  });

  it('draws an empty state span rather than none', () => {
    // `.panel > summary` is a two-column grid and the chevron is placed against
    // the second column. A missing span is a different layout, not a tidier one.
    const node = render({ section: 'Löschen' });
    expect(node.querySelector('.state').textContent).toBe('');
  });

  it('marks the current panel with aria-current, and omits it otherwise', () => {
    /* A token attribute, so "true" or absent — which is the opposite of
       aria-pressed, where components.css selects [aria-pressed="true"] and the
       absent form means something else. §6.0 draws that line. */
    const node = render({ section: 'Sprache', current: true });
    expect(node.querySelector('summary').getAttribute('aria-current')).toBe('true');
    given.current = false;
    flushSync();
    expect(node.querySelector('summary').hasAttribute('aria-current')).toBe(false);
  });

  it('takes its group, for the product with two exclusive columns', () => {
    expect(render({ section: 'Bilder', group: 'collection' }).getAttribute('name'))
      .toBe('collection');
  });

  it('arrives open when the caller says so', () => {
    expect(render({ section: 'Sprache', open: true }).open).toBe(true);
  });

  it('writes open back when the reader folds it', () => {
    const node = render({ section: 'Sprache', open: true });
    node.open = false;
    node.dispatchEvent(new Event('toggle'));
    flushSync();
    expect(given.open).toBe(false);
  });

  it('reopens after the native accordion has folded it behind Svelte\'s back', () => {
    /* The bug §6.2 found in its own first draft. `name=` is the platform's
       accordion: opening a sibling makes the browser remove this one's `open`
       attribute directly, and Svelte never sees it. With a one-way prop the
       caller still believes the panel is open, so setting it true again is a
       write that short-circuits, nothing reaches the DOM, and the sheet reopens
       with everything folded. */
    const node = render({ section: 'Sprache', open: true });

    // What the browser does to a panel whose sibling was opened.
    node.open = false;
    node.dispatchEvent(new Event('toggle'));
    flushSync();

    given.open = true;
    flushSync();
    expect(node.open).toBe(true);
  });
});
