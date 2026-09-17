<script lang="ts">
  /**
   * The column of Sammlungen down the side of the page. conventions.md §6.3.
   *
   * Three consumers, not four: wochenwerk has no sidebar and no Sammlung, and
   * the `.rail` in it is a decorative `aria-hidden` daypart strip that shares
   * the name and nothing else.
   *
   * ## What this owns, and the four things it deliberately does not
   *
   * It owns the `<aside>`, the brand row, the drawer's `✕`, the foot, the
   * `aria-expanded`/`aria-controls` wiring, and the 820px breakpoint — which is
   * a live `matchMedia` subscription rather than a number read once, because
   * the answer changes under a window being dragged between two screens.
   *
   * **The section seam is one snippet, not three.** The first draft of §6.3 had
   * `above`/`primary`, and bildhaft is why that is wrong: the `<h2>` is part of
   * what a search swaps — „Sammlungen" becomes *n* Treffer — so a
   * component-owned heading would have to be swapped by a component that does
   * not know about searching; and a component-owned wrapper around the first
   * section leaves an empty section and a 20px gap while the search is running.
   * It also keeps bildhaft's `.sidebar__section--words` / `--collections`,
   * which have no CSS rule at all and exist purely so ten e2e selectors can
   * tell the two lists of rows apart.
   *
   * **`search` is rendered bare, for the same reason.** The two products that
   * have one wrap it in their own name — `.rail__part` and `.sidebar__section`
   * — so a wrapper here would nest two. What the separate snippet buys is
   * order: the field sits above whatever a search *replaces*, and must not be
   * swapped out with it.
   *
   * **The collapse control is the product's.** In bildhaft it lives inside the
   * brand row as its third flex child, so a component-owned chevron and a
   * product-owned `brand` cannot both be true. The brand snippet is handed the
   * wiring instead — `{...wired}` onto its own button — which is the half a
   * product cannot work out for itself, because it is about an element in here.
   *
   * **No component owns the body.** mitreden's `--sidebar-w` is consumed by a
   * rule on `<body>`, and the collapsed state is a class on `<body>` in two
   * products and on a wrapper in the third. Those stay the product's; what
   * `collapsed` does here is decide what the controls announce.
   *
   * ## The element is `<aside>`
   *
   * bildhaft locates it by `getByRole('complementary')`, which is the kind of
   * locator that fails as a timeout rather than as a diff.
   *
   * ## The `✕` is drawn only below 820px
   *
   * Which is what all three products' stylesheets already say, by id —
   * `@media (min-width:821px){ #railclose { display:none } }` and vorlaut's
   * `#sidebarClose` beside it. It is expressed here as markup because this
   * component knows the breakpoint anyway, and a control that is not on screen
   * is better absent than hidden: the brand row is the only head on screen
   * while the drawer covers the bar, and mitreden's comment records what
   * happened the time the row was hidden instead — a layer with no way out but
   * the scrim. The product's own collapse control is the mirror image and stays
   * the product's: it collapses a column, and below 820px there is no column.
   *
   * ## Its style block, and what it may not contain
   *
   * `components.css` draws no `.sidebar` rule — none of `.scrim`, `.reveal` or
   * `.topbar` either — so unlike the sheet and the panel this component has no
   * shared vocabulary to emit against and its own layout lives here. §6.0's
   * caveat runs in the direction people expect least: a scoped selector carries
   * the hash class, so it is 0-2-0 and **beats** a product's plain `.sidebar` at
   * 0-1-0 wherever the two overlap. So only the declarations all three already
   * agree on are here, character for character, and everything a product varies
   * — the placement (fixed column, grid column), the width, the overflow, the
   * transform the drawer slides on, every `z-index` — is left out. Where a
   * product must win on one of the shared declarations it wins by specificity,
   * `aside.sidebar`, and not by hoping its stylesheet is emitted later.
   */
  import type { Snippet } from 'svelte';
  import { NARROW } from './sidebar.js';
  import type { Wired } from './sidebar.js';

  let {
    id,
    label,
    closeLabel,
    closeId,
    drawer = false,
    collapsed = false,
    showing = $bindable(false),
    ondismiss,
    brand,
    search,
    sections,
    foot,
  }: {
    /** The `<aside>`'s id, and what the reveal and the top bar point
     *  `aria-controls` at. mitreden's is `rail`, vorlaut's `sidebar`. */
    id?: string;
    /** The accessible name of the column. Three products, three words for the
     *  same list, and none of them belongs in a shared file. */
    label?: string;
    /** The accessible name of the drawer's `✕`. Required for `closeLabel`'s
     *  reason under §6.0: vorlaut's `shell/dialog.ts` exists solely to name the
     *  two dismissals once, and counts the cost of not doing so at "seventeen
     *  chances for one of them to drift". */
    closeLabel: string;
    /** The `✕`'s id. `#railclose` and `#sidebarClose` are both named in a
     *  stylesheet and in e2e. */
    closeId?: string;
    /** The drawer, below 820px: a layer over the work, and whether it is up.
     *  A moment rather than a preference — closing the tab closes it. */
    drawer?: boolean;
    /** The column, above 820px: put away for good, and remembered (§1.3).
     *  **Ignored below the breakpoint, not consulted** — a sidebar put away on
     *  a laptop must not arrive on a phone as a drawer that will not open. */
    collapsed?: boolean;
    /** Out, not in: whether the column or the drawer is actually on screen,
     *  given the live breakpoint. Bind it to hand the same answer to `Reveal`
     *  and `TopBar`, which are mounted elsewhere in the page and cannot see it.
     */
    showing?: boolean;
    /** The `✕` was pressed. Only ever the drawer — see above. */
    ondismiss?: () => void;
    /** The mark, and the product's own collapse control. Handed the wiring for
     *  that control, because it is the one part of it that is about an element
     *  in here. */
    brand?: Snippet<[Wired]>;
    /** Above the sections, and not swapped out with them. No wrapper: the two
     *  products that have one call it different things. */
    search?: Snippet;
    /** Every section, wrappers and headings included. One snippet, because the
     *  heading is part of what a search swaps. */
    sections?: Snippet;
    /** The way out of the page — Einstellungen, §3.2 — pushed to the bottom of
     *  the column by `margin-top: auto`. */
    foot?: Snippet;
  } = $props();

  /* Live, not read once. All three products compute this in a helper called on
     each press instead, which answers correctly at the moment of the press and
     leaves whatever was announced before it stale. */
  let narrow = $state(false);
  $effect(() => {
    const query = matchMedia(NARROW);
    const moved = (): void => { narrow = query.matches; };
    moved();
    query.addEventListener('change', moved);
    return () => query.removeEventListener('change', moved);
  });

  /* The remembered collapse is not consulted below the breakpoint. Down there
     the only question is whether the drawer is up. */
  $effect(() => {
    showing = narrow ? drawer : !collapsed;
  });

  const wired = $derived<Wired>({ 'aria-controls': id, 'aria-expanded': showing });

  /* Escape, and the focus round trip. §6.3 promised both and the first build
   * shipped neither; mitreden adopted the component, found them missing and
   * declined to write a product-local copy, which was right — a copy in one of
   * three products is the divergence this extraction exists to end.
   *
   * Only while the drawer is up, and only down there. Above the breakpoint the
   * column is furniture: Escape belongs to whatever the person is actually
   * working in, and stealing it from a sheet or a menu would be worse than not
   * having it.
   *
   * `keydown` on the window rather than on the `<aside>`, because the point is
   * the press that arrives while focus is *anywhere* — the scrim, the work
   * behind it, the rows themselves. A listener on the column only answers
   * presses the column already has. */
  let closer: HTMLButtonElement | undefined = $state();
  let opener: Element | null = null;

  $effect(() => {
    if (!narrow || !drawer) return;
    const pressed = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      ondismiss?.();
    };
    window.addEventListener('keydown', pressed);
    return () => window.removeEventListener('keydown', pressed);
  });

  /* Focus in when it opens, and back to whatever opened it when it closes.
   *
   * The `✕` is the target rather than the first row: it is the way out, which
   * is what somebody who has just been handed a layer needs to be able to find,
   * and Tab from there reaches the list in one press. Restoring is guarded on
   * the opener still being in the document — a press that both opens the drawer
   * and removes its own button is unlikely and would otherwise throw. */
  $effect(() => {
    if (!narrow || !drawer) return;
    opener = document.activeElement;
    closer?.focus();
    return () => {
      const back = opener;
      opener = null;
      if (back instanceof HTMLElement && back.isConnected) back.focus();
    };
  });
