import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Vanilla from '../svelte/Vanilla.svelte';
import { emittedClasses } from '../docs/lib/css.js';
import { props } from './props.svelte.js';

/* The vanilla host: a node built outside Svelte, standing among components.
 *
 * Small enough that the only things worth pinning are the two it exists for —
 * the wrapper is out of the layout, and swapping the prop moves the node
 * rather than leaving both — plus the one thing four separate copies made easy
 * to get wrong: what happens when the prop is null.
 */

let app;
let given;
const host = () => document.body.firstElementChild;

afterEach(() => {
  if (app) unmount(app);
  app = undefined;
  document.body.innerHTML = '';
});

const render = (initial) => {
  given = props(initial);
  app = mount(Vanilla, { target: document.body, props: given });
  flushSync();
};

describe('Vanilla', () => {
  it('is a wrapper that is out of the layout', () => {
    render({ node: undefined });
    expect(host().tagName).toBe('DIV');
    expect(host().getAttribute('style')).toBe('display:contents');
  });

  it('holds the node it is given', () => {
    const panel = document.createElement('section');
    panel.className = 'backup-panel';
    render({ node: panel });
    expect(host().firstElementChild).toBe(panel);
  });

  it('draws nothing while there is no node, and keeps drawing nothing', () => {
    // All four copies guard this, because a panel is often built after the
    // component that will hold it — the browser has to be asked whether it can
    // do the thing at all first, and the answer arrives as a promise.
    render({ node: null });
    expect(host().childNodes.length).toBe(0);
  });

  it('empties when the node is taken away', () => {
    const panel = document.createElement('p');
    render({ node: panel });
    given.node = null;
    flushSync();
    expect(host().childNodes.length).toBe(0);
  });

  it('moves the node rather than copying it when the prop changes', () => {
    const first = document.createElement('p');
    const second = document.createElement('b');
    render({ node: first });
    given.node = second;
    flushSync();
    expect([...host().childNodes]).toEqual([second]);
  });

  it('emits no class of its own', () => {
    /* The contract test in every consumer walks classList and holds each name
       against components.css. This component has one declaration and no
       arrangement, so it carries it inline rather than in a <style> block —
       which would put a scoping class on the wrapper for nothing. */
    render({ node: document.createElement('p') });
    expect([...emittedClasses(host())]).toEqual([]);
  });
});
