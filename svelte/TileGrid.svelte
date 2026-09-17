<script lang="ts">
  /**
   * The grid a row of `<Tile>`s sits in. conventions.md §6.4.
   *
   * `.picker__grid` is components.css's since this component landed; what is
   * here is the one figure the two products differ on, as a prop rather than a
   * second rule. wochenwerk's tiles are 84px at their narrowest and 56px in its
   * tight variant, bildhaft's 102px because its tiles hold an 82px picture.
   *
   * The margin above the grid is not here and is not a prop: it belongs to the
   * page that puts the grid under something.
   */
  import type { Snippet } from 'svelte';

  let { id, min, class: extra, children, ...rest }: {
    id?: string;
    /** The narrowest a tile may be before the row wraps — any CSS length.
     *  Left off, components.css's 84px. */
    min?: string;
    /** Appended, for the product that has a variant of its own. */
    class?: string;
    children?: Snippet;
    /* Everything else lands on the grid: `aria-label` where the grid is a
       named region, and the data attributes a product hangs its own behaviour
       off. A grid of pictures is furniture, and furniture should not have an
       opinion about what a page wants to call it. */
    [key: string]: unknown;
  } = $props();
</script>

<div
  {...rest}
  {id}
  class={extra ? `picker__grid ${extra}` : 'picker__grid'}
  style={min ? `--tile-min: ${min}` : undefined}
>{@render children?.()}</div>
