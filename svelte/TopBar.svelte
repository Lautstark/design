<script lang="ts">
  /**
   * The bar narrow screens get instead of a column. conventions.md §6.3.
   *
   * Below 820px the sidebar slides over the work rather than squeezing it, and
   * something has to open it. All three products have exactly this bar, at
   * exactly this width, with exactly one control in it, in the same place, with
   * the same class and the same job — which is why the control is here and the
   * reveal's is not. What follows it differs: two draw an `<h1>` with the mark
   * in it and one draws the open Sammlung's name in a `.topbar__title`, so that
   * is the `brand` snippet.
   *
   * ## `<header>`, which is bildhaft's element
   *
   * The other two write a `<div>`. A `<header>` at the top level of the page is
   * a `banner` landmark, so this is the one product gaining something rather
   * than two losing it, and no rule in any of the three aims `div.topbar` — all
   * six selectors involved are on the class alone.
   *
   * ## It owns the breakpoint
   *
   * `display: none` here and `display: flex` below 820px, both in this file,
   * for `Reveal`'s reason turned round: a scoped `.topbar { display: none }` is
   * 0-2-0 and would out-specify the product's `@media { .topbar { display:
   * flex } }` at 0-1-0, so a product that kept its own half would get a bar
   * that never appears. §6.0's caveat, and the one place in this component
   * where getting it wrong is silent.
   *
   * ## The glyph is a snippet, the button is not
   *
   * Two products draw an inline `<svg>` of three lines and vorlaut draws `☰`.
   * The difference is an icon set, not a control: the class, the tier, the
   * label, the wiring and the place in the bar are the same three times, so
   * only what is between the tags is passed in. `☰` is the default, because a
   * product without an icon set should still get a bar that works.
   */
  import type { Snippet } from 'svelte';
  import type { Wired } from './sidebar.js';

  let {
    id,
    buttonId,
    controls,
    expanded = false,
    label,
    title,
    onreveal,
    icon,
    brand,
  }: {
    id?: string;
    /** The `☰`'s id. `#railopen` and `#sidebarOpenBtn`, both named in e2e. */
    buttonId?: string;
    /** The sidebar's id, for `aria-controls`. */
    controls?: string;
    /** Whether the drawer is up. Bind `Sidebar`'s `showing` — it is the one
     *  place the live breakpoint has already been applied. */
    expanded?: boolean;
    /** The `☰`'s accessible name. */
    label: string;
    /** Its tooltip, where a product has one. vorlaut and mitreden write the
     *  same word into both; bildhaft has only the label. */
    title?: string;
    /** Bring the drawer up. */
    onreveal?: () => void;
    /** What is inside the `☰`. Defaults to `☰`. */
    icon?: Snippet;
    /** What follows it — a mark, a heading, the open Sammlung's name. Handed
     *  the wiring, for the product that puts a second control in the bar. */
    brand?: Snippet<[Wired]>;
  } = $props();

  const wired = $derived<Wired>({ 'aria-controls': controls, 'aria-expanded': expanded });
</script>

<header {id} class="topbar"
  ><button
    id={buttonId}
    class="btn quiet icon"
    type="button"
    aria-label={label}
    {title}
    aria-controls={controls}
    aria-expanded={expanded}
    onclick={() => onreveal?.()}>{#if icon}{@render icon()}{:else}☰{/if}</button
  >{@render brand?.(wired)}</header
>

<style>
  /* `z-index` is not here — 15 in two products and 30 in the third — and nor is
     anything about what follows the button, which is the product's markup. The
     padding is mitreden's and vorlaut's 8px; bildhaft's bar loses a pixel of
     height, and it is the only declaration of the six that moves anything. */
  .topbar {
    display: none;
    position: sticky;
    top: 0;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: var(--surface);
    border-bottom: 1px solid var(--line);
  }

  /* The literal query rather than `NARROW`: a CSS file cannot read a JavaScript
     constant, which is why that constant is exported — so the product's own
     stylesheet is written against the same string and not the same memory. */
  @media (max-width: 820px) {
    .topbar {
      display: flex;
    }
  }
</style>
