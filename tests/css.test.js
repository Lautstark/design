import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { drawnClasses, emittedClasses } from '../docs/lib/css.js';

/* The CSS contract's two helpers, lifted out of three packages that carried
 * character-identical copies of them.
 *
 * What is pinned here is the parsing — which is small and easy to get subtly
 * wrong in ways no consumer would notice until a class went missing from the
 * answer and its test went quietly green — and the one behaviour that is new
 * here rather than inherited: the Svelte scoping hash is not a class anybody
 * has to draw.
 */

const parse = (css) => {
  const file = join(tmpdir(), `lautstark-css-${Math.random().toString(36).slice(2)}.css`);
  writeFileSync(file, css);
  return drawnClasses(file);
};

describe('drawnClasses', () => {
  it('reads the shipped components.css by default', () => {
    const drawn = drawnClasses();
    // The vocabulary design.md §9 names. If any of these has stopped being in
    // the file, the name changed and every consumer's contract test is about
    // to report it as a class nobody draws.
    for (const name of ['btn', 'primary', 'quiet', 'icon', 'field', 'lbl', 'chip',
      'menu', 'menu-anchor', 'sheet', 'head', 'body', 'foot', 'empty', 'notice',
      'toast', 'panel', 'section', 'state']) {
      expect(drawn.has(name), name).toBe(true);
    }
  });

  it('takes every class out of a selector list, not just the first', () => {
    expect([...parse('.a .b > .c, .d.e { color: red }')].sort())
      .toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('does not read declarations', () => {
    // `background: url(.png)` and the like sit after the brace and are not
    // selectors. A parser that matched `.name` over the whole file would take
    // them, and the answer would be a set nobody can explain.
    expect([...parse('.a { background-image: url(x.png); font: 12px/1.4 sans-serif }')])
      .toEqual(['a']);
  });

  it('does not read comments', () => {
    expect([...parse('/* .ghost is gone, see below */ .real { color: red }')])
      .toEqual(['real']);
  });

  it('takes the classes inside an at-rule and none from its prelude', () => {
    expect([...parse('@media (max-width: 560px) { .narrow { gap: 0 } }')])
      .toEqual(['narrow']);
  });
});

describe('emittedClasses', () => {
  const tree = (html) => {
    const host = document.createElement('div');
    host.innerHTML = html;
    return host.firstElementChild;
  };

  it('collects the root and everything under it', () => {
    const root = tree('<div class="panel"><span class="section small"></span><b class="state"></b></div>');
    expect([...emittedClasses(root)].sort()).toEqual(['panel', 'section', 'small', 'state']);
  });

  it('skips Svelte\'s scoping hash', () => {
    /* Measured 2026-09-17: a panel component with a <style> block emitted
       ["panel","svelte-1fnslke","section","state","body"]. The hash is the
       mechanism by which a shared component's own arrangement travels with it,
       and it is never a name components.css draws. */
    const root = tree('<details class="panel svelte-1fnslke"><div class="body svelte-1fnslke"></div></details>');
    expect([...emittedClasses(root)].sort()).toEqual(['body', 'panel']);
  });

  it('is anchored, so a product class is not swallowed by the filter', () => {
    /* The pattern is deliberately wide — `svelte-` and one run of base-36 —
       because a hash is not predictable and a narrower rule would let one
       through. Anchoring is what keeps it from taking a real name with it. */
    const root = tree('<div class="sveltekit-body"><span class="row-svelte-1fnslke"></span></div>');
    expect([...emittedClasses(root)].sort()).toEqual(['row-svelte-1fnslke', 'sveltekit-body']);
  });

  it('answers empty for a node with no classes', () => {
    expect([...emittedClasses(tree('<div><span></span></div>'))]).toEqual([]);
  });
});
