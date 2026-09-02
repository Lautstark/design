/*
 * A modal sheet, and the one question worth asking before something is
 * destroyed.
 *
 * `.sheet` and its head/body/foot regions are components.css's; this is the
 * behaviour underneath, which the three products had between them in three
 * states of completeness. bildhaft's is the base, because it is the one that
 * had been through the failures: it hand-built an overlay first and found out
 * what the platform gives you when you stop.
 *
 * ## Why a native <dialog>, shown with showModal()
 *
 * The top layer, the focus trap, the inert background and Escape all come free,
 * and all four are things a hand-built overlay does not do. bildhaft's did not:
 * Tab walked out of the settings sheet and into the sentence list behind it,
 * and a screen reader read the page underneath as though the dialog were part
 * of it.
 *
 * The one thing the platform does not give is dismissal by pressing outside,
 * because a modal dialog's ::backdrop is a pseudo-element and takes no clicks.
 * A press there lands on the dialog itself — the same target as a press on the
 * sheet's own padding — so only the coordinates tell the two apart. See
 * dismissOnBackdrop below.
 *
 * ## Every word comes from the caller
 *
 * Including "Cancel" and the accessible name of the ✕. Two of the three
 * products carry de/en tables and the third is German throughout by policy, so
 * a string written here would be wrong in at least one of them. That is why the
 * label fields are required rather than defaulted: a default in one language is
 * the same mistake, made quietly.
 *
 * A sheet with both a corner ✕ and a footer dismiss must not give them the same
 * accessible name — design.md §2 records that defect — so the two labels are
 * separate fields and neither falls back to the other.
 */

/** Builds one element with attributes and children. Local, and deliberately
 *  small: the products each have their own element helper and this package
 *  cannot depend on any of them. */
function make(tag, { className, text, attrs, on } = {}, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  for (const [name, value] of Object.entries(attrs ?? {})) {
    if (value !== undefined && value !== null) node.setAttribute(name, String(value));
  }
  for (const [name, handler] of Object.entries(on ?? {})) node.addEventListener(name, handler);
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child);
  }
  return node;
}

/**
 * Dismissal by pressing outside the sheet.
 *
 * mousedown rather than click: a press that began inside the sheet and ended
 * outside it — the end of a drag, or a text selection that overshot — is not
 * somebody asking to leave.
 *
 * Exported because a product with a dialog in its markup wants exactly this and
 * nothing else around it.
 */
export function dismissOnBackdrop(dialog) {
  dialog.addEventListener('mousedown', (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    const inside = event.clientX >= box.left && event.clientX <= box.right
      && event.clientY >= box.top && event.clientY <= box.bottom;
    if (!inside) dialog.close();
  });
}

/**
 * Opens a modal sheet and hands back a way to close it.
 *
 * The dialog is built, appended, shown, and removed from the document when it
 * closes — however it closes. One exit for every way out, because the browser
 * fires `close` for all of them: the ✕, Escape, a press outside, and close()
 * itself. The listener that used to watch the document for Escape is gone with
 * that, and so is the leak it carried: it was added per dialog and removed only
 * on the path through close(), so any other way out left it behind.
 */
export function openDialog(options) {
  const body = make('div', { className: 'body' }, ...options.body);

  // No role and no aria-modal: a <dialog> shown with showModal() already has
  // both, and writing them again is how an element ends up announced twice.
  const dialog = make('dialog', {
    className: `sheet${options.wide ? ' wide' : ''}`,
    attrs: { 'aria-label': options.title },
  });
  dialog.append(
    make('div', { className: 'head' },
      make('h2', { text: options.title }),
      make('button', {
        className: 'btn icon',
        text: '✕',
        attrs: { type: 'button', 'aria-label': options.closeLabel },
        on: { click: () => dialog.close() },
      }),
    ),
    body,
  );
  if (options.footer) dialog.append(make('div', { className: 'foot' }, ...options.footer));

  dismissOnBackdrop(dialog);
  dialog.addEventListener('close', () => {
    dialog.remove();
    options.onClose?.();
  });

  document.body.appendChild(dialog);
  dialog.showModal();

  return { close: () => dialog.close(), body, dialog };
}

