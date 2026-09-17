import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Tile from '../svelte/Tile.svelte';
import TileGrid from '../svelte/TileGrid.svelte';
import { drawnClasses, emittedClasses } from '../docs/lib/css.js';
import { props } from './props.svelte.js';

/* The grid of labelled picture buttons. conventions.md §6.4.
 *
 * Two products drew this independently under the same two class names, and the
 * one thing they disagree about is the one thing worth testing hardest:
 * wochenwerk's tile toggles and carries `aria-pressed`, bildhaft's closes the
 * dialog and must not. The default has to be the second, because an attribute
 * announcing a state the control does not have is worse than none.
 */

let app;
let given;

afterEach(() => {
  if (app) unmount(app);
  app = undefined;
  document.body.innerHTML = '';
});

const render = (Component, initial) => {
  given = props(initial);
  app = mount(Component, { target: document.body, props: given });
  flushSync();
  return document.body.firstElementChild;
};

describe('Tile', () => {
  it('draws a button with the picture and the label under it', () => {
    const node = render(Tile, { label: 'trinken' });
    expect(node.tagName).toBe('BUTTON');
    expect(node.type).toBe('button');
    expect([...node.classList]).toEqual(['picker__item']);
    expect(node.querySelector('span').textContent).toBe('trinken');
  });

  it('emits nothing components.css does not draw', () => {
    const drawn = drawnClasses();
    const node = render(Tile, { label: 'trinken', active: true });
    expect([...emittedClasses(node)].filter((name) => !drawn.has(name))).toEqual([]);
  });

  it('marks the chosen tile with a class, not with aria-pressed', () => {
    /* `.chip` marks its choice with [aria-pressed="true"] and this does not,
       because half these tiles never toggle. */
    const node = render(Tile, { label: 'x', active: true });
    expect([...node.classList]).toEqual(['picker__item', 'picker__item--active']);
    expect(node.hasAttribute('aria-pressed')).toBe(false);
  });

  it('carries no aria-pressed by default', () => {
    // bildhaft's tiles close the dialog and hand back an answer. An attribute
    // announcing a state the control does not have is worse than none.
    expect(render(Tile, { label: 'x' }).hasAttribute('aria-pressed')).toBe(false);
  });

  it('says pressed where the tile toggles, and says so both ways', () => {
    /* `aria-pressed={x}` compiles to set_attribute, which removes only on
       null — so false is the string "false", which is what components.css and
       a reader both need. Absent and "false" are not the same thing. */
    const node = render(Tile, { label: 'x', toggle: true, active: false });
    expect(node.getAttribute('aria-pressed')).toBe('false');
    given.active = true;
    flushSync();
    expect(node.getAttribute('aria-pressed')).toBe('true');
  });

  it('titles itself with the label, because the label is elided', () => {
    // `.picker__item > span` cuts the label off with an ellipsis, and the
    // tooltip is where the whole of it still is.
    expect(render(Tile, { label: 'Zahnarzttermin' }).title).toBe('Zahnarzttermin');
  });

  it('lets a caller title it otherwise', () => {
    expect(render(Tile, { label: 'x', title: 'anders' }).title).toBe('anders');
  });

  it('appends the caller\'s class and passes its own attributes through', () => {
    const node = render(Tile, { label: 'x', class: 'picker__item--add', 'data-move': '' });
    expect([...node.classList]).toEqual(['picker__item', 'picker__item--add']);
    expect(node.getAttribute('data-move')).toBe('');
  });

  it('calls onclick', () => {
    const onclick = vi.fn();
    render(Tile, { label: 'x', onclick }).click();
    expect(onclick).toHaveBeenCalledOnce();
  });
});

describe('TileGrid', () => {
  it('draws the grid', () => {
    const node = render(TileGrid, {});
    expect([...node.classList]).toEqual(['picker__grid']);
    expect(node.hasAttribute('style')).toBe(false);
  });

  it('takes the one figure the two products differ on', () => {
    // wochenwerk 84px and 56px tight, bildhaft 102px. A token rather than a
    // second grid rule, which is what the tight variant would otherwise be.
    expect(render(TileGrid, { min: '102px' }).style.getPropertyValue('--tile-min')).toBe('102px');
  });

  it('appends a class and passes attributes through', () => {
    const node = render(TileGrid, { class: 'picker__grid--tight', 'aria-label': 'Symbole' });
    expect([...node.classList]).toEqual(['picker__grid', 'picker__grid--tight']);
    expect(node.getAttribute('aria-label')).toBe('Symbole');
  });
});

describe('components.css draws the grid', () => {
  it('has the two names both products were emitting', () => {
    const drawn = drawnClasses();
    for (const name of ['picker__grid', 'picker__item', 'picker__item--active']) {
      expect(drawn.has(name), name).toBe(true);
    }
  });
});
