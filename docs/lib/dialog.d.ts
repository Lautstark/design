/* Hand-written, because dialog.js is hand-written JavaScript rather than build
   output: this package ships source and has no compile step. The three products
   are TypeScript and resolve types through `exports`, so without this file the
   import is `any` — and the label fields are the whole point, since a missing
   one is a button with no accessible name and that is exactly the defect
   design.md §2 recorded. Same reasoning as theme.d.ts and menu.d.ts beside it. */

export interface DialogOptions {
  /** The sheet's heading, and its accessible name. */
  title: string;
  /** The accessible name of the corner ✕. Must not equal a footer dismiss's
   *  label: two buttons with one name is ambiguous to anyone navigating by it. */
  closeLabel: string;
  body: (Node | string)[];
  footer?: (Node | string)[];
  wide?: boolean;
  /** Called once, however the dialog closed. */
  onClose?: () => void;
}

export interface OpenDialog {
  close(): void;
  /** The body element, for dialogs that rewrite their own contents. */
  body: HTMLElement;
  /** The dialog itself, for the rare caller that needs the element. */
  dialog: HTMLDialogElement;
}

/** Opens a modal sheet and hands back a way to close it. */
export declare function openDialog(options: DialogOptions): OpenDialog;

export interface ConfirmOptions {
  title: string;
  /** What is about to happen, in full: name the thing and count what goes. */
  body: string;
  /** The confirming button, labelled with the act — "Delete 3 sets", not "OK". */
  confirmLabel: string;
  /** The declining button. */
  cancelLabel: string;
  /** The accessible name of the corner ✕. */
  closeLabel: string;
  /** Draws the confirming button as destructive. */
  danger?: boolean;
}

/**
 * Asks, and resolves true only when the confirming button is pressed.
 *
 * Every other way out is false. The promise settles from the presses rather
 * than from the `close` event alone — see the note in dialog.js, which is the
 * one part of this module that must not be simplified back.
 */
export declare function confirmDialog(options: ConfirmOptions): Promise<boolean>;

/** Adds press-outside-to-dismiss to a <dialog> that already exists, which is
 *  the one thing showModal() does not give you. openDialog does this itself. */
export declare function dismissOnBackdrop(dialog: HTMLDialogElement): void;