/**
 * Asks before something goes, and takes no for an answer.
 *
 * Resolves true only when the one confirming button is pressed. Every other way
 * out — the other button, the ✕, Escape, a press outside — is false, and false
 * means nothing happened. That is a rule this family has broken in the other
 * direction before, on a button that opened a port picker and built anyway when
 * the picker was dismissed: a dialog somebody closes has to cost nothing.
 *
 * ## The promise settles from the presses, not from the close event alone
 *
 * This is the part that must not be simplified back, and it is worth saying
 * exactly why. Reading `dialog.returnValue` in a single `close` listener is the
 * tidier shape and it has one failure mode this dialog cannot afford: if
 * `close` does not arrive, the promise never settles. The caller sits awaiting
 * it for the life of the page, and what the person sees is a button that did
 * nothing — no error, no dialog, no deletion, nothing in the console. vorlaut
 * shipped exactly that and it was found by hand, because there is no failing
 * assertion in a promise that stays pending.
 *
 * So each button resolves for itself, `close` resolves false for the dismissal
 * paths, and `settled` makes whichever arrives first the answer. A host that
 * fires no `close` still resolves; a host that fires it twice still resolves
 * once.
 */
export function confirmDialog(options) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
      // After resolving, so that a close event arriving as a consequence of
      // this line finds `settled` already true. Optional, because a throw here
      // would be an unhandled rejection after the caller already has its
      // answer - and an answered question with a sheet still on screen is a
      // better failure than the reverse.
      handle?.close();
    };

    const cancel = make('button', {
      className: 'btn',
      text: options.cancelLabel,
      attrs: { type: 'button' },
      on: { click: () => finish(false) },
    });

    const confirm = make('button', {
      className: options.danger ? 'btn destructive filled' : 'btn primary',
      text: options.confirmLabel,
      attrs: { type: 'button' },
      on: { click: () => finish(true) },
    });

    /* The word, where one is asked for.
     *
     * Reserved for the acts that reach past this browser and cannot be undone —
     * emptying a household's whole library, which with a folder as the store
     * empties it on every device somebody owns. Everywhere else a click is the
     * right amount of friction, and spending this on deleting one row would
     * make it a habit, and a habit is not a check.
     *
     * The word comes from the caller, like every other word here: two of the
     * consumers are bilingual and a string in this file would be wrong in one of
     * them. Compared after trimming and case-folded, because somebody typing the
     * word they were shown is the evidence being asked for — a capital letter is
     * not a second question.
     */
    const wanted = options.requireTyping;
    const field = wanted
      ? make('input', {
          className: 'field',
          attrs: { type: 'text', autocomplete: 'off', autocapitalize: 'off',
                   spellcheck: 'false', 'aria-label': options.typingLabel ?? wanted },
        })
      : null;
    if (field) {
      confirm.disabled = true;
      const check = () => {
        confirm.disabled = field.value.trim().toLowerCase() !== wanted.trim().toLowerCase();
      };
      field.addEventListener('input', check);
      /* Enter in a text field inside a <form>-less dialog does nothing by
         default, and a person who has just typed the word expects it to. Only
         once the word is right, so it can never be the thing that confirms by
         accident. */
      field.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !confirm.disabled) { event.preventDefault(); finish(true); }
      });
    }

    const handle = openDialog({
      title: options.title,
      closeLabel: options.closeLabel,
      // A plain paragraph: `.sheet > .body > p` is already margin-free in
      // components.css, so an inline style here would be the shared layer
      // being second-guessed by the module that depends on it.
      body: [
        make('p', { text: options.body }),
        ...(field ? [make('p', { text: options.typingLabel ?? '' }), field] : []),
      ],
      footer: [
        // No spacer: components.css puts `justify-content: flex-end` on the
        // foot already, and bildhaft's `.spacer` was a leftover from before it
        // did. A shared module must not emit a class the shared layer does not
        // define - it would draw right in one product and left in two.
        cancel,
        confirm,
      ],
      // Escape, the ✕ and a press outside all land here. None of them is a yes.
      onClose: () => finish(false),
    });

    /* Focus starts on the way out.
     *
     * showModal() would otherwise land it on the first focusable thing in the
     * sheet, which is the ✕ — and for a question whose other button destroys
     * something, the safe action is the one to be standing on. The destructive
     * button is a Tab away and should be reached deliberately. vorlaut's copy
     * did this and bildhaft's did not; it is the one thing the base was missing.
     */
    /* With a word to type, the caret goes in the field instead: the person has
       already decided, and the next thing they have to do is the typing. The
       safe button is still what Escape and the ✕ do, and the destructive one is
       still disabled until the word is right. */
    if (field) field.focus(); else cancel.focus();
  });
}
