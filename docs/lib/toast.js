/*
 * The line that says what just happened, and says it out loud.
 *
 * All three products have one, all three wrote it separately, and all three
 * had the same bug in it at the same time: **the message was announced to
 * nobody.**
 *
 * ## The bug this exists to remove
 *
 * A live region is announced because a reader is already watching the element
 * when its contents change. It has no reason to look at an element that
 * arrives already carrying its message.
 *
 * Each product broke that in its own way and none of them looked broken:
 *
 * - **bildhaft** set the text, appended the node, and removed it again 3.2
 *   seconds later. So the region re-entered the tree carrying each message and
 *   left again between them, which is the one arrangement under which nothing
 *   is announced at all. A saved image, an exported Sammlung, a failed import,
 *   "Alle Daten gelöscht" — every acknowledgement the page made was silent.
 * - **mitreden** carried no role at all and toggled the line with `[hidden]`,
 *   which takes it out of the tree at the moment each message arrives and puts
 *   it back a beat later. Same outcome, different mechanism.
 * - **vorlaut** got there first and its fix is the shape this file took.
 *
 * In all three the words were on screen and correct the whole time, which is
 * why nothing ever looked wrong and no suite caught it.
 *
 * So this owns the invariant instead: **the node is yours, mounted once, and
 * nothing here ever adds or removes it.** What changes is the text.
 *
 * ## What it does not decide
 *
 * The three genuinely differ about what happens *after* a message, and that is
 * product identity rather than drift:
 *
 * - bildhaft empties the line after 3.2s, so the page goes quiet.
 * - vorlaut dims it after 4s but leaves the words, because its status line is
 *   mostly saying "saved" and that stays true.
 * - mitreden leaves it entirely, and has a second state — a turning ring for
 *   something that has *started* rather than finished.
 *
 * So `rest` and `onRest` are the caller's, and so is the busy class.
 *
 * `say()` and `rests()` are two verbs rather than one with an option, because
 * which of them a message wants is a property of the message and not of the
 * region. vorlaut has both on one line and named them first: a failed write
 * stays lit, "saved" fades, and the same element carries each in turn. A
 * product where every message fades calls `rests()` every time, which is
 * bildhaft; one where none does never calls it, which is mitreden.
 *
 * What is shared is the invariant above, the timer being cancelled on every
 * new message, and `say()` always clearing the busy marker — which is
 * mitreden's rule and worth keeping: the end of a job is always reported, and
 * forgetting to stop the spinner leaves the page claiming to be busy for the
 * rest of the session.
 */

/**
 * Wraps a live region that is already in the page.
 *
 * @param {HTMLElement} node - the region, mounted, with role="status" on it.
 * @param {{rest?: number, onRest?: (node: HTMLElement) => void, busyClass?: string}} [options]
 */
export function announcer(node, options = {}) {
  if (!node) throw new Error("announcer needs the element that is already in the page");
  const { rest = 0, onRest = null, onWake = null, busyClass = null } = options;

  let timer;

  /* Every path cancels first. Two messages in quick succession otherwise leave
     the first one's timer running, and it fires against the second one's text —
     which is how a line that had just been written came to be cleared early. */
  const stop = () => {
    clearTimeout(timer);
    timer = undefined;
  };

  const start = () => {
    if (!rest || !onRest) return;
    timer = setTimeout(() => onRest(node), rest);
  };

  /* The inverse of onRest, and it needs saying why it is not optional in
     spirit even though it is in the signature.

     Whatever onRest did is still done when the next message arrives. bildhaft
     gets away without this because its onRest empties the text and the next
     message writes over it - the effect undoes itself. vorlaut's adds a class,
     which does not, so its line came back with "not saved yet" still wearing
     the fade that belonged to "saved". Its own suite caught that; the point of
     putting the pair here is that no call site has to remember the second
     half. */
  const wake = () => {
    if (onWake) onWake(node);
  };

  return {
    /** The region itself, for a product that has to mount or measure it. */
    node,

    /** Something finished, and the line stays lit until the next thing. */
    say(text) {
      stop();
      wake();
      node.textContent = text;
      if (busyClass) node.classList.remove(busyClass);
      return node;
    },

    /** Said, and then allowed to go quiet - `onRest` after `rest` ms.
     *
     * A second verb rather than an option on say(), because which of the two a
     * message wants is a property of the message and not of the region.
     * vorlaut has both on one line and named them first: a failed write stays
     * lit, "saved" fades, and the same element carries each in turn. */
    rests(text) {
      this.say(text);
      start();
      return node;
    },

    /** Something started. Rests nothing: a job in flight has not finished, and
     *  a line that dimmed or emptied under it would say it had. */
    busy(text) {
      stop();
      wake();
      node.textContent = text;
      if (busyClass) node.classList.add(busyClass);
      return node;
    },

    /** Quiet, now, without waiting for the timer. The node stays where it is. */
    clear() {
      stop();
      wake();
      node.textContent = "";
      if (busyClass) node.classList.remove(busyClass);
      return node;
    },
  };
}
