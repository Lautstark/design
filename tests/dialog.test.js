import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmDialog, dismissOnBackdrop, openDialog } from '../docs/lib/dialog.js';

/* The modal sheet, and the question asked before something goes.
 *
 * This is the module the runner was chosen for: jsdom has no
 * HTMLDialogElement.showModal at all, so the file whose whole subject is what
 * the platform gives you when you stop hand-building an overlay could not be
 * run under it.
 *
 * Two things here are the reason the file exists rather than checks of what it
 * draws. The `settled` guard, whose failure mode is a promise that never
 * settles - a button that does nothing, with no error, no dialog and nothing in
 * the console, which vorlaut shipped and which was found by hand because there
 * is no failing assertion in a promise that stays pending. And the rule that a
 * dialog somebody closes costs nothing, which this family has broken in the
 * other direction before.
 */

const WORDS = {
  title: 'Sammlung löschen',
  body: '12 Zeilen gehen mit ihr.',
  confirmLabel: '12 Zeilen löschen',
  cancelLabel: 'Abbrechen',
  closeLabel: 'Schließen',
};

beforeEach(() => {
  document.body.innerHTML = '';
});

const sheet = () => document.querySelector('dialog.sheet');
const footButtons = () => [...sheet().querySelectorAll('.foot button')];
const closer = () => sheet().querySelector('.head button');

describe('openDialog', () => {
  it('shows a modal sheet and leaves it in the document while it is open', () => {
    openDialog({ title: 'Einstellungen', closeLabel: 'Schließen', body: [] });
    expect(sheet()).not.toBeNull();
    expect(sheet().open, 'shown with showModal(), not merely appended').toBe(true);
  });

  /* A <dialog> shown with showModal() already has both, and writing them again
   * is how an element ends up announced twice. */
  it('names itself with aria-label and adds no role of its own', () => {
    openDialog({ title: 'Einstellungen', closeLabel: 'Schließen', body: [] });
    expect(sheet().getAttribute('aria-label')).toBe('Einstellungen');
    expect(sheet().hasAttribute('role')).toBe(false);
    expect(sheet().hasAttribute('aria-modal')).toBe(false);
  });

  it('takes the ✕\'s name from the caller, separately from anything else', () => {
    openDialog({ title: 'Einstellungen', closeLabel: 'Dialog schließen', body: [] });
    expect(closer().getAttribute('aria-label')).toBe('Dialog schließen');
  });

  it('puts the caller\'s nodes in the body, and its own nowhere else', () => {
    const mine = document.createElement('p');
    mine.textContent = 'Meins';
    openDialog({ title: 'X', closeLabel: 'Zu', body: [mine] });
    expect(sheet().querySelector('.body').children).toHaveLength(1);
    expect(sheet().querySelector('.body').textContent).toBe('Meins');
  });

  it('has no foot at all when none was asked for', () => {
    openDialog({ title: 'X', closeLabel: 'Zu', body: [] });
    expect(sheet().querySelector('.foot')).toBeNull();
  });

  it('widens on request', () => {
    openDialog({ title: 'X', closeLabel: 'Zu', body: [], wide: true });
    expect(sheet().className).toBe('sheet wide');
  });

  /* One exit for every way out, because the browser fires `close` for all of
   * them: the ✕, Escape, a press outside, and close() itself. The listener that
   * used to watch the document for Escape is gone with that, and so is the leak
   * it carried - added per dialog and removed only on the path through close(),
   * so any other way out left it behind. */
  it('takes itself out of the document however it closes', () => {
    const handle = openDialog({ title: 'X', closeLabel: 'Zu', body: [] });
    handle.close();
    expect(sheet(), 'closed through the handle').toBeNull();

    openDialog({ title: 'X', closeLabel: 'Zu', body: [] });
    closer().click();
    expect(sheet(), 'closed through the ✕').toBeNull();

    openDialog({ title: 'X', closeLabel: 'Zu', body: [] });
    // What Escape and a press outside both reach the module as.
    document.querySelector('dialog').close();
    expect(sheet()).toBeNull();
  });

  it('tells the caller once it has gone', () => {
    const seen = [];
    const handle = openDialog({
      title: 'X', closeLabel: 'Zu', body: [],
      onClose: () => seen.push(document.querySelector('dialog.sheet')),
    });
    handle.close();
    expect(seen, 'and by then it is out of the document').toEqual([null]);
  });
});

