<script lang="ts">
  /**
   * What the footer opens: about, the Impressum, and the privacy notice.
   * conventions.md §6.12, over `./svelte/Sheet`.
   *
   * ## One dialog with several bodies, which is two products' shape already
   *
   * They are the same piece of furniture — a heading, a cross, one scrolling
   * column of prose — and the only thing that differs is which paragraphs are
   * in it. mitreden holds a `Page | null` and swaps the title and the body;
   * vorlaut holds a key and hides two of three `<section>`s; bildhaft opens a
   * fresh sheet per page through `openSheet`. Two of the three already agree,
   * and the third converges on them: three sheets that differ only in their
   * prose are three chances for one of them to be reachable and the others not,
   * which is the failure both legal pages are required against.
   *
   * ## Every section is drawn, and the ones that are not showing are `hidden`
   *
   * vorlaut's shape, and it is the one that has to win, because its markup is
   * addressed: `#aboutPage`, `#impressumPage`, `#privacyPage` and forty-one ids
   * beneath them, several of which are e2e locators. Mounting one at a time
   * would take the other two out of the document, so a locator that resolves
   * would depend on which page happened to be open. It costs the other two
   * products nothing: their bodies are one built HTML string each.
   *
   * ## The accessible name is the current page's title
   *
   * vorlaut's `#legal` is the one dialog in the family with `aria-labelledby`
   * rather than `aria-label`, and it is deliberate — one dialog, three
   * swappable prose sections, whose heading is `$derived`, "so a reader that
   * announces it says „Impressum" while the Impressum is showing". §6.1's
   * thunked `title` preserves exactly that, and this component is what passes
   * the thunk. A fixed string would not, and the first draft of §6.1 got the
   * right answer for the wrong reason.
   *
   * ## From the top, every time
   *
   * The sheet keeps its scroll position, and the privacy notice is long enough
   * that reopening it half way down reads as a page that starts in the middle
   * of a sentence. vorlaut's finding, and the only behaviour in here that is
   * not markup.
   *
   * ## What this costs mitreden
   *
   * Its `#info` has no `.body` class on its body, so the shared `.sheet > .body`
   * padding does not reach the prose, and its `✕` is `.btn.quiet.icon` where
   * the frame's is `.btn.icon`. Both are in `info.png`, compared at a tolerance
   * of zero. That is §6.1's budgeted cost rather than a new one — the sheet is
   * where it is paid — but the footer is where somebody meets it, so it is
   * named here too.
   */
  import type { Snippet } from 'svelte';
  import Sheet from './Sheet.svelte';

  /** One page in the dialog. */
  interface LegalPage {
    /** What the caller sets `page` to. */
    key: string;
    /** The heading, and so the dialog's accessible name while it shows. */
    title: string;
    /** The `<section>`'s id, where a suite names it. */
    id?: string;
  }

  let {
    page = $bindable(null),
    pages,
    closeLabel,
    id,
    closeId,
    bodyId,
    class: extra,
    onclose,
    children,
  }: {
    /** Which page is showing, or `null` while the dialog is closed. Two-way,
     *  because every way out — the `✕`, Escape, a press outside — has to end
     *  with this and the dialog agreeing rather than one of them left behind. */
    page?: string | null;
    /** The pages, in the order they are drawn. Their words are the product's:
     *  the obligation is German and the about follows the page's language, and
     *  neither is a decision a shared file gets to make. */
    pages: LegalPage[];
    /** The accessible name of the corner `✕`. Required, for §6.0's reason. */
    closeLabel: string;
    /** vorlaut's `#legal` is 520px by an **id** selector, and the comment above
     *  that rule says the id is load-bearing. Hence a prop, and hence the same
     *  prop on the sheet underneath. */
    id?: string;
    /** Forwarded to the sheet underneath, for the same reason it takes them:
     *  the suites are built on ids. mitreden adopted this component and lost
     *  `#infoclose` and `#infobody`, which it had been writing onto the frame
     *  by hand until `Sheet` grew the props — so a component that wraps `Sheet`
     *  and does not forward them hands back the problem those props solved. */
    closeId?: string;
    bodyId?: string;
    /** Lands on the `<dialog>`. */
    class?: string;
    /** Called once, however it closed. */
    onclose?: () => void;
    /** One page's prose, drawn for each key in turn. */
    children: Snippet<[string]>;
  } = $props();

  let body: HTMLElement | undefined = $state();

  const current = $derived(pages.find((one) => one.key === page));

  /* Reading `page` is the subscription: a different page is a different scroll
     position to throw away, and closing is not. */
  $effect(() => {
    if (page && body) body.scrollTop = 0;
  });
</script>

<Sheet
  open={page !== null}
  {id}
  class={extra}
  {closeLabel}
  {closeId}
  {bodyId}
  title={() => current?.title ?? ''}
  bind:body
  onclose={() => {
    page = null;
    onclose?.();
  }}
>
  {#each pages as one (one.key)}<section id={one.id} hidden={one.key !== page}
      >{@render children(one.key)}</section
    >{/each}
</Sheet>
