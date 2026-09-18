import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Footer from '../svelte/Footer.svelte';
import { drawnClasses, emittedClasses } from '../docs/lib/css.js';
import Foot from './fixtures/Foot.svelte';
import { props } from './props.svelte.js';

/* The foot of the page, and the three pages it opens. conventions.md §6.12.
 *
 * `components.css` already draws `.footer`, `.footer a` and `.linklike`, so
 * what is being shared here is the landmark and the one line above the links —
 * and, in `Legal`, the dialog two of the three products already hold as one
 * dialog with a key rather than three.
 *
 * Two of these cases are about something not happening. The links are not
 * wrapped, because bildhaft puts its four in a flex row and the other two let
 * `text-align: center` and the word space do the work, and a wrapper here
 * would move one product or two. And `.footer__credit` keeps its name: it has
 * no rule anywhere, it is a live e2e locator, and the footer it sits in is in
 * a baseline — so it is not tidied up on the way in.
 */

const HERE = dirname(fileURLToPath(import.meta.url));

let app;
let given;

afterEach(() => {
  if (app) unmount(app);
  app = undefined;
  document.body.innerHTML = '';
});

const render = (Component, initial) => {
  given = props(initial ?? {});
  app = mount(Component, { target: document.body, props: given });
  flushSync();
  return document.body.firstElementChild;
};

/** The class tokens a node carries, without Svelte's scoping hash. */
const classes = (node) => [...node.classList].filter((name) => !/^svelte-[0-9a-z]+$/.test(name));

const footer = () => document.querySelector('footer');
const dialog = () => document.querySelector('dialog');

describe('Footer', () => {
  it('is the page’s landmark footer, with the class components.css draws', () => {
    /* `<footer>` rather than a div, and aimed the way bildhaft aims its own
       840px column — `footer.footer`, which still matches. */
    const node = render(Footer, { id: 'foot' });
    expect(node.tagName).toBe('FOOTER');
    expect(classes(node)).toEqual(['footer']);
    expect(node.id).toBe('foot');
  });

  it('appends the caller’s class rather than replacing it', () => {
    expect(classes(render(Footer, { class: 'footer--wide' }))).toEqual(['footer', 'footer--wide']);
  });

  it('draws no credit paragraph where there is nothing to attribute', () => {
    /* Two of the three products have nothing, and an empty line above the
       links is a row of air in a footer measured in single pixels. The empty
       string counts as nothing, because bildhaft's attribution is empty while
       no source is in force and its own `{#if}` is exactly this. */
    expect(render(Footer, {}).children).toHaveLength(0);
    expect(render(Footer, { credit: '' }).children).toHaveLength(0);
  });

  it('emits nothing components.css does not draw, apart from the one hook', () => {
    const drawn = drawnClasses();
    const node = render(Foot, { attribution: 'Symbole: ARASAAC' });
    const missing = [...emittedClasses(node.closest('footer') ?? footer())]
      .filter((name) => !drawn.has(name));
    /* `.footer__credit` and `.footer__links` are bildhaft's, neither has a rule
       in components.css, and neither should: one product has an attribution
       obligation and one wraps its links, and a shared sheet that drew either
       would imply three of them do. */
    expect(missing).toEqual(['footer__credit', 'footer__links']);
  });
});

describe('a product’s footer', () => {
  it('draws the credit above the links, under the name the e2e locator uses', () => {
    render(Foot, { attribution: 'Symbole: ARASAAC (CC BY-NC-SA)' });
    const credit = footer().querySelector('.footer__credit');
    expect(credit.tagName).toBe('P');
    expect(credit.textContent).toBe('Symbole: ARASAAC (CC BY-NC-SA)');
    expect(footer().firstElementChild).toBe(credit);
  });

  it('carries the four pixels that were an inline style, in the component', () => {
    /* The class has no rule anywhere — not in components.css, not in
       bildhaft's own stylesheet — and the separation is an inline `margin: 0 0
       4px` on the element. Moving it here is the same four pixels arriving by
       §4.12's mechanism; dropping it would give the paragraph a browser's
       default `1em` in a photographed footer. */
    const file = readFileSync(join(HERE, '..', 'svelte', 'Footer.svelte'), 'utf8');
    const style = /<style>([\s\S]*)<\/style>/.exec(file)[1];
    expect(style).toMatch(/\.footer__credit\s*\{[^}]*margin:\s*0 0 4px/);
  });

  it('wraps the links in nothing, so the product’s own row is the only one', () => {
    render(Foot, {});
    expect([...footer().children].map(classes)).toEqual([['footer__links']]);
    expect(footer().querySelectorAll('.linklike')).toHaveLength(3);
    expect(footer().querySelector('a').getAttribute('rel')).toBe('noreferrer noopener');
  });
});

