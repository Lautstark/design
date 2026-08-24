import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renameField } from '../docs/lib/rename.js';

/* The work head's name field.
 *
 * Every case here is one of the three products' behaviour, and three of them
 * are failures those products had: a repaint typing over somebody, a blur that
 * re-armed the debounce instead of writing, and a blur that wrote every time
 * whether anything had changed or not. None of the three suites caught any of
 * them, because all three need a person typing while something else is in
 * flight - which is exactly what a fake clock and a stand-in DOM are for.
 */

let input;
let wrote;

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '';
  input = document.createElement('input');
  document.body.appendChild(input);
  wrote = [];
});

afterEach(() => {
  vi.useRealTimers();
});

/** Typing, as the field sees it: a value and an input event. */
const type = (text) => {
  input.focus();
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const bind = (opts) => renameField(input, (name) => { wrote.push(name); }, opts);

describe('while typing', () => {
  it('writes once, after the pause, with the last thing typed', () => {
    const field = bind({ delay: 400 });
    type('K'); type('Ki'); type('Kit');

    vi.advanceTimersByTime(399);
    expect(wrote, 'nothing is written mid-word').toEqual([]);
    vi.advanceTimersByTime(1);
    expect(wrote).toEqual(['Kit']);
    field.stop();
  });

  it('takes its own delay where one is given', () => {
    const field = bind({ delay: 50 });
    type('Küche');
    vi.advanceTimersByTime(50);
    expect(wrote).toEqual(['Küche']);
    field.stop();
  });

  it('waits 400ms where none is', () => {
    const field = bind();
    type('Küche');
    vi.advanceTimersByTime(399);
    expect(wrote).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(wrote).toEqual(['Küche']);
    field.stop();
  });
});

describe('on the way out', () => {
  /* mitreden's blur called the same scheduler as its input, so leaving the
   * field restarted the clock rather than stopping it. A name typed and
   * immediately clicked away from survived only if nothing navigated inside the
   * next beat - and clicking away from the title is usually navigating. */
  it('a blur writes rather than re-arming the clock', () => {
    const field = bind({ delay: 100000 });
    type('Küche');
    input.blur();

    expect(wrote, 'written on the way out, not scheduled again').toEqual(['Küche']);
    vi.advanceTimersByTime(100000);
    expect(wrote, 'and not written a second time when the old timer would have run')
      .toEqual(['Küche']);
    field.stop();
  });

  /* bildhaft's blur wrote unconditionally, so tabbing through the work head
   * saved the same name again each time. Harmless in a database; in vorlaut
   * every write is a touch that reorders the sidebar and announces to a
   * standing backup. */
  it('a blur on a field nobody changed writes nothing', () => {
    input.value = 'Küche';
    const field = bind({ delay: 400 });
    input.focus();
    input.blur();
    input.focus();
    input.blur();

    expect(wrote).toEqual([]);
    field.stop();
  });

  it('Enter leaves the field, and leaving is what writes', () => {
    const field = bind({ delay: 100000 });
    type('Garten');
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    input.dispatchEvent(event);

    expect(event.defaultPrevented, 'Enter must not submit a form around it').toBe(true);
    expect(wrote).toEqual(['Garten']);
    field.stop();
  });

  it('another key is left alone', () => {
    const field = bind({ delay: 100000 });
    type('Garten');
    const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(wrote).toEqual([]);
    field.stop();
  });
});

describe('refresh(), which is the only way the field is assigned', () => {
  /* The bug the module exists to remove. mitreden names one reason - the caret
   * jumps to the end mid-word - and vorlaut a worse one: the assignment is the
   * old name landing on top of the new one, and the write that follows saves
   * what the repaint put there. */
  it('declines while somebody is typing in the field', () => {
    const field = bind({ delay: 400 });
    type('Neuer Nam');

    field.refresh('Sammlung vom 24.08.2026');       // a repaint, mid-word

    expect(input.value).toBe('Neuer Nam');
    vi.advanceTimersByTime(400);
    expect(wrote, 'and what gets saved is what was typed').toEqual(['Neuer Nam']);
    field.stop();
  });

  /* The half mitreden's guard did not have: a value can change without the
   * field ever holding focus. A paste handler, or anything that sets .value and
   * dispatches `input` the way a framework does, arms the debounce on a field
   * nobody is standing in - and a repaint arriving then would assign over a
   * write that is already owed. The focus check alone says nothing about it. */
  it('declines while a keystroke is still waiting out its debounce', () => {
    const field = bind({ delay: 400 });
    input.value = 'Neu';                            // set, not typed
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.activeElement, 'nobody is in the field').not.toBe(input);

    field.refresh('Alt');

    expect(input.value).toBe('Neu');
    vi.advanceTimersByTime(400);
    expect(wrote).toEqual(['Neu']);
    field.stop();
  });

  /* The focus guard on its own, with nothing owed. Everything above arms the
   * debounce as a side effect of typing, so the two guards cover each other and
   * neither is tested alone - and this is the case only the first one catches:
   * somebody is standing in the field, has written nothing, and the stored name
   * moves underneath them. Another tab, or a restore. Without the focus check
   * the field is yanked out from under the caret. */
  it('declines while the field has focus even with nothing owed', () => {
    input.value = 'Küche';
    const field = bind({ delay: 400 });
    field.refresh('Küche');                         // nothing owed after this
    input.focus();

    field.refresh('Kinderzimmer');                  // the name moved elsewhere

    expect(input.value, 'the person in the field wins').toBe('Küche');
    field.stop();
  });

  /* The switch case, and the reason there is no second method for it: pressing
   * another Sammlung's row moves focus off the field, the blur writes, and by
   * the time the repaint arrives nothing is owed. */
  it('assigns once the blur has written, so switching shows the new name', () => {
    const field = bind({ delay: 100000 });
    type('Küche');
    input.blur();

    field.refresh('Kinderzimmer');

    expect(input.value).toBe('Kinderzimmer');
    expect(wrote, 'and the one being left was saved on the way out').toEqual(['Küche']);
    field.stop();
  });

  it('a name it has just been given is not written back on the next blur', () => {
    const field = bind({ delay: 400 });
    field.refresh('Kinderzimmer');
    input.focus();
    input.blur();

    expect(wrote).toEqual([]);
    field.stop();
  });

  it('leaves the caret alone when the name has not changed', () => {
    input.value = 'Küche';
    const field = bind({ delay: 400 });
    field.refresh('Küche');
    input.focus();
    input.setSelectionRange(2, 2);

    field.refresh('Küche');

    expect(input.selectionStart, 'no assignment, so nothing moved the caret').toBe(2);
    field.stop();
  });
});

