<script lang="ts">
  /**
   * One folded panel in a column of them. conventions.md §6.2.
   *
   * `components.css` has drawn `.panel`, its summary, the `.section` and
   * `.state` spans and `.panel > .body` since the panel went in, so there is no
   * `<style>` here: this component is the markup all four products were
   * retyping around rules they already shared.
   *
   * ## `open` is two-way, and a one-way prop is a silent correctness bug
   *
   * `name="settings"` is the platform's own accordion, and opening one panel
   * makes the browser **remove another's `open` attribute directly**. Svelte
   * never sees that happen. The caller's state still says the panel is open, so
   * on reopen it sets it true again, `set_attribute` short-circuits because its
   * own record already says `true`, no write reaches the DOM, and the sheet
   * comes back with everything folded.
   *
   * So `open` is `$bindable` and is written back from `ontoggle`. "The re-fold
   * belongs to the caller" is a correct allocation resting on a false premise
   * about what a caller can do — and the caller does still own arrival state,
   * which §3.11 settles: Sprache first and the only one open.
   *
   * ## The body takes a class
   *
   * Four spellings today — `.panel__body`, `.body`, `.setting` — and the two
   * outliers are not carrying padding, they are carrying **layout**:
   * wochenwerk's body is a grid with a 10px gap and vorlaut's a flex column
   * with 6px, and in vorlaut that gap is the only vertical separation most
   * bodies have, because the rules beneath it deliberately zero every margin.
   * A gap cannot move into `components.css` either — mitreden chose child
   * margins instead and has a comment saying so, and bildhaft has no panel rule
   * at all. Two products want a gap and two do not, so the class is appended
   * and each product keeps its arrangement under its own name.
   *
   * ## The state span is drawn only when there is a state
   *
   * Both shapes are in the family today and the difference is measurable, so
   * this follows the markup rather than tidying it. wochenwerk's and bildhaft's
   * last panels carry `<span class="state"></span>` with nothing in it;
   * mitreden's danger panel and three of vorlaut's carry no span at all, each
   * with a comment saying why.
   *
   * Below 560px `.panel > summary` is a two-column grid, `.state` is forced to
   * `grid-column: 1` and therefore onto a second row, and the row `gap` is 2px.
   * So an empty span is not a no-op: it is a second row of nothing and two
   * pixels of summary, on every panel whose state is unknowable. Drawing it
   * unconditionally would move four panels in two products that have
   * tolerance-zero baselines, for no gain. `undefined` means no span; `''`
   * means an empty one, which is what the two products passing it already draw.
   */
  import type { Snippet } from 'svelte';

  let {
    id,
    stateId,
    sectionId,
    bodyId,
    section,
    state,
    group = 'settings',
    current,
    open = $bindable(false),
    class: extra,
    children,
  }: {
    /** The `<details>`'s id. A prop because the suites are built on ids —
     *  vorlaut's `settings_panels.test.ts` reads the markup as *text* and
     *  matches `/id="(\w+Panel)"/`, and mitreden's visual baselines mask by id.
     *  A component that cannot emit one breaks the masks, which is worse than
     *  breaking a test: an unmasked clock makes a baseline flaky, not red. */
    id?: string;
    /** The id of the `.state` span. `#voicestate`, `#azurestate` and
     *  `#datastate` are mitreden's mask locators. */
    stateId?: string;
    /** The id of the `.section` span, and of the `.body`. Added after
     *  vorlaut-editor adopted the panel and found five locators with nowhere to
     *  go — four on the heading, one on the body. Four were test hooks, which
     *  is reason enough on §6.0's argument; the fifth was not, and is the one
     *  that settled this. `#collectionLangPick` pointed an `aria-labelledby` at
     *  its heading span, so with no id the wire had to become an `aria-label`
     *  repeating the same key. That is a real accessible name rebuilt out of a
     *  missing prop, and the next one might not be noticed. */
    sectionId?: string;
    bodyId?: string;
    /** The heading. */
    section: string;
    /** The answer, in the heading — so the column reads as a list of answers
     *  rather than a scroll through everything anybody has opened. */
    state?: string;
    /** The native accordion's group. `settings` in all four products;
     *  vorlaut's second sheet is `collection`, and two exclusive groups in one
     *  product is correct — §3.5's argument is about one column at a time. */
    group?: string;
    /** Marks the panel the page is currently about. A token attribute, so
     *  `"true"` or absent is right — unlike `aria-pressed`, which
     *  `components.css` selects as `[aria-pressed="true"]` and where absent and
     *  `"false"` are semantically different. */
    current?: boolean;
    /** Two-way. See above: the browser writes this one behind Svelte's back. */
    open?: boolean;
    /** Appended to `.body`, for the product that arranges its own. */
    class?: string;
    children?: Snippet;
  } = $props();
</script>

<details {id} class="panel" name={group} bind:open>
  <summary aria-current={current ? 'true' : undefined}
    ><span class="section" id={sectionId}>{section}</span>{#if state !== undefined}<span
        class="state"
        id={stateId}>{state}</span
      >{/if}</summary
  >
  <div id={bodyId} class={extra ? `body ${extra}` : 'body'}>{@render children?.()}</div>
</details>
