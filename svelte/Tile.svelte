<script lang="ts">
  /**
   * One labelled picture button. conventions.md §6.4.
   *
   * ## `aria-pressed` is a prop and not a default
   *
   * wochenwerk's tile toggles — pressing it puts the symbol in the appointment
   * and pressing it again takes it out — so it carries `aria-pressed` and
   * should. bildhaft's does not toggle: pressing it closes the dialog and hands
   * back an answer, and `aria-pressed` on a control that never comes back
   * announces a state it does not have. Two products, two correct answers, and
   * the marking of the chosen tile is the same in both — which is why
   * `.picker__item--active` is a class rather than `[aria-pressed="true"]`,
   * unlike `.chip`.
   *
   * Where the tile does toggle, the attribute takes the boolean expression
   * rather than a `? "true" : "false"` ternary. Svelte compiles
   * `aria-pressed={x}` to `set_attribute`, which removes only on `null`, so
   * `false` becomes the string `"false"` and the DOM is identical to the
   * ternary's. vorlaut's ternary exists as a guard against a vanilla helper
   * writing a bare attribute, which Svelte markup cannot do.
   */
  import type { Snippet } from 'svelte';

  let {
    label,
    active = false,
    toggle = false,
    title,
    onclick,
    class: extra,
    children,
    ...rest
  }: {
    /** The word under the picture, and the tile's accessible name — the
     *  picture inside it is decorative, because the label is already saying
     *  what it is. */
    label: string;
    /** The stored choice, or the one in force. Drawn either way. */
    active?: boolean;
    /** This tile toggles rather than answers, so it says so. See above. */
    toggle?: boolean;
    /** The tooltip. Defaults to the label, which is what wochenwerk does and
     *  is the point of having one at all: the label is elided when it is too
     *  long for the tile, and the tooltip is where the whole of it still is. */
    title?: string;
    onclick?: (event: MouseEvent) => void;
    /** Appended. wochenwerk's dashed empty slot is `picker__item--add`. */
    class?: string;
    /** The picture. */
    children?: Snippet;
    /* The rest lands on the button — wochenwerk's `data-move`, which its own
       stylesheet turns into a grab cursor and a `touch-action`, and whatever
       the next product hangs its own behaviour off. */
    [key: string]: unknown;
  } = $props();
</script>

<button
  {...rest}
  class="picker__item{active ? ' picker__item--active' : ''}{extra ? ` ${extra}` : ''}"
  type="button"
  title={title ?? label}
  aria-pressed={toggle ? active : undefined}
  {onclick}>{@render children?.()}<span class="small">{label}</span></button
>