describe('flush()', () => {
  it('writes what is owed, and resolves', async () => {
    const field = bind({ delay: 100000 });
    type('Bad');
    await field.flush();
    expect(wrote).toEqual(['Bad']);
    field.stop();
  });

  it('writes nothing when nothing is owed', async () => {
    const field = bind({ delay: 100000 });
    type('Bad');
    await field.flush();
    await field.flush();
    expect(wrote).toEqual(['Bad']);
    field.stop();
  });

  it('resolves when the write does', async () => {
    let release;
    const field = renameField(input, () => new Promise((r) => { release = r; }), { delay: 10 });
    type('Bad');
    let done = false;
    const flushed = field.flush().then(() => { done = true; });
    await Promise.resolve();
    expect(done, 'not before the write itself has').toBe(false);
    release();
    await flushed;
    expect(done).toBe(true);
    field.stop();
  });
});

describe('what it deliberately does not decide', () => {
  /* mitreden refuses an empty name; vorlaut writes one and draws a fallback in
   * its list. Both are right for a product that does or does not have somewhere
   * to show "unnamed", so write() gets the raw value and decides. */
  it('hands write() an empty name rather than swallowing it', () => {
    input.value = 'Küche';
    const field = bind({ delay: 10 });
    type('');
    vi.advanceTimersByTime(10);
    expect(wrote).toEqual(['']);
    field.stop();
  });

  it('does not trim', () => {
    const field = bind({ delay: 10 });
    type('  Küche  ');
    vi.advanceTimersByTime(10);
    expect(wrote).toEqual(['  Küche  ']);
    field.stop();
  });
});

describe('stop()', () => {
  it('drops a pending write and stops listening', () => {
    const field = bind({ delay: 400 });
    type('Weg');
    field.stop();

    vi.advanceTimersByTime(400);
    expect(wrote).toEqual([]);
    type('Auch weg');
    vi.advanceTimersByTime(400);
    expect(wrote).toEqual([]);
  });

  /* Two fields on one page is the ordinary case - a product may bind the work
   * head and something else - so stopping one must not deafen the other. */
  it('leaves another field bound to the same document alone', () => {
    const other = document.createElement('input');
    document.body.appendChild(other);
    const otherWrote = [];
    const a = bind({ delay: 10 });
    const b = renameField(other, (n) => otherWrote.push(n), { delay: 10 });

    a.stop();
    other.focus();
    other.value = 'Still here';
    other.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(10);

    expect(otherWrote).toEqual(['Still here']);
    b.stop();
  });
});

/* The reason this module binds with addEventListener rather than taking
 * `oninput`: bildhaft echoes each keystroke into its sidebar row and top bar,
 * which is a live redraw and not a write, and it would have had to be handed in
 * as an option if this file took the property. */
it('leaves room for a listener of the caller\'s own on the same field', () => {
  const echoed = [];
  input.addEventListener('input', () => echoed.push(input.value));
  const field = bind({ delay: 10 });

  type('Kü'); type('Küc');
  vi.advanceTimersByTime(10);

  expect(echoed, 'the caller heard every keystroke').toEqual(['Kü', 'Küc']);
  expect(wrote, 'and the package still wrote once').toEqual(['Küc']);
  field.stop();
});
