import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TitleField from '../svelte/TitleField.svelte';
import { drawnClasses, emittedClasses } from '../docs/lib/css.js';
import { props } from './props.svelte.js';

/* The work head's name field. conventions.md §6.5.
 *
 * The timing is `@lautstark/design/rename`'s and is tested there. What is
 * pinned here is the three things each product had bolted on separately: the
 * live echo beside the debounced write, the caret arriving through one prop,
 * and `refresh()` rather than an assignment on every repaint.
 */

let app;
let given;
const field = () => document.body.querySelector('input');

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  if (app) unmount(app);
  app = undefined;
  document.body.innerHTML = '';
});

const render = (initial) => {
  given = props({ value: '', write: () => {}, ...initial });
  app = mount(TitleField, { target: document.body, props: given });
  flushSync();
  return field();
};

/* Bubbling, because Svelte delegates `input` to a listener on the root while
   `rename.js` binds straight to the element — so a non-bubbling event reaches
   the write and not the echo, which is half the thing under test. */
const type = (node, text) => {
  node.value = text;
  node.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('TitleField', () => {
  it('draws the field components.css already has a rule for', () => {
    const node = render({ value: 'Montag', id: 'colname', placeholder: 'Name', label: 'Name' });
    expect(node.tagName).toBe('INPUT');
    expect([...node.classList]).toEqual(['title-input']);
    expect(node.id).toBe('colname');
    expect(node.placeholder).toBe('Name');
    expect(node.getAttribute('aria-label')).toBe('Name');
    expect(node.autocomplete).toBe('off');
    expect([...emittedClasses(node)].filter((n) => !drawnClasses().has(n))).toEqual([]);
  });

  it('takes a class of its own, for a page head that is not a title-input', () => {
    expect([...render({ class: 'pagehead__name' }).classList]).toEqual(['pagehead__name']);
  });

  it('puts the stored name in the field', () => {
    expect(render({ value: 'Montag' }).value).toBe('Montag');
  });

  it('writes the typed name, debounced', () => {
    const write = vi.fn();
    const node = render({ value: 'Montag', write });
    type(node, 'Dienstag');
    expect(write).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(write).toHaveBeenCalledWith('Dienstag');
  });

  it('echoes every keystroke to the caller as well as writing one', () => {
    /* bildhaft echoes into the sidebar row and the top bar; vorlaut's page head
       assigns the model and repaints, because the two lists carrying the name
       are drawn from the layout. A component with only the debounced write
       moves those repaints to 400ms after typing stops. */
    const write = vi.fn();
    const oninput = vi.fn();
    const node = render({ value: '', write, oninput });
    type(node, 'M');
    type(node, 'Mo');
    type(node, 'Mon');
    expect(oninput).toHaveBeenCalledTimes(3);
    expect(write).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(write).toHaveBeenCalledTimes(1);
  });

  it('takes a delay of its own', () => {
    const write = vi.fn();
    type(render({ write, delay: 50 }), 'x');
    vi.advanceTimersByTime(50);
    expect(write).toHaveBeenCalledOnce();
  });

  it('does not put a repaint\'s name over what is being typed', () => {
    /* refresh() declines while a keystroke is waiting out its debounce — which
       a value comparison would not, because it would compare against the
       stored name and put it back. */
    const node = render({ value: 'Montag' });
    type(node, 'Diens');
    given.value = 'Montag';
    flushSync();
    expect(node.value).toBe('Diens');
  });

  it('follows the stored name when nothing is owed', () => {
    const node = render({ value: 'Montag' });
    given.value = 'Dienstag';
    flushSync();
    expect(node.value).toBe('Dienstag');
  });

  it('takes the caret when it is asked for, selected, and says so', () => {
    let asked = true;
    const answered = vi.fn(() => { asked = false; });
    const node = render({ value: 'Montag', caret: { asked: () => asked, answered } });
    expect(document.activeElement).toBe(node);
    expect(node.selectionStart).toBe(0);
    expect(node.selectionEnd).toBe('Montag'.length);
    expect(answered).toHaveBeenCalledOnce();
  });

  it('leaves the text alone where the invented name is a placeholder', () => {
    // vorlaut's page head: `select` false, because what is in it is a
    // suggestion rather than a name.
    let asked = true;
    const node = render({
      value: 'Seite 3', select: false, caret: { asked: () => asked, answered: () => { asked = false; } },
    });
    expect(document.activeElement).toBe(node);
    expect(node.selectionStart).toBe(node.selectionEnd);
  });

  it('does not take the caret unasked', () => {
    const node = render({ value: 'Montag', caret: { asked: () => false, answered: () => {} } });
    expect(document.activeElement).not.toBe(node);
  });

  it('flushes what is owed, and answers even when nothing is', async () => {
    const write = vi.fn();
    const node = render({ value: 'Montag', write });
    type(node, 'Dienstag');
    await app.flush();
    expect(write).toHaveBeenCalledWith('Dienstag');
    write.mockClear();
    await app.flush();
    expect(write).not.toHaveBeenCalled();
  });

  it('leaves Escape alone, which is a decision and not an omission', () => {
    /* No product handles it: it does not revert and it does not cancel a
       pending write. A component that quietly grew one would change three
       products' behaviour without any of them asking. */
    const write = vi.fn();
    const node = render({ value: 'Montag', write });
    type(node, 'Dienstag');
    node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    vi.advanceTimersByTime(400);
    expect(node.value).toBe('Dienstag');
    expect(write).toHaveBeenCalledWith('Dienstag');
  });
  it('carries the attributes a field carries, which is what Row needed', () => {
    /* bildhaft's sentence card could not adopt this component: its field has a
       `maxlength` and a `title`, and two e2e cases assert the title's text and
       its absence. With no rest props both would have been dropped in silence —
       the component would have looked adopted and quietly stopped carrying two
       attributes a suite was reading. §6 answers that: change the component. */
    const node = render({ value: '', write: () => {}, maxlength: 80, title: 'Getippt: „Hallo"' });
    expect(node.getAttribute('maxlength')).toBe('80');
    expect(node.getAttribute('title')).toBe('Getippt: „Hallo"');
  });

  it('keeps its own attributes out of the caller\'s reach', () => {
    /* The type excludes the eight the component owns, so a caller cannot take
       `class` or `aria-label` away from it by accident. This asserts the two
       that would be worst to lose. */
    const node = render({ value: '', write: () => {}, label: 'Name', class: 'row__title' });
    expect(node.getAttribute('aria-label')).toBe('Name');
    expect(node.className).toBe('row__title');
  });

});
