<script lang="ts">
  /**
   * The one dialog idiom. conventions.md §6.1.
   *
   * `.sheet` and its head/body/foot anatomy are components.css's and the
   * behaviour underneath is `@lautstark/design/dialog`; this is the markup,
   * which mitreden and vorlaut had between them in six hand-written copies.
   *
   * ## What the six copies were doing differently, and which answer wins
   *
   * **The ✕ is `.btn.icon`**, which is what `@lautstark/design/dialog` has
   * always emitted. All six hand-written sheets use `.btn.quiet.icon` and three
   * of them name that as the reason they could not adopt the frame. The frame
   * wins, because converging the other way would move every sheet in the family
   * that already goes through `openDialog` — and those are not the copies being
   * replaced. Two of vorlaut's also carry a `title` attribute beside the
   * `aria-label`; that tooltip goes.
   *
   * **The heading is `<h2>`.** vorlaut's three use `<strong>` with `flex` and
   * `font-weight: 600` restored, so their headings are a genuinely different
   * size.
   *
   * **The accessible name is `aria-label`, from `title`, always.** Five of the
   * six have no accessible name at all.
   *
   * ## Two props that exist because a product reaches past the frame today
   *
   * **`title` takes a thunk.** wochenwerk's appointment sheet renames the
   * dialog as the title field is typed into, and five of its e2e cases find
   * that dialog by its *current* name. Today that survives only because
   * `handle.dialog.setAttribute` reaches past the component, which works until
   * anything re-renders the attribute. It is also what keeps vorlaut's `#legal`
   * right: one dialog with three swappable prose sections, whose heading is
   * `$derived`, so a reader that announces it says „Impressum" while the
   * Impressum is showing.
   *
   * **`head` replaces the `<h2>`**; it does not sit beside a hidden one. That
   * is the other half of what wochenwerk reaches past the frame to do, and the
   * two together are the whole of it.
   *
   * ## `class` lands on the `<dialog>` itself
   *
   * Not on a wrapper. The reason is not specificity — `dialog.sheet--page`
   * out-specifies `dialog.sheet--button` perfectly well, being a modifier on
   * the same element. It is that six of vorlaut's rules are **direct-child**
   * selectors — `.sheet--button > .body`, `.sheet--page > .body`,
   * `.sheet--button > .foot` and three more — and a wrapper breaks all six.
   */
  import type { Snippet } from 'svelte';
  /* The relative path rather than the package's own `./dialog` specifier: this
     file sits inside the package, so there is nothing for the exports map to
     resolve and a bundler never has to be asked twice. */
  import { dismissOnBackdrop } from '../docs/lib/dialog.js';

  let {
    open = $bindable(false),
    id,
    title,
    closeLabel,
    panels = false,
    wide = false,
    class: extra,
    onclose,
    dialog = $bindable(),
    body = $bindable(),
    head,
    foot,
    children,
  }: {
    /**
     * May be bound or one-way, and neither is the blessed one. Two of
     * mitreden's three sheets hold a `Page | null` and a `string | null`
     * rather than a boolean, and `bind:` cannot take a `$derived`, so they
     * pass `open={x !== null} onclose={() => x = null}`.
     */
    open?: boolean;
    /** vorlaut's `#legal` is 520px by an **id** selector, and the comment above
     *  that rule says the id is load-bearing: demoted to a class it ties with
     *  `.sheet { width: … }` and the winner becomes bundle order, which §6.0
     *  forbids relying on. Hence a prop. */
    id?: string;
    /** The heading, and the accessible name. A thunk where it changes. */
    title: string | (() => string);
    /** The accessible name of the corner ✕. **Required**, and it does not fall
     *  back to anything: vorlaut's `shell/dialog.ts` exists solely to name the
     *  two dismissals once and counts the cost of not doing so at "seventeen
     *  chances for one of them to drift, the worst count in the family". A
     *  declarative sheet has no wrapper to route through, so the products pass
     *  their own `t()`. */
    closeLabel: string;
    /** A column of `<details>`, 900px. The settings dialog in all four. */
    panels?: boolean;
    /** A grid of cards, 1060px. */
    wide?: boolean;
    /** Lands on the `<dialog>`. See above. */
    class?: string;
    /** Called once, however it closed — the ✕, Escape, a press outside, or the
     *  caller setting `open` false. */
    onclose?: () => void;
    /** The element, for the caller that has to reach it. This is what
     *  `./svelte/sheet`'s `Handle` is built out of. */
    dialog?: HTMLDialogElement;
    /** The body region, same reason. */
    body?: HTMLElement;
    /** Replaces the `<h2>`. The ✕ stays. */
    head?: Snippet;
    /** The `.foot` is drawn only when this is given. */
    foot?: Snippet;
    children?: Snippet;
  } = $props();

  const named = $derived(typeof title === 'function' ? title() : title);

  /* The one thing showModal() does not give, because a modal dialog's
     ::backdrop is a pseudo-element and takes no clicks: a press outside the
     sheet lands on the dialog itself, and only the coordinates tell it apart
     from a press on the sheet's own padding. `@lautstark/design/dialog` has
     owned that comparison since v1.9.0 and owns it here too. */
  $effect(() => {
    if (dialog) dismissOnBackdrop(dialog);
  });

  /* Shown and hidden from the prop rather than from a method, so that a caller
     holding a `Page | null` never has to remember which of the two it has.
     Guarded both ways: showModal() on an open dialog throws, and close() on a
     closed one fires a second `close` event. */
  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });

  /* One exit for every way out, because the browser fires `close` for all of
     them: the ✕, Escape, a press outside, and close() itself. */
  function closed(): void {
    open = false;
    onclose?.();
  }
</script>

<!-- No role and no aria-modal: a <dialog> shown with showModal() already has
     both, and writing them again is how an element ends up announced twice. -->
<dialog
  bind:this={dialog}
  {id}
  class="sheet{panels ? ' panels' : ''}{wide ? ' wide' : ''}{extra ? ` ${extra}` : ''}"
  aria-label={named}
  onclose={closed}
>
  <div class="head"
    >{#if head}{@render head()}{:else}<h2>{named}</h2>{/if}<button
      class="btn icon"
      type="button"
      aria-label={closeLabel}
      onclick={() => dialog?.close()}>✕</button
    ></div
  >
  <div class="body" bind:this={body}>{@render children?.()}</div>
  {#if foot}<div class="foot">{@render foot()}</div>{/if}
</dialog>
