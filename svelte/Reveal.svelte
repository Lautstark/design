<script lang="ts">
  /**
   * What brings the column back once it has been put away. conventions.md §6.3.
   *
   * ## A container, not a button
   *
   * This is the entry where the names move and where the move is not a rename.
   * bildhaft's `.rail` is the *reveal* affordance and mitreden's `.rail` is the
   * *column*, so the shared spelling is `.sidebar` for the column and `.reveal`
   * for this. But bildhaft's is a **flex container holding two children** — the
   * `☰` and a small logo — and mitreden's and vorlaut's are the same shape: a
   * control, then the mark, because with the column gone there is nothing else
   * on screen carrying it. So the component is the container and the pair
   * inside it is the product's, handed the wiring for its own button.
   *
   * It floats in the corner the sidebar vacated, which is where all three put
   * it and where the eye is already looking for it.
   *
   * ## It knows the breakpoint, and it has to
   *
   * Below 820px there is nothing to reveal: the sidebar is a layer rather than
   * a column, the top bar's `☰` is the way back, and this would be a second
   * mark beside the one already in the bar. All three products say that in a
   * media query of their own, and the rule has to live here instead — a scoped
   * `.reveal { display: flex }` is 0-2-0 and would out-specify a product's
   * `@media { .reveal { display: none } }` at 0-1-0, which is §6.0's caveat
   * pointing the way round people expect least.
   *
   * ## `[hidden]` is restored for vorlaut's reason
   *
   * Its stylesheet carries the comment: `[hidden]` is a UA rule and loses to
   * the class above it, so the reveal stayed on screen beside the sidebar —
   * two marks at once, which is what it looked like. The scoped rule here
   * carries the hash and cannot lose.
   */
  import type { Snippet } from 'svelte';
  import type { Wired } from './sidebar.js';

  let {
    id,
    controls,
    shown = false,
    brand,
  }: {
    /** `#reveal` and `#sidebarShow`, both named in e2e. */
    id?: string;
    /** The sidebar's id, for the product's button's `aria-controls`. */
    controls?: string;
    /** Whether the column is put away. Bind `Sidebar`'s `showing` and negate
     *  it, or pass the remembered preference — the component drops itself below
     *  the breakpoint either way, where that preference does not apply. */
    shown?: boolean;
    /** The control and the mark. Handed the wiring for the control. */
    brand?: Snippet<[Wired]>;
  } = $props();

  const wired = $derived<Wired>({ 'aria-controls': controls, 'aria-expanded': false });
</script>

<div {id} class="reveal" hidden={!shown}>{@render brand?.(wired)}</div>

<style>
  /* `z-index` is not here: 20 in two products and 21 in the third, and it is a
     fact about the product's own layers. Nor is anything about what is inside,
     which is the product's markup and carries the product's scope. */
  .reveal {
    position: fixed;
    top: 14px;
    left: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .reveal[hidden] {
    display: none;
  }

  /* Nothing to reveal down here; the bar's ☰ is the way back. Written in the
     component because a product's copy of it would lose on specificity — see
     the head of this file. The literal query rather than `NARROW`: a CSS file
     cannot read a JavaScript constant, which is the whole reason that constant
     is exported for the product's stylesheet to be written against. */
  @media (max-width: 820px) {
    .reveal {
      display: none;
    }
  }
</style>
