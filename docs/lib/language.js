/*
 * The control that changes which language the page is in.
 *
 * Three products drew it and drew it the same: a `.segmented` with one button
 * per language, `aria-pressed` on the one in force, and the language's own name
 * as the label. What differed was only what each had remembered to add —
 * bildhaft has `role="group"` and an `aria-label`, mitreden and vorlaut-editor
 * have neither, and only bildhaft carries a note under the row. Three copies of
 * one control, and the most complete of them was complete by accident rather
 * than by agreement.
 *
 * ## Why this module may carry words, when the others may not
 *
 * Every other shared module here takes its labels from the caller, because two
 * of the products are bilingual and a string in the package would be wrong in
 * one of them. This one ships the language names, and the exception is argued
 * rather than convenient: **a language's name is not a translation.** „Deutsch"
 * is Deutsch on an English page and English is English on a German one, because
 * this is the one control somebody reaches for when they *cannot read the
 * interface around it*. mitreden had already written that down beside its own
 * copy. A picker that said „German" to a German speaker who had landed in the
 * English build would be the one label in the family that fails exactly when it
 * is needed.
 *
 * So `NAMES` is endonyms, not a translation table, and a product that needs a
 * language this file has never heard of passes its own name in rather than
 * waiting for a release.
 *
 * Everything that *is* a translation still comes from the caller: the group's
 * accessible name, and any note the product puts under the row.
 *
 * ## What this returns, and what it deliberately does not
 *
 * The `.segmented` row, and nothing around it. bildhaft wrapped its copy in an
 * `.opt` column with a `.small faint` note under it — and `.opt`, `.small` and
 * `.faint` are drawn in bildhaft's stylesheet and in no other product's and not
 * in components.css. Emitting them here would ship three class names into three
 * products where two of them draw nothing, which is conventions.md §4.12's
 * failure exactly, and it was made twice already today.
 *
 * So the module owns the row: the buttons, their names, and which one is
 * pressed. Where it sits and what is written under it stay the product's, in the
 * product's own vocabulary.
 */

/** What each language calls itself, in itself. Not a translation table. */
export const NAMES = {
  de: 'Deutsch',
  en: 'English',
};

function make(tag, { className, text, attrs, on } = {}, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  for (const [name, value] of Object.entries(attrs ?? {})) {
    if (value !== undefined && value !== null) node.setAttribute(name, String(value));
  }
  for (const [name, handler] of Object.entries(on ?? {})) node.addEventListener(name, handler);
  for (const child of children) if (child) node.append(child);
  return node;
}

/**
 * Builds the picker and hands it back with a way to repaint it.
 *
 * `refresh` exists because two of the three products change language without
 * reloading: the pressed button has to move, and the caller is the only one that
 * knows when the change has landed.
 */
export function languagePicker({ languages, current, choose, label, names }) {
  const called = { ...NAMES, ...(names ?? {}) };
  const node = make('div', { className: 'segmented', attrs: { role: 'group', 'aria-label': label } });

  function refresh() {
    const now = current();
    node.replaceChildren(...languages.map((code) => make('button', {
      /* The code itself where the name is unknown, deliberately: a two-letter
         button somebody can still press beats a blank one, and it names the gap
         for whoever adds the language. */
      text: called[code] ?? code,
      attrs: { type: 'button', 'aria-pressed': String(code === now) },
      on: { click: () => choose(code) },
    })));
  }

  refresh();
  return { node, refresh };
}
