/*
 * Renaming a Sammlung is typing over its name, and this is the field that is.
 *
 * conventions.md §1.6 settles that there is no dialog: the name in the work
 * head *is* the input. What that leaves is a small piece of timing that all
 * three products wrote separately and got differently wrong — and each of the
 * three failures below needs a person typing while something else is in
 * flight, which is why no suite of theirs found any of them.
 *
 * ## The bug this exists to remove
 *
 * A repaint that assigns the stored name into the field puts it back over what
 * somebody is in the middle of typing.
 *
 * mitreden's copy carries a guard and names one reason: the caret jumps to the
 * end mid-word. vorlaut's carries it and names a second, worse one — a repaint
 * can be *in flight* while somebody types, so the assignment is not merely
 * disruptive, it is the old name overwriting the new one, and the write that
 * follows saves what the repaint put there. vorlaut hit it on the path where it
 * is guaranteed rather than likely: making a Sammlung fills the field the
 * moment the row appears, and the paint that drew the row is still running.
 *
 * So the guard is not left to each repaint to remember. `refresh()` is the only
 * way the field is ever assigned, and it holds the rule. A product that calls
 * it is correct by construction; there is nothing left at a call site to omit.
 *
 * ## Two more, found by reading the three against each other
 *
 * **A blur that re-debounces is a rename that can be lost.** mitreden's `blur`
 * called the same scheduler as `input`, so leaving the field started the clock
 * again rather than stopping it: a name typed and immediately clicked away from
 * survived only if nothing navigated inside the next 400 ms. Here blur writes.
 *
 * **A blur that always writes is a write per visit to the field.** bildhaft's
 * wrote unconditionally, so tabbing through the work head saved the same name
 * again every time — harmless in a database, and not harmless in vorlaut, where
 * every write is a touch that reorders the sidebar (§1.4) and announces to a
 * standing backup (§2.2). Here nothing is written unless the value moved.
 *
 * ## What is deliberately not here
 *
 * **Whether an empty name is allowed.** mitreden refuses one; vorlaut writes it
 * and draws a fallback in the list. Both are right for a product that does or
 * does not have somewhere to show "unnamed", so it is `write`'s decision.
 *
 * **Trimming.** Same reason and the same place: `write` gets exactly what is in
 * the field.
 *
 * **Anything drawn.** `.title-input` is components.css's.
 *
 * ## Listeners, not properties
 *
 * addEventListener rather than `oninput = `, so a product can keep a listener
 * of its own on the same field without one of the two silently replacing the
 * other. bildhaft has one: it echoes each keystroke into the sidebar row and
 * the top bar, which is a live redraw and not a write, and it would have had to
 * be handed in as an option if this file took the property.
 */

/** How long after the last keystroke the name is written, where a caller does
 *  not say. What mitreden and bildhaft both chose; vorlaut waited 600 and had
 *  no reason on file for the difference. Anyone who wants their own passes it. */
const DELAY = 400;

/**
 * Binds a field so that typing in it renames the thing it names.
 *
 * `write` is called with the field's raw value, debounced while typing and
 * written out when the field is left or Enter is pressed. It is not called when
 * the value has not moved since it was last written.
 */
export function renameField(input, write, opts = {}) {
  const delay = opts.delay ?? DELAY;

  let timer = null;
  /* What `write` was last given. Two readers: leaving an untouched field is
     then not a write, and a refresh knows whether it would be assigning over
     something. Seeded from the field, so a field bound to a name already in it
     has nothing owed. */
  let written = input.value;

  const send = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    if (input.value === written) return undefined;
    written = input.value;
    return write(written);
  };

  const onInput = () => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(send, delay);
  };

  // Enter leaves the field rather than writing from here, so that there is one
  // way out and blur cannot be reached with a write still owed.
  const onKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    input.blur();
  };

  input.addEventListener('input', onInput);
  input.addEventListener('blur', send);
  input.addEventListener('keydown', onKeyDown);

  return {
    /**
     * Put the stored name in the field — unless the field is the better
     * authority on what the name is.
     *
     * Twice it is: while somebody is typing in it, and while a keystroke is
     * waiting out its debounce. A blur ends both, so switching to another
     * Sammlung by clicking a row refreshes normally — the click blurs the
     * field, the blur writes, and the repaint that follows is free to assign.
     */
    refresh(name) {
      if (document.activeElement === input) return;
      if (timer !== null) return;
      // Only when it differs, so a repaint of an untouched field does not move
      // a caret that a click has just put in the middle of it.
      if (input.value !== name) input.value = name;
      written = name;
    },

    /** Write now if anything is owed. What a product calls before it does
     *  something that would leave the pending keystroke nowhere to land. */
    flush: () => Promise.resolve(send()),

    /** Let the field go. */
    stop() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      input.removeEventListener('input', onInput);
      input.removeEventListener('blur', send);
      input.removeEventListener('keydown', onKeyDown);
    },
  };
}