/* The one thing the platform does not give, because a modal dialog's ::backdrop
 * is a pseudo-element and takes no clicks: a press there lands on the dialog
 * itself, the same target as a press on the sheet's own padding, so only the
 * coordinates tell the two apart.
 *
 * happy-dom has no layout, so getBoundingClientRect answers zeroes and every
 * press would read as outside. The rectangle is stubbed rather than worked
 * around: what is under test is a comparison against one. */
describe('dismissal by pressing outside', () => {
  const withRect = (dialog, box) => {
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
      left: box[0], top: box[1], right: box[2], bottom: box[3],
      x: box[0], y: box[1], width: box[2] - box[0], height: box[3] - box[1],
      toJSON: () => ({}),
    });
  };

  const pressAt = (dialog, x, y, target = dialog) =>
    target.dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true, clientX: x, clientY: y,
    }));

  it('closes on a press beyond the sheet', () => {
    const handle = openDialog({ title: 'X', closeLabel: 'Zu', body: [] });
    withRect(handle.dialog, [100, 100, 400, 300]);
    pressAt(handle.dialog, 20, 20);
    expect(sheet()).toBeNull();
  });

  it('stays open on a press inside it', () => {
    const handle = openDialog({ title: 'X', closeLabel: 'Zu', body: [] });
    withRect(handle.dialog, [100, 100, 400, 300]);
    pressAt(handle.dialog, 200, 200);
    expect(sheet()).not.toBeNull();
  });

  it('stays open on a press that landed on something inside it', () => {
    const inner = document.createElement('p');
    const handle = openDialog({ title: 'X', closeLabel: 'Zu', body: [inner] });
    withRect(handle.dialog, [100, 100, 400, 300]);
    // Coordinates that would read as outside; the target is what saves it.
    pressAt(handle.dialog, 20, 20, inner);
    expect(sheet(), 'the target decides before the coordinates do').not.toBeNull();
  });

  /* mousedown rather than click: a press that began inside the sheet and ended
   * outside it - the end of a drag, or a text selection that overshot - is not
   * somebody asking to leave. */
  it('does not close on a click, only on the press that began outside', () => {
    const handle = openDialog({ title: 'X', closeLabel: 'Zu', body: [] });
    withRect(handle.dialog, [100, 100, 400, 300]);
    handle.dialog.dispatchEvent(new MouseEvent('click', {
      bubbles: true, clientX: 20, clientY: 20,
    }));
    expect(sheet()).not.toBeNull();
  });

  it('is available on a dialog the product wrote itself', () => {
    const own = document.createElement('dialog');
    document.body.appendChild(own);
    own.showModal();
    dismissOnBackdrop(own);
    vi.spyOn(own, 'getBoundingClientRect').mockReturnValue({
      left: 100, top: 100, right: 400, bottom: 300,
      x: 100, y: 100, width: 300, height: 200, toJSON: () => ({}),
    });
    own.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 5, clientY: 5 }));
    expect(own.open).toBe(false);
  });
});

