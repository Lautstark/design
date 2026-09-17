<script lang="ts">
  /**
   * The foot of the page: who publishes this, and the three pages a German site
   * has to carry. conventions.md §6.12.
   *
   * `components.css` has drawn `.footer`, `.footer a` and `.linklike` since the
   * footer joined it — on evidence, and the evidence is in that file's own
   * comment: design.md's audit called the two footers "not comparable", then
   * mitreden's rewrite grew legal pages, needed one after all, and built it by
   * copying bildhaft's values with a comment saying so. What was left over
   * afterwards is what is here: the landmark, and the one line above the links.
   *
   * ## The shell is shared and the content is not
   *
   * Every word in a footer is the product's. bildhaft's attribution line is a
   * licence condition and follows the source in force; mitreden's three buttons
   * open three dialogs and its fourth link does not exist; vorlaut has four, one
   * of which is an anchor through its own outward-link guard. What a footer may
   * claim is governed by "prose that denies must also disclose" (§4.3), which
   * is not a rule a shared component can keep on a product's behalf. So the
   * links arrive as children, drawn by the product, in the product's order.
   *
   * ## The links are not wrapped, for §6.3's reason
   *
   * bildhaft puts its four in a `<p class="footer__links">` with a 14px flex
   * gap; mitreden and vorlaut put their buttons straight into the `<footer>`
   * and let `text-align: center` and the word space between them do the work.
   * A wrapper here would either nest two in bildhaft or move the other two by
   * ten pixels each, in two products whose footers are photographed at a
   * tolerance of zero. The same seam the sidebar's sections are: the product
   * draws its own row, and bildhaft passes its `<p>` inside the snippet.
   *
   * ## The credit is a string, and an empty one draws nothing
   *
   * It is one line of text — bildhaft's `provider().attribution`, which follows
   * the Sammlung's own source — rather than markup, so a string is what it is.
   * That also lets the `{#if}` stay where bildhaft has it: the product's
   * attribution is empty while no source is in force, and an empty paragraph
   * above the links is a row of air in a footer measured in single pixels. The
   * same argument §6.2 makes about the panel's empty state span, in a footer
   * that is photographed.
   *
   * ## `.footer__credit` keeps its name and gains one declaration
   *
   * The class has no rule anywhere — not in `components.css`, not in bildhaft's
   * own stylesheet — and its 4px of separation is an inline style on the
   * element. It is nonetheless load-bearing twice over: it is a live e2e
   * locator (`collection-source.spec.ts`), and the footer it sits in is in a
   * visual baseline. So it is not "cleaned up" on the way in. The margin moves
   * from the inline style into this component's scoped block, which is the same
   * four pixels arriving by the mechanism §4.12 gives a shared component for
   * carrying its own arrangement — and `components.css` still draws nothing for
   * it, which is correct: one product has an attribution obligation and the
   * shared sheet should not imply three do.
   */
  import type { Snippet } from 'svelte';

  let {
    id,
    class: extra,
    credit,
    children,
  }: {
    id?: string;
    /** Appended to `.footer`, for a product that aims its own rules at this
     *  element — bildhaft's 840px column is written `footer.footer`, which
     *  still matches, but a product wanting a modifier has one. */
    class?: string;
    /** The line above the links. bildhaft's symbol-source attribution, which is
     *  a licence condition rather than a courtesy and follows the Sammlung's
     *  own source — which makes it the page's plainest statement of which
     *  source drew what is on it. Empty, or left off by the two products that
     *  have nothing to attribute, and then no paragraph is drawn at all. */
    credit?: string;
    /** The links, in the product's order, with the product's words. */
    children?: Snippet;
  } = $props();
</script>

<footer {id} class={extra ? `footer ${extra}` : 'footer'}
  >{#if credit}<p class="footer__credit">{credit}</p>{/if}{@render children?.()}</footer
>

<style>
  /* Exactly the inline style it replaces. See the head of this file for why
     this one class is drawn here rather than in components.css. */
  .footer__credit {
    margin: 0 0 4px;
  }
</style>
