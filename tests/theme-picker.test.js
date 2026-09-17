import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThemePicker from '../svelte/ThemePicker.svelte';
import { readTheme } from '../docs/lib/theme.js';
import { drawnClasses, emittedClasses } from '../docs/lib/css.js';
import { props } from './props.svelte.js';

/* The scheme picker. conventions.md §6.10.
 *
 * Four near-identical implementations over one shared runtime, and what is
 * pinned here is the part that is not obvious from the drawing: the choice
 * reaches storage and the document, `aria-pressed` says both "true" and
 * "false" rather than going absent, and the caller can read back the word the
 * panel's summary has to show.
 */

/* vitest's happy-dom environment puts no `localStorage` on the global, and
   `@lautstark/design/theme` is deliberately built on it — a scheme read from
   IndexedDB arrives after the first paint and the page flashes the OS's answer
   before correcting itself, which is worst in exactly the case somebody set it
   to avoid. So the store is the thing under test here as much as the markup
   is, and it is stubbed rather than mocked away. */
const store = new Map();
vi.stubGlobal('localStorage', {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => void store.set(k, String(v)),
  removeItem: (k) => void store.delete(k),
  clear: () => store.clear(),
});

const KEY = 'wochenwerk.theme';
const WORDS = { system: 'Wie das System', light: 'Hell', dark: 'Dunkel' };

let app;
let given;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  if (app) unmount(app);
  app = undefined;
  document.body.innerHTML = '';
});

const render = (initial = {}) => {
  given = props({ key: KEY, label: (t) => WORDS[t], ariaLabel: 'Aussehen', ...initial });
  app = mount(ThemePicker, { target: document.body, props: given });
  flushSync();
  return document.body.firstElementChild;
};

const buttons = (node) => [...node.querySelectorAll('button')];

describe('ThemePicker', () => {
  it('draws a labelled group of buttons, not a radiogroup', () => {
    /* Three of the four products carry the same comment arguing this:
       `.segmented` marks its choice with aria-pressed, and a radiogroup whose
       children are not radios reads worse than a labelled group of buttons. */
    const node = render();
    expect([...node.classList]).toEqual(['segmented']);
    expect(node.getAttribute('role')).toBe('group');
    expect(node.getAttribute('aria-label')).toBe('Aussehen');
    expect(buttons(node).map((b) => b.textContent))
      .toEqual(['Wie das System', 'Hell', 'Dunkel']);
  });

  it('emits nothing components.css does not draw', () => {
    const drawn = drawnClasses();
    expect([...emittedClasses(render())].filter((name) => !drawn.has(name))).toEqual([]);
  });

  it('says which one is in force, and says "false" of the others', () => {
    // components.css selects [aria-pressed="true"], and absent is a third
    // thing. Svelte's set_attribute removes only on null, so the boolean is
    // enough — see §6.0.
    const node = render({ theme: 'dark' });
    expect(buttons(node).map((b) => b.getAttribute('aria-pressed')))
      .toEqual(['false', 'false', 'true']);
  });

  it('arrives on the stored choice when the caller does not say', () => {
    localStorage.setItem(KEY, 'light');
    expect(buttons(render()).map((b) => b.getAttribute('aria-pressed')))
      .toEqual(['false', 'true', 'false']);
  });

  it('stores the choice, puts it in force, and hands it back', () => {
    const onchange = vi.fn();
    const node = render({ theme: 'system', onchange });
    buttons(node)[2].click();
    flushSync();
    expect(readTheme(KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    // The word the panel's summary shows: the caller draws `label(theme)`.
    expect(given.theme).toBe('dark');
    expect(onchange).toHaveBeenCalledWith('dark');
    expect(buttons(node)[2].getAttribute('aria-pressed')).toBe('true');
  });

  it('removes the key rather than writing the word for system', () => {
    const node = render({ theme: 'dark' });
    buttons(node)[0].click();
    flushSync();
    expect(localStorage.getItem(KEY)).toBe(null);
    expect(given.theme).toBe('system');
  });

  it('follows the caller where the caller moves it', () => {
    const node = render({ theme: 'system' });
    given.theme = 'light';
    flushSync();
    expect(buttons(node)[1].getAttribute('aria-pressed')).toBe('true');
  });
});