describe('confirmDialog', () => {
  it('resolves true only for the one confirming button', async () => {
    const answer = confirmDialog({ ...WORDS });
    footButtons().at(-1).click();
    await expect(answer).resolves.toBe(true);
  });

  /* A dialog somebody closes has to cost nothing. This family has broken that
   * in the other direction before, on a button that opened a port picker and
   * built anyway when the picker was dismissed. */
  it('resolves false for the other button', async () => {
    const answer = confirmDialog({ ...WORDS });
    footButtons()[0].click();
    await expect(answer).resolves.toBe(false);
  });

  it('resolves false for the ✕', async () => {
    const answer = confirmDialog({ ...WORDS });
    closer().click();
    await expect(answer).resolves.toBe(false);
  });

  it('resolves false for Escape and for a press outside, which arrive as close', async () => {
    const answer = confirmDialog({ ...WORDS });
    document.querySelector('dialog').close();
    await expect(answer).resolves.toBe(false);
  });

  it('takes every word from the caller', async () => {
    const answer = confirmDialog({ ...WORDS });
    expect(sheet().getAttribute('aria-label')).toBe(WORDS.title);
    expect(sheet().querySelector('.body').textContent).toBe(WORDS.body);
    expect(footButtons().map((b) => b.textContent))
      .toEqual([WORDS.cancelLabel, WORDS.confirmLabel]);
    expect(closer().getAttribute('aria-label'), 'and never the same word as the foot')
      .toBe(WORDS.closeLabel);
    footButtons()[0].click();
    await answer;
  });

  /* showModal() would otherwise land focus on the first focusable thing in the
   * sheet, which is the ✕ - and for a question whose other button destroys
   * something, the safe action is the one to be standing on. */
  it('starts on the way out, not on the ✕ and not on the destructive button', async () => {
    const answer = confirmDialog({ ...WORDS, danger: true });
    expect(document.activeElement).toBe(footButtons()[0]);
    expect(document.activeElement).not.toBe(closer());
    footButtons()[0].click();
    await answer;
  });

  it('marks a destructive confirm, and does not when it is not one', async () => {
    const a = confirmDialog({ ...WORDS, danger: true });
    expect(footButtons().at(-1).className).toBe('btn destructive filled');
    footButtons()[0].click();
    await a;

    const b = confirmDialog({ ...WORDS });
    expect(footButtons().at(-1).className).toBe('btn primary');
    footButtons()[0].click();
    await b;
  });

  /* A shared module must not emit a class the shared layer does not define -
   * it would draw right in one product and left in two. components.css already
   * puts justify-content: flex-end on the foot. */
  it('emits nothing but the two buttons in the foot', async () => {
    const answer = confirmDialog({ ...WORDS });
    expect(sheet().querySelector('.foot').children).toHaveLength(2);
    expect(sheet().querySelector('.spacer')).toBeNull();
    footButtons()[0].click();
    await answer;
  });

  /* The part the comment says must not be simplified back.
   *
   * Reading returnValue in a single `close` listener is the tidier shape and it
   * has one failure mode this dialog cannot afford: if `close` does not arrive,
   * the promise never settles, and what the person sees is a button that did
   * nothing. Each button resolving for itself is what survives a host that
   * never fires it. */
  it('still answers when close never arrives', async () => {
    const held = [];
    const real = HTMLDialogElement.prototype.close;
    HTMLDialogElement.prototype.close = function noClose() { held.push(this); };
    try {
      const answer = confirmDialog({ ...WORDS });
      footButtons().at(-1).click();
      await expect(answer, 'the press is what resolved it, not the event').resolves.toBe(true);
      expect(held, 'and it did try to close').toHaveLength(1);
    } finally {
      HTMLDialogElement.prototype.close = real;
      for (const dialog of document.querySelectorAll('dialog')) dialog.remove();
    }
  });

  /* The other half of `settled`: a host that fires close twice, or fires it as
   * a consequence of the answer already given, must not change the answer. */
  /* `settled` itself, which the tests above cannot see: a Promise resolves once
   * whatever this module does, so the *answer* is safe without the flag. What
   * the flag is for is the line after the resolve - a second finish() would ask
   * the dialog to close again, on a dialog that has already gone. Pinned by
   * counting, because that is the only place it shows. */
  it('asks the dialog to close exactly once, however many answers arrive', async () => {
    const answer = confirmDialog({ ...WORDS });
    const dialog = document.querySelector('dialog');
    let closes = 0;
    const real = dialog.close.bind(dialog);
    dialog.close = () => { closes += 1; real(); };

    // Held before the first press: answering takes the sheet out of the
    // document, and the point is that a stale reference is still live.
    const [cancel, confirm] = footButtons();
    confirm.click();                       // resolves, and closes
    cancel.click();                        // a second press, after the answer
    dialog.dispatchEvent(new Event('close'));

    await expect(answer).resolves.toBe(true);
    expect(closes).toBe(1);
  });

  it('keeps the first answer when close arrives afterwards', async () => {
    const answer = confirmDialog({ ...WORDS });
    const dialog = document.querySelector('dialog');
    footButtons().at(-1).click();
    dialog.dispatchEvent(new Event('close'));
    dialog.dispatchEvent(new Event('close'));
    await expect(answer).resolves.toBe(true);
  });

  it('keeps the first answer when both buttons are pressed', async () => {
    const answer = confirmDialog({ ...WORDS });
    const [cancel, confirm] = footButtons();
    cancel.click();
    confirm.click();
    await expect(answer, 'the first press is the answer').resolves.toBe(false);
  });

  it('leaves nothing in the document once it has answered', async () => {
    const answer = confirmDialog({ ...WORDS });
    footButtons().at(-1).click();
    await answer;
    expect(document.querySelector('dialog')).toBeNull();
  });
});