</script>

<aside {id} class="sidebar{drawer ? ' open' : ''}" aria-label={label}>
  <div class="sidebar__brand"
    >{@render brand?.(wired)}{#if narrow}<button
        bind:this={closer}
        id={closeId}
        class="btn quiet icon"
        type="button"
        aria-label={closeLabel}
        onclick={() => ondismiss?.()}>✕</button
      >{/if}</div
  >
  {@render search?.()}
  {@render sections?.()}
  {#if foot}<div class="sidebar__foot">{@render foot()}</div>{/if}
</aside>

<style>
  /* Identical in all three products, down to the order they wrote it in. What
     is not here is what differs: mitreden's is a fixed column and the other two
     are grid items, so `position`, `inset`, `width`, `overflow`, `min-height`,
     `z-index` and the transform the drawer slides on all stay the product's. */
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 16px 14px;
    background: var(--surface);
    border-right: 1px solid var(--line);
  }

  /* Also identical in all three. The `<h1>` inside it is not styled here and
     cannot be: snippet content is compiled in the product's component and
     carries the product's scope, so bildhaft's brand row — whose mark is a
     sibling of the heading rather than inside it — keeps its own rule. */
  .sidebar__brand {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 2px 4px;
  }

  /* `margin-top: auto` is what puts Einstellungen at the bottom of the column
     rather than under the list, which is the whole of §3.2's placement. The
     union of the three: `flex-wrap` is mitreden's and bildhaft's, the 4px
     inset mitreden's and vorlaut's — bildhaft's foot gains it, and gains it at
     the inset its own rows already stand at. */
  .sidebar__foot {
    margin-top: auto;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 0 4px;
  }
</style>
