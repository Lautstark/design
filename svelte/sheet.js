/*
 * The imperative half of the sheet. conventions.md §6.1.
 *
 * Both openings, one component: `<Sheet>` where the caller is markup,
 * `openSheet` where the caller is a controller module opening a sheet from a
 * menu item — which is most of vorlaut and half of mitreden. They draw the same
 * thing because this one mounts the other.
 *
 * ## The name is vorlaut's, deliberately
 *
 * vorlaut already has an `openSheet`, for its picture-column sheet, and
 * `parts.ts` records that its own frame opener is called `openParts` for
 * exactly that reason. The shared one keeps the obvious name and vorlaut
 * imports it aliased. The collision is named here so nobody resolves it by
 * renaming the local one, which is a whole shape rather than a frame.
 *
 * ## It returns a handle and never a promise
 *
 * A caller that wants an answer settles its own promise from the foot's
 * presses, with a `settled` guard, and uses `onClose` only for the dismissal
 * paths. That is §3.4's rule and `confirmDialog` is its worked example: a
 * promise resolved from `close` alone hangs forever on any host that closes the
 * dialog without firing it, and there is no failing assertion in a promise that
 * stays pending. mitreden's `askPenExport` does resolve from `close` alone and
 * is owed a fix; this module does not get to pretend that shape works.
 */
import { flushSync, mount, unmount } from 'svelte';
import Imperative from './Imperative.svelte';

/**
 * Opens a modal sheet and hands back a way to close it and to reach it.
 *
 * @template S
 * @param {import('./sheet.js').SheetOptions<S>} options
 * @returns {import('./sheet.js').Handle}
 */
export function openSheet(options) {
  /* A host of its own, so the component has somewhere to be mounted and
     unmounted that is not `document.body` — unmounting from the body would
     make Svelte the owner of a node it did not create. The dialog is a child of
     this host; showModal() promotes it to the top layer without moving it. */
  const host = document.createElement('div');
  document.body.appendChild(host);

  let app;
  let gone = false;
  const teardown = () => {
    if (gone) return;
    gone = true;
    /* After the event, not during it. `close` is dispatched from inside the
       browser's own call stack and, when it came from `handle.close()`, from
       inside an effect flush; unmounting there tears down the tree that is
       still running. */
    queueMicrotask(() => {
      unmount(app);
      host.remove();
    });
  };

  /** @type {import('./sheet.js').Handle} */
  const handle = {
    close() {
      handle.dialog?.close();
    },
    dialog: undefined,
    body: undefined,
  };

  app = mount(Imperative, {
    target: host,
    props: {
      handle,
      options: {
        ...options,
        onClose: () => {
          options.onClose?.();
          teardown();
        },
      },
    },
  });

  /* So that the handle is complete before it is returned. `mount` builds the
     DOM but leaves the effects — including the one that fills the handle and
     the one that calls showModal() — for the next flush, and an imperative
     caller has no paint to wait for. */
  flushSync();

  return handle;
}
