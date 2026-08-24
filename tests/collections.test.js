import { beforeEach, describe, expect, it } from 'vitest';
import { drawCollections } from '../docs/lib/collections.js';

/* The rows down the side.
 *
 * Small enough that most of this is bookkeeping, and two of the cases are not:
 * aria-current, which two of the three products were missing so the one fact
 * the list exists to carry was unavailable to anyone not looking at the accent;
 * and the Cmd-or-Ctrl chord, which only mitreden's arity uses but which all
 * three would otherwise have had their own chance to get differently.
 */

let host;

beforeEach(() => {
  document.body.innerHTML = '';
  host = document.createElement('div');
  host.className = 'collections';
  document.body.appendChild(host);
});

const draw = (opts) => {
  const picked = [];
  drawCollections(host, {
    rows: opts.rows,
    open: opts.open ?? [],
    onPick: (id, additive) => picked.push({ id, additive }),
  });
  return picked;
};

const items = () => [...host.querySelectorAll('.collections__item')];
const nameOf = (item) => item.querySelector('.collections__name').textContent;
const countOf = (item) => item.querySelector('.collections__count').textContent;

const THREE = [
  { id: 'a', name: 'Küche', count: 3 },
  { id: 'b', name: 'Kinderzimmer', count: 12 },
  { id: 'c', name: 'Garten', count: 0 },
];

describe('what it draws', () => {
  it('one row per Sammlung, in the order it was given', () => {
    draw({ rows: THREE });
    expect(items().map(nameOf)).toEqual(['Küche', 'Kinderzimmer', 'Garten']);
  });

  it('the count beside the name', () => {
    draw({ rows: THREE });
    expect(items().map(countOf)).toEqual(['3', '12', '0']);
  });

  /* A count that is not known yet is not zero. vorlaut reads the layouts it is
   * not showing to work these out, so a row can exist before its number does,
   * and drawing 0 for it would be a claim that the Sammlung is empty. */
  it('nothing at all where the count is not known', () => {
    draw({ rows: [{ id: 'a', name: 'Küche' }, { id: 'b', name: 'Bad', count: null }] });
    expect(items().map(countOf)).toEqual(['', '']);
  });

  it('zero where it is known to be zero', () => {
    draw({ rows: [{ id: 'c', name: 'Garten', count: 0 }] });
    expect(countOf(items()[0])).toBe('0');
  });

  /* A row is a control, not a link - none of these navigate - and a bare
   * <button> inside a <form> submits it. */
  it('buttons, and buttons that do not submit', () => {
    draw({ rows: THREE });
    for (const item of items()) {
      expect(item.tagName).toBe('BUTTON');
      expect(item.type).toBe('button');
    }
  });

  it('takes the name exactly as given, including a product\'s own fallback', () => {
    draw({ rows: [{ id: 'a', name: '(ohne Namen)', count: 1 }] });
    expect(nameOf(items()[0])).toBe('(ohne Namen)');
  });

  it('empties the container, so a redraw does not stack', () => {
    draw({ rows: THREE });
    draw({ rows: [THREE[0]] });
    expect(items()).toHaveLength(1);
    expect(host.children).toHaveLength(1);
  });

  it('draws nothing for an empty list', () => {
    draw({ rows: [] });
    expect(items()).toHaveLength(0);
  });
});

describe('which ones are open', () => {
  it('marks the open one and no other', () => {
    draw({ rows: THREE, open: ['b'] });
    expect(items().map((i) => i.classList.contains('collections__item--active')))
      .toEqual([false, true, false]);
  });

  /* The fact the list exists to carry, for a reader who is not looking at the
   * accent. Two of the three marked the open row by colour alone. */
  it('says so with aria-current, not only with a colour', () => {
    draw({ rows: THREE, open: ['b'] });
    expect(items().map((i) => i.getAttribute('aria-current')))
      .toEqual([null, 'true', null]);
  });

  /* Arity is per product (§4.1): one in vorlaut and bildhaft, several in
   * mitreden. Nothing here knows which kind it is talking to. */
  it('marks several, for the product whose arity is many', () => {
    draw({ rows: THREE, open: ['a', 'c'] });
    expect(items().map((i) => i.getAttribute('aria-current')))
      .toEqual(['true', null, 'true']);
  });

  it('takes a Set as readily as an array', () => {
    draw({ rows: THREE, open: new Set(['a', 'c']) });
    expect(items().map((i) => i.classList.contains('collections__item--active')))
      .toEqual([true, false, true]);
  });

  it('marks nothing when nothing is open', () => {
    draw({ rows: THREE, open: [] });
    expect(items().some((i) => i.hasAttribute('aria-current'))).toBe(false);
  });

  /* An id that is open but not in the list is not an error - a product mid-load
   * can hold one - and it must not mark a row that is not it. */
  it('ignores an open id that is not in the list', () => {
    draw({ rows: THREE, open: ['gone'] });
    expect(items().some((i) => i.hasAttribute('aria-current'))).toBe(false);
  });
});

describe('pressing one', () => {
  it('reports the id', () => {
    const picked = draw({ rows: THREE });
    items()[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(picked).toEqual([{ id: 'b', additive: false }]);
  });

  /* Which key means "and also this one" is decided here rather than three
   * times, so that it cannot drift to Shift in the third product. §4.2. */
  it('reports Cmd as additive', () => {
    const picked = draw({ rows: THREE });
    items()[0].dispatchEvent(new MouseEvent('click', { bubbles: true, metaKey: true }));
    expect(picked).toEqual([{ id: 'a', additive: true }]);
  });

  it('reports Ctrl as additive', () => {
    const picked = draw({ rows: THREE });
    items()[0].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
    expect(picked).toEqual([{ id: 'a', additive: true }]);
  });

  it('reports Shift as an ordinary press, because it is not the chord', () => {
    const picked = draw({ rows: THREE });
    items()[0].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    expect(picked).toEqual([{ id: 'a', additive: false }]);
  });

  /* The rows are rebuilt on every draw, so a press must reach the handler the
   * *latest* draw was given - a stale closure here would call back with a
   * callback the caller has already replaced. */
  it('calls the handler the last draw was given', () => {
    draw({ rows: THREE });
    const second = draw({ rows: THREE });
    items()[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(second).toEqual([{ id: 'c', additive: false }]);
  });
});
