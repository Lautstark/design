<script lang="ts">
  /**
   * Light, dark, or whatever the machine is set to. conventions.md §6.10.
   *
   * Four near-identical implementations over one shared runtime
   * (`@lautstark/design/theme`), and three of the four carry a near-identical
   * comment arguing `role="group"` over `radiogroup` — which is the strongest
   * evidence in the whole audit that a control is ready to be shared. The
   * argument, kept because it is the reason the markup looks like this:
   * `.segmented` marks its choice with `aria-pressed`, which is the vocabulary
   * bildhaft's print dialog already uses, and a radiogroup whose children are
   * not radios reads worse than a labelled group of buttons.
   *
   * ## The three props are the three things the four differ on
   *
   * The storage key, the label lookup, and — through `bind:theme` — the text
   * the panel's summary shows. The third is a binding rather than a string
   * because it is derived from the other two: the summary says `label(theme)`,
   * and the panel around this control is the product's, so the value has to
   * reach it rather than be drawn here. Four products draw that panel with
   * different other things inside it (a note, a second control), which is why
   * this component is the group and not the panel.
   *
   * ## What adopting this does not include, and must
   *
   * `initTheme(key)` is what subscribes to the operating system's preference
   * and repaints the browser chrome. wochenwerk's calendar page carries the
   * boot snippet inline and verbatim — the board next door deliberately does
   * not, being a display on a wall committed to dark — but never calls
   * `initTheme`, so nothing follows the machine changing its mind and the
   * chrome paint never runs. That is an entry-point call and no component
   * mounted inside a settings sheet can make it.
   */
  import { applyTheme, readTheme, saveTheme, THEMES, type Theme } from '../docs/lib/theme.js';

  let {
    key,
    label,
    ariaLabel,
    id,
    theme = $bindable(readTheme(key)),
    onchange,
  }: {
    /** Where the choice is kept. One per product. */
    key: string;
    /** The three words, in the product's language. Named rather than
     *  translated is the language picker's rule and not this one — a scheme
     *  has a name in every language the family reads. */
    label: (theme: Theme) => string;
    /** The group's accessible name. Three unlabelled words otherwise, which is
     *  what every one of the four passes its own `t('panel_theme')` for. */
    ariaLabel: string;
    id?: string;
    /** The choice in force. Bind it to draw `label(theme)` in the panel's
     *  summary. */
    theme?: Theme;
    /** For the product that has something else to do with the answer. */
    onchange?: (theme: Theme) => void;
  } = $props();

  function pick(one: Theme): void {
    saveTheme(key, one);
    applyTheme(one);
    /* Nothing else on the page depends on the scheme — the tokens do that
       work, which is the point of there being tokens. */
    theme = one;
    onchange?.(one);
  }
</script>

<div class="segmented" {id} role="group" aria-label={ariaLabel}
  >{#each THEMES as one (one)}<button
    type="button"
    aria-pressed={one === theme}
    onclick={() => pick(one)}>{label(one)}</button
  >{/each}</div
>
