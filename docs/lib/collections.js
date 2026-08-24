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
 * ## Arity lives here, once
 *
 * §4.1 settles that how many Sammlungen can be open at a time is a fact about
 * what a product holds: one in vorlaut, where a Sammlung *is* a layout; one in
 * bildhaft; many in mitreden, where a sentence belongs in the morning one and
 * the nursery one at the same time. So `open` is a set of ids rather than one,
 * and the press reports whether it carried Cmd or Ctrl (§4.2). A product with
 * one-at-a-time arity passes one id and ignores the flag; nothing here has to
 * know which kind it is talking to.
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
 * It does not draw the "+ Neue Sammlung" button under the list, the heading
 * over it, or the container itself. Those differ, and the container is the
 * caller's because the caller is what decides where in its sidebar this goes.
 */

/** Empties `container` and draws one row per Sammlung.
 *
 * `container` should carry `.collections`; the rows are its children and it is
 * emptied on every call. Redrawing rather than patching, because all three
 * products already repaint this whole list on every change and a list of a
 * handful of rows is not where a diff pays for itself.
 */
export function drawCollections(container, { rows, open, onPick }) {
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

    node.append(name, count);
    node.addEventListener('click', (event) => {
      // Which modifier means "and also this one" is settled here rather than
      // three times. metaKey is the Mac chord and ctrlKey the other one; a
      // product whose arity is one ignores the flag entirely.
      onPick(row.id, event.metaKey || event.ctrlKey);
    });
    container.appendChild(node);
  }
}
