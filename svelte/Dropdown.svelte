<script lang="ts">
  /**
   * A preference with a handful of answers, picked the way this family picks
   * things: a button that says what is chosen and opens a menu.
   * conventions.md §6.10.
   *
   * **A `<select>` is not a dropdown**, and the rule is written in three
   * places: its open list is drawn by the operating system and is the one
   * thing on the page that cannot follow the tokens. bildhaft's METACOM
   * rendering chooser and wochenwerk's repeat picker both break it — and
   * converting them is not free anywhere. Four e2e cases across the two drive
   * them with `selectOption`, which only works against a `<select>`.
   *
   * ## `aria-labelledby`, and never a wrapping `<label>`
   *
   * The trigger's text is the *answer*, not the question, so something else
   * has to name the control. wochenwerk's existing call site wraps the trigger
   * in a `<label>` — which does not label a `<button>`, so `getByLabel` finds
   * nothing there today and that call site is not a template, it is the same
   * latent defect untested.
   *
   * ## `.field` or `.btn`
   *
   * `.dropdown` asks nothing of either: it sets a custom property and an
   * `::after`, and both work on whatever they are put on. `.btn.dropdown` is as
   * wide as the word on it, which is right for a picker standing on its own in
   * a settings panel. In a column of questions it is wrong — the fields above
   * and below are full width, so a trigger that stops after „Wort" leaves four
   * controls reading as four kinds of thing with no left edge to follow down.
   * vorlaut's own comment asks for this to become a named variant "the next
   * time a second product wants a dropdown inside a form"; `field` is that
   * variant, and the geometry stays in the two shared classes rather than
   * being restated here.
   */
  import { menuOn, type AddItem } from '../docs/lib/menu.js';
  import { fit } from './fit.js';

  let {
    label,
    build,
    id,
    labelledBy,
    describedBy,
    ariaLabel,
    field = false,
    start = false,
    anchor = true,
    class: extra,
  }: {
    /** What is chosen, on the trigger. Read from the answer rather than kept
     *  as a second copy: the first version of this shape shipped a trigger
     *  that went on naming the answer somebody had just switched away from. */
    label: string;
    build: (add: AddItem) => void;
    id?: string;
    /** The id of the element that asks the question. */
    labelledBy?: string;
    describedBy?: string;
    /** Where there is no element to point at. One of these two, always: a
     *  control whose only text is its current answer has no name otherwise. */
    ariaLabel?: string;
    /** Draw it as a field rather than as a button. See above. */
    field?: boolean;
    /** Hang the list leftward off the trigger, which is what a control at the
     *  left of a form column wants; the default suits the ⋯ at the right edge
     *  of a row. */
    start?: boolean;
    /** Draw the `.menu-anchor`. False where the host supplies one. */
    anchor?: boolean;
    /** Appended to the trigger. */
    class?: string;
  } = $props();

  let trigger: HTMLButtonElement;

  function open(): void {
    menuOn(trigger, build);
    const box = trigger.closest<HTMLElement>('.menu-anchor');
    if (box) fit(box, trigger);
  }
</script>

{#snippet control()}
  <button
    bind:this={trigger}
    {id}
    class="{field ? 'field' : 'btn'} dropdown{extra ? ` ${extra}` : ''}"
    type="button"
    aria-haspopup="menu"
    aria-expanded="false"
    aria-labelledby={labelledBy}
    aria-describedby={describedBy}
    aria-label={ariaLabel}
    onclick={open}>{label}</button
  >
{/snippet}

{#if anchor}
  <span class="menu-anchor{start ? ' start' : ''}">{@render control()}</span>
{:else}{@render control()}{/if}
