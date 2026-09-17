<script lang="ts">
  /**
   * The page behind the drawer, and the way out of it. conventions.md §6.3.
   *
   * ## It is a focusable `<button>`, and the argument is consistency
   *
   * Not necessity, and §6.3 corrects its own first draft on that: the claim
   * that mitreden had been "bitten by a layer with no way out" cited the wrong
   * comment. That one argues for **keeping the `✕`**, which mitreden has and
   * draws on narrow only; its scrim comment argues deliberately for a `<div>`.
   * bildhaft's is a `<button aria-label>`, vorlaut's a `role="presentation"`
   * div, and one of the three has to move. The button moves the fewest things
   * and is the one a keyboard can reach.
   *
   * ## Two costs, both paid here rather than waved
   *
   * **`border` is reset**, and that is not tidiness. mitreden's `.scrim` rule
   * has no `border` declaration, and with `box-sizing: border-box` a `<button>`
   * picks up the user agent's `border: 2px outset ButtonBorder` — which on an
   * element at `inset: 0` draws a frame around the whole viewport. bildhaft's
   * rule has `border: none` and mitreden's does not. No test in any of the
   * three would catch it: the one that exists clicks a position, and a position
   * inside a two-pixel border is still inside the scrim. Found by inspection,
   * and the reset is in this file so it cannot be left out of an adoption.
   *
   * **`[hidden]` is restored.** The UA's `[hidden] { display: none }` is a
   * type-less 0-1-0 rule that loses to any `.scrim { display: … }` a product
   * has, and vorlaut has a comment saying exactly that about this element and
   * the reveal beside it. The scoped rule here carries the hash and cannot
   * lose, which is the one direction §6.0's caveat runs in favour.
   *
   * ## What is not here
   *
   * `z-index`, and `display` outside the `[hidden]` case. The stacking is 19 in
   * two products and 55 in the third, and it is a fact about the product's own
   * layers rather than about a scrim. A product adopting this drops the
   * `display: none` base it used to switch on: `shown` is what answers that
   * question now, and two answers to it is how a scrim ends up over a page
   * nobody asked to cover.
   */
  let {
    id,
    label,
    shown = false,
    ondismiss,
  }: {
    /** `#scrim` in two of the three, and named in a stylesheet in both. */
    id?: string;
    /** The accessible name. A button with nothing in it has none otherwise, and
     *  this one is the size of the window. */
    label: string;
    /** Whether the drawer it belongs to is up. */
    shown?: boolean;
    /** Pressed, or reached with a keyboard and pressed. The same thing the
     *  drawer's `✕` does — one dismissal, two ways to it. */
    ondismiss?: () => void;
  } = $props();
</script>

<button
  {id}
  class="scrim"
  type="button"
  hidden={!shown}
  aria-label={label}
  onclick={() => ondismiss?.()}
></button>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.45);
    /* The reset. See the head of this file: without it the user agent draws a
       two-pixel outset frame around the viewport, and nothing goes red. */
    border: 0;
    padding: 0;
    margin: 0;
  }

  /* Ahead of whatever the product's own `.scrim` says about display, which
     `[hidden]` alone would lose to. */
  .scrim[hidden] {
    display: none;
  }
</style>
