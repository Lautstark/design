import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { announcer } from '../docs/lib/toast.js';

/* The line that says what just happened.
 *
 * The first case is the bug all three products had at the same time and none
 * of their suites caught: a live region that is added or removed around each
 * message announces nothing, because a reader announces a change in something
 * it was already watching. On screen it looks perfect, which is why it lasted.
 *
 * The rest are the three products' own answers to "and then what", which this
 * module deliberately does not decide - bildhaft empties the line, vorlaut
 * dims it, mitreden leaves it and has a busy state instead.
 */

let node;

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '';
  node = document.createElement('div');
  node.setAttribute('role', 'status');
  document.body.appendChild(node);
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('the region itself', () => {
  it('never leaves the page, whatever is said to it', () => {
    const line = announcer(node, { rest: 3200, onRest: (n) => { n.textContent = ''; } });

    line.rests('Alles gelöscht.');
    expect(node.isConnected, 'still mounted while it carries a message').toBe(true);

    vi.advanceTimersByTime(3200);
    expect(node.textContent, 'the text goes').toBe('');
    expect(node.isConnected, 'and the node does not').toBe(true);
  });

  it('refuses a region that is not there, rather than making one', () => {
    // A node this module created would be a node it had to mount, and mounting
    // it at the moment of the first message is the bug.
    expect(() => announcer(null)).toThrow();
  });
});

describe('what happens after a message', () => {
  it('empties the line, for a product that goes quiet', () => {
    const line = announcer(node, { rest: 3200, onRest: (n) => { n.textContent = ''; } });
    line.rests('42 Sätze hinzugefügt');
    expect(node.textContent).toBe('42 Sätze hinzugefügt');
    vi.advanceTimersByTime(3199);
    expect(node.textContent, 'not a moment early').toBe('42 Sätze hinzugefügt');
    vi.advanceTimersByTime(1);
    expect(node.textContent).toBe('');
  });

  it('dims it and keeps the words, for a product whose status stays true', () => {
    const line = announcer(node, {
      rest: 4000,
      onRest: (n) => n.classList.add('status--rested'),
    });
    line.rests('Gesichert');
    vi.advanceTimersByTime(4000);
    expect(node.textContent, 'still says what is true').toBe('Gesichert');
    expect(node.classList.contains('status--rested')).toBe(true);
  });

  it('leaves it alone when nobody asked for a rest', () => {
    const line = announcer(node);
    line.rests('Gespeichert');
    vi.advanceTimersByTime(60_000);
    expect(node.textContent).toBe('Gespeichert');
  });

  /* The distinction vorlaut needs, on one element: a failed write stays lit
     while "saved" is allowed to fade, and the same line carries each in turn. */
  it('stays lit for say(), and fades only for rests()', () => {
    const line = announcer(node, {
      rest: 4000,
      onRest: (n) => n.classList.add('status--rested'),
    });

    line.say('Speichern fehlgeschlagen');
    vi.advanceTimersByTime(60_000);
    expect(node.classList.contains('status--rested'), 'a failure keeps asking').toBe(false);

    line.rests('Gesichert');
    vi.advanceTimersByTime(4000);
    expect(node.classList.contains('status--rested')).toBe(true);
  });

  /* And the wake-up half: anything said cancels a pending rest, so a failure
     arriving while "saved" was fading does not inherit its fade. */
  it('wakes the line when something new arrives mid-fade', () => {
    const line = announcer(node, {
      rest: 4000,
      onRest: (n) => n.classList.add('status--rested'),
    });
    line.rests('Gesichert');
    vi.advanceTimersByTime(3900);
    line.say('Speichern fehlgeschlagen');
    vi.advanceTimersByTime(60_000);
    expect(node.classList.contains('status--rested')).toBe(false);
    expect(node.textContent).toBe('Speichern fehlgeschlagen');
  });
});

describe('two messages in quick succession', () => {
  /* The first message's timer firing against the second message's text is how
     a line that had just been written came to be cleared early. */
  it('does not let the first one\'s timer clear the second one', () => {
    const line = announcer(node, { rest: 3200, onRest: (n) => { n.textContent = ''; } });

    line.rests('Erste');
    vi.advanceTimersByTime(3000);
    line.rests('Zweite');

    vi.advanceTimersByTime(400);
    expect(node.textContent, 'the first timer would have fired at 3200').toBe('Zweite');

    vi.advanceTimersByTime(2800);
    expect(node.textContent, 'and the second one gets its full rest').toBe('');
  });
});

describe('a job that has started rather than finished', () => {
  it('marks the line busy and does not rest it', () => {
    const line = announcer(node, {
      rest: 3200,
      onRest: (n) => { n.textContent = ''; },
      busyClass: 'working',
    });

    line.busy('Wird aufgenommen …');
    expect(node.classList.contains('working')).toBe(true);

    vi.advanceTimersByTime(60_000);
    expect(node.textContent, 'a job in flight has not finished').toBe('Wird aufgenommen …');
    expect(node.classList.contains('working')).toBe(true);
  });

  /* mitreden's rule, and worth keeping: the end of a job is always reported,
     so putting the removal in say() means no call site can forget it and leave
     the page claiming to be busy for the rest of the session. */
  it('stops looking busy on the next thing that finishes', () => {
    const line = announcer(node, { busyClass: 'working' });
    line.busy('Wird aufgenommen …');
    line.say('Fertig.');
    expect(node.classList.contains('working')).toBe(false);
    expect(node.textContent).toBe('Fertig.');
  });

  it('stops looking busy when it is cleared outright', () => {
    const line = announcer(node, { busyClass: 'working' });
    line.busy('Wird aufgenommen …');
    line.clear();
    expect(node.classList.contains('working')).toBe(false);
    expect(node.textContent).toBe('');
    expect(node.isConnected).toBe(true);
  });
});
