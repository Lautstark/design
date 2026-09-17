<script lang="ts">
  /**
   * The `⋯` that opens a menu. conventions.md §6.10.
   *
   * Eleven call sites across four products and seven distinct class strings.
   * bildhaft's `ActionMenu` is the complete one and is the one promoted; two
   * things come with it and neither is bildhaft's.
   *
   * **The ARIA is in the markup, from the first paint.** `menuOn` sets
   * `aria-haspopup` and `aria-expanded` when it first opens, which leaves
   * wochenwerk's two triggers correct only after the first press — and a
   * trigger that does not say it opens a menu until it has opened one is a
   * trigger nobody was told about.
   *
   * **The collision handling is vorlaut's**, in `./fit.js`: the only
   * implementation that flips the anchor upwards and caps the height so a long
   * list stays inside a sheet body.
   *
   * ## The anchor is a prop
   *
   * `menuOn` appends the list to the trigger's parent and `.menu-anchor` is
   * what positions it, so something has to draw one — but not always this. In
   * wochenwerk the `Row` provides it, and a promoted component that anchored
   * itself unconditionally would nest two, which is a `position: relative`
   * inside a `position: relative` and a list hung off the wrong one.
   */
  import type { Snippet } from 'svelte';
  import { menuOn, type AddItem } from '../docs/lib/menu.js';
  import { fit } from './fit.js';

  let {
    label,
    build,
    anchor = true,
    id,
    class: extra = 'btn quiet icon',
    children,
  }: {
    /** The trigger's accessible name, and its tooltip. A `⋯` has no text to
     *  read, so this is the only thing naming it. */
    label: string;
    /** Called with an `add(label, run, opts)` each time the menu opens, so the
     *  items are built from what is true now rather than from what was true
     *  when the row was drawn. */
    build: (add: AddItem) => void;
    /** Draw the `.menu-anchor`. False where the host already supplies one. */
    anchor?: boolean;
    id?: string;
    /** The trigger's classes. `.btn.quiet.icon` is bildhaft's and the one the
     *  audit settled on; a product that draws its ⋯ differently says so here
     *  rather than wrapping this. */
    class?: string;
    /** The glyph. `⋯` by default, which is what three of the four draw;
     *  bildhaft passes its own icon. */
    children?: Snippet;
  } = $props();

  let trigger: HTMLButtonElement;

  function open(): void {
    // menuOn toggles on aria-expanded, so a second press is a dismissal
    // without this file tracking whether anything is open.
    menuOn(trigger, build);
    /* After menuOn, which is what put the list in the anchor. Where the host
       supplies the anchor, `closest` is how this finds it — the list is
       appended to the trigger's parent either way. */
    const box = trigger.closest<HTMLElement>('.menu-anchor');
    if (box) fit(box, trigger);
  }
</script>

{#snippet control()}
  <button
    bind:this={trigger}
    {id}
    class={extra}
    type="button"
    aria-haspopup="menu"
    aria-expanded="false"
    aria-label={label}
    title={label}
    onclick={open}>{#if children}{@render children()}{:else}⋯{/if}</button
  >
{/snippet}

{#if anchor}<div class="menu-anchor">{@render control()}</div>{:else}{@render control()}{/if}
