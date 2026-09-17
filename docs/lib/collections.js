/*
 * The list of Sammlungen down the side: a name, how much is in it, and which
 * ones are open.
 *
 * conventions.md §5 5b, and the thinnest of the three sidebars. What is shared
 * is only the rows — not the sidebar around them, which is genuinely three
 * different objects: bildhaft's holds a search over every sentence whose
 * results replace this list, mitreden's is a drawer with a scrim below 820px,
 * vorlaut's is neither. The rows are the part all three drew the same way, down
 * to the ellipsis on a long name and the tabular figures on the count.
 *
 * ## Why the class names are new to everybody
 *
 * mitreden and bildhaft already agreed on `.list__item` / `.list__name` /
 * `.list__count`, so standardising on those would have moved one product
 * instead of three. It is the wrong name for a shared sheet, and the gallery is
 * the proof: `docs/gallery.css` uses `.list` and `.item` for a demo of
 * *sentence* rows, which is a different component that happens to be a list, so
 * a `.list` rule in components.css would have reached straight into it. A name
 * generic enough to collide once is generic enough to collide again. These rows
 * are the Sammlungen, so that is what they are called.
 *
 * The three active-state classes were three different words anyway — `.active`,
 * `.on`, `.list__item--active` — so nobody was going to keep theirs.
 *
 * ## How many are open lives here, once
 *
 * §4.2: how many Sammlungen can be open at a time is a fact about the product,
 * and a different question from how many a thing can be *in*, which is §4.1 and
 * is one everywhere as of 2026-08-25. One is open at a time in vorlaut, where a
 * Sammlung *is* a layout, and one in bildhaft; mitreden opens several, because
 * sentences are worked on across Sammlungen at a sitting and the list shows the
 * union. So `open` is a set of ids rather than one, and the press reports
 * whether it carried Cmd or Ctrl. A product that opens one at a time passes one
 * id and ignores the flag; nothing here has to know which kind it is talking
 * to.
 *
 * Putting the modifier here rather than in each product is the small win: which
 * key means "and also this one" is a convention, and a convention implemented
 * twice is one that drifts to Shift in one of them.
 *
 * ## What it draws, and what it does not
 *
 * Buttons, because a row is a control and not a link — none of these navigate.
 * `aria-current` on an open row, which two of the three were missing and which
 * is the only thing on the row saying "you are here" to somebody not looking at
 * the accent.
 *
 * A second line under the name where a product passes one, and nothing at all
 * where it does not - see `subtitle` on CollectionRow. What it says is the
 * product's business: this file holds no vocabulary, which is the whole reason
 * the field is a string rather than the `{ target, grid }` it was drawn as
 * first. One product knows what a Sammlung is for; the other two do not have
 * the question, and a field they had to answer would be this row acquiring
 * somebody's model.
 *
 * It does not draw the "+ Neue Sammlung" button under the list, the heading
 * over it, or the container itself. Those differ, and the container is the
 * caller's because the caller is what decides where in its sidebar this goes.
 *
 * ## The one seam, and why it takes a node rather than a snippet
 *
 * conventions.md §6.3. One product puts something of its own under a row: the
 * pages of the open Sammlung, in vorlaut, which is a component the editor
 * registered and the shell only finds a place for. `after` is that place.
 *
 * It takes a **`Node`**, and the helper re-parents it with `.after()`. That is
 * the whole feature, and the distinction is the reason it exists: appending an
 * existing node *moves* it, children and all, so whatever is mounted inside
 * survives a redraw of the list around it. vorlaut's own comment is explicit
 * that its host "is made once and moved, never rebuilt", because a remount on
 * every commit "would take the keyboard out of the list somebody is arrowing
 * through, on the very press that moved them" — and this list is redrawn from
 * scratch on every change, which is what makes that a live risk rather than a
 * worry. A Svelte snippet renders fresh content per row per paint and
 * reproduces exactly the remount that comment forbids, which is why the seam is
 * not one.
 *
 * It is optional, and one product is its only caller. bildhaft solved the
 * problem this looks like — telling two lists of rows apart — product-side with
 * two class hooks of its own, and must not pay for an API it does not use.
 */

/** Empties `container` and draws one row per Sammlung.
 *
 * `container` should carry `.collections`; the rows are its children and it is
 * emptied on every call. Redrawing rather than patching, because all three
 * products already repaint this whole list on every change and a list of a
 * handful of rows is not where a diff pays for itself.
 */
export function drawCollections(container, { rows, open, onPick, after }) {
  const isOpen = open instanceof Set ? open : new Set(open ?? []);
  container.replaceChildren();

  for (const row of rows) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'collections__item'
      + (isOpen.has(row.id) ? ' collections__item--active' : '');
    // Says "you are here" to a reader who is not looking at the accent. Two of
    // the three products marked the open row by colour alone.
    if (isOpen.has(row.id)) node.setAttribute('aria-current', 'true');

    const name = document.createElement('span');
    name.className = 'collections__name';
    // Already whatever the product wants shown, including its own answer for a
    // Sammlung nobody has named — one of the three draws a fallback there and
    // the other two cannot have an unnamed one at all.
    name.textContent = row.name;

    const count = document.createElement('span');
    count.className = 'collections__count';
    // A count that is not known yet is not zero. vorlaut reads the layouts it
    // is not showing to work these out, so a row can exist before its number
    // does, and drawing 0 for it would be a claim that the Sammlung is empty.
    count.textContent = row.count === undefined || row.count === null
      ? '' : String(row.count);

    /* A second line, only where there is one to draw.
     *
     * Without a subtitle the row keeps the shape it has always had - name and
     * count, no wrapper - so the two products that pass nothing get back byte
     * for byte the DOM they got before this field existed. The wrapper only
     * appears where it has something to hold, because it is what turns the
     * left side into a block with two lines in it and there is nothing to
     * stack when there is one.
     *
     * Empty string counts as absent. A product computing this line will hand
     * over "" at some point - a lookup that missed, a Sammlung read before its
     * layout was - and an empty second line is a row that is taller than its
     * neighbours for no reason anybody can see. */
    const subtitle = row.subtitle === undefined || row.subtitle === null
      ? '' : String(row.subtitle);

    if (subtitle) {
      const text = document.createElement('span');
      text.className = 'collections__text';
      const sub = document.createElement('span');
      sub.className = 'collections__sub';
      // Drawn as handed over. The row has no idea what it says; see the field
      // on CollectionRow for why that is the point rather than a shortcut.
      sub.textContent = subtitle;
      text.append(name, sub);
      node.append(text, count);
    } else {
      node.append(name, count);
    }
    node.addEventListener('click', (event) => {
      // Which modifier means "and also this one" is settled here rather than
      // three times. metaKey is the Mac chord and ctrlKey the other one; a
      // product that opens one Sammlung at a time ignores the flag entirely.
      onPick(row.id, event.metaKey || event.ctrlKey);
    });
    container.appendChild(node);

    /* Moved rather than drawn. `.after()` on a node that is already in a
       document removes it from where it was and puts it here, so the caller's
       element — and every component mounted into it — arrives intact. Asked for
       every row and answered for the ones that have something, so the caller
       never has to know which row is which by index. */
    if (after) {
      const extra = after(row);
      if (extra) node.after(extra);
    }
  }
}