describe('Legal', () => {
  it('is one dialog with every page in it, not one dialog per page', () => {
    /* vorlaut's shape, and it has to win: its markup is addressed —
       #aboutPage, #impressumPage, #privacyPage and forty-one ids beneath them,
       several of them e2e locators — so mounting one page at a time would make
       a locator resolve or not depending on which page happened to be open. */
    render(Foot, {});
    expect(document.querySelectorAll('dialog')).toHaveLength(1);
    expect([...dialog().querySelectorAll('section')].map((one) => one.id))
      .toEqual(['aboutPage', 'impressumPage', 'privacyPage']);
  });

  it('sends both the body and the dialog back to the top, not only the body', () => {
    /* Which of the two scrolls is a product decision this component does not
       get to know: two products scroll `.sheet > .body`, two scroll the whole
       dialog, and §6.1 records that fork as one it did not converge. wochenwerk
       found it with a 2024px notice inside an 860px dialog, where "from the
       top, every time" quietly meant nothing. */
    render(Foot, {});
    footer().querySelectorAll('.linklike')[1].click();
    flushSync();
    const body = dialog().querySelector('.body');
    body.scrollTop = 120;
    dialog().scrollTop = 140;
    footer().querySelectorAll('.linklike')[2].click();
    flushSync();
    expect(body.scrollTop).toBe(0);
    expect(dialog().scrollTop).toBe(0);
  });

  it('forwards the heading id too, which it did not at first', () => {
    /* The same rule twice: Legal took closeId and bodyId when Sheet grew them,
       and then Sheet grew titleId and Legal stopped there. mitreden found it —
       its heading is still located structurally as `#info .head h2` because the
       prop it wanted had no way through. */
    render(Foot, {});
    footer().querySelectorAll('.linklike')[0].click();
    flushSync();
    expect(dialog().querySelector('.head > h2').id).toBe('legalTitle');
  });

  it('forwards the ✕ and the body ids to the sheet underneath', () => {
    /* A component that wraps `Sheet` and does not forward these hands back the
       problem those props solved. mitreden adopted Legal and lost `#infoclose`
       and `#infobody` — the two ids it had been writing onto the frame by hand
       until Sheet grew them. */
    render(Foot, {});
    expect(dialog().querySelector('.head > button').id).toBe('legalClose');
    expect(dialog().querySelector('.body').id).toBe('legalBody');
  });

  it('is closed, and the pages all hidden, until the footer opens one', () => {
    render(Foot, {});
    expect(dialog().open).toBe(false);
    expect([...dialog().querySelectorAll('section')].every((one) => one.hidden)).toBe(true);
  });

  it('opens the page the footer asked for, and hides the other two', () => {
    render(Foot, {});
    footer().querySelectorAll('.linklike')[1].click();
    flushSync();
    expect(dialog().open).toBe(true);
    expect([...dialog().querySelectorAll('section')].map((one) => one.hidden))
      .toEqual([true, false, true]);
  });

  it('is announced as the page that is showing', () => {
    /* One dialog with three swappable prose sections, so a reader that
       announces it says „Impressum" while the Impressum is showing. vorlaut
       does that with aria-labelledby and a $derived heading; §6.1's thunked
       title is the mechanism that preserves it, and this is what passes the
       thunk. */
    render(Foot, {});
    footer().querySelectorAll('.linklike')[1].click();
    flushSync();
    expect(dialog().getAttribute('aria-label')).toBe('Impressum');
    expect(dialog().querySelector('.head h2').textContent).toBe('Impressum');
    footer().querySelectorAll('.linklike')[2].click();
    flushSync();
    expect(dialog().getAttribute('aria-label')).toBe('Datenschutz');
  });

  it('takes its id and its class, which is why the sheet takes them', () => {
    /* vorlaut's #legal is 520px by an id selector, and the comment above that
       rule says the id is load-bearing: demoted to a class it ties with
       `.sheet { width: … }` and the winner becomes bundle order, which §6.0
       forbids relying on. */
    render(Foot, {});
    expect(dialog().id).toBe('legal');
    expect([...dialog().classList]).toContain('legal');
    expect([...dialog().classList]).toContain('sheet');
  });

  it('draws the sheet’s ✕ with the label the product gave it', () => {
    render(Foot, {});
    const close = dialog().querySelector('.head .btn');
    expect(close.getAttribute('aria-label')).toBe('Schließen');
    expect(close.textContent).toBe('✕');
  });

  it('writes the page back to null however it closed', () => {
    /* Every way out — the ✕, Escape, a press outside — has to end with the
       caller and the dialog agreeing rather than one of them left behind. */
    render(Foot, { page: 'about' });
    expect(dialog().open).toBe(true);
    dialog().querySelector('.head .btn').click();
    flushSync();
    expect(given.page).toBe(null);
    expect(dialog().open).toBe(false);
  });

  it('starts each page at the top', () => {
    /* The sheet keeps its scroll position, and the privacy notice is long
       enough that reopening it half way down reads as a page that starts in
       the middle of a sentence. vorlaut's finding, and the only behaviour in
       the component that is not markup. */
    render(Foot, { page: 'about' });
    const body = dialog().querySelector('.body');
    body.scrollTop = 420;
    given.page = 'privacy';
    flushSync();
    expect(body.scrollTop).toBe(0);
  });

  it('draws the product’s prose, and only the product’s', () => {
    // No German in here, and no page a shared file invented.
    render(Foot, {});
    expect([...dialog().querySelectorAll('section > .lead')].map((one) => one.textContent))
      .toEqual(['about', 'impressum', 'privacy']);
  });
});
