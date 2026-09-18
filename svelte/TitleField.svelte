<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  /**
   * The work head's name field. conventions.md §6.5, over
   * `@lautstark/design/rename` unchanged.
   *
   * Renaming a Sammlung is typing over its name (§1.6): there is no dialog, the
   * name in the work head *is* the input. The debounce, the write on the way
   * out, the refusal to write a value that has not moved and the guard against
   * a repaint typing over somebody are all `rename.js`'s and stay there. What
   * is here is the markup and the three things each product had bolted onto it
   * separately.
   *
   * ## The `oninput` echo, which is the correction §6.5 makes to itself
   *
   * "One field, one debounced write" is not the whole of it. `rename.js` binds
   * with `addEventListener` rather than taking the property precisely so a
   * product can keep a listener of its own on the same field, and two products
   * rely on that: bildhaft echoes each keystroke into the sidebar row and the
   * top bar, and vorlaut's page head assigns the model and repaints on **every**
   * keystroke, because the two lists carrying that name are drawn from the
   * layout. A component with only the debounced write moves those repaints to
   * 400ms after typing stops — a behaviour change, and the one thing the e2e
   * types then asserts.
   *
   * ## One caret mechanism instead of three
   *
   * „+ Neue Sammlung" and „+ Neuer Tag" make the thing at once and put the
   * caret in its name, selected, so the first keystroke replaces the date it
   * was given (§1.5). mitreden reaches a component instance method through two
   * levels of props; bildhaft sets a `$state` enum that an effect reads and
   * acknowledges; vorlaut calls a module singleton. Bildhaft's is the shape,
   * because it is the only one that does not couple the producer to the
   * consumer's identity — the controller that made the thing says the caret is
   * owed, and whichever field takes it says so.
   *
   * `refresh()` before focusing is free — a no-op when the field already agrees
   * — and it closes the window where the create button has moved focus away.
   *
   * Enter is `renameField`'s: prevent the default, blur, let blur write.
   * **Escape is nobody's.** No product handles it, it does not revert, it does
   * not cancel a pending write; that is left as it is, and named here so the
   * absence reads as a decision.
   */
  import { renameField, type RenameField } from '../docs/lib/rename.js';

  let {
    value,
    write,
    oninput,
    id,
    placeholder,
    label,
    select = true,
    delay,
    caret,
    class: className = 'title-input',
    ...rest
  }: {
    /** The stored name. Assigned into the field through `refresh()` and never
     *  directly — every product had a repaint that assigned it directly, which
     *  is the bug `rename.js` exists to remove. */
    value: string;
    /** Called with the field's raw value: untrimmed, and possibly empty.
     *  Whether either is acceptable is the product's — mitreden refuses an
     *  empty name and vorlaut writes it and draws a fallback. */
    write: (name: string) => void | Promise<void>;
    /** The live echo, and only the echo: writing is `rename.js`'s, on its own
     *  listener. Two products repaint on every keystroke. */
    oninput?: (event: Event & { currentTarget: HTMLInputElement }) => void;
    id?: string;
    placeholder?: string;
    /** The accessible name. A field whose label is the thing it names has
     *  none otherwise. */
    label?: string;
    /** Select on taking the caret, so the first keystroke replaces what is
     *  there. False for vorlaut's page head, whose invented name is a
     *  placeholder rather than a name. */
    select?: boolean;
    /** Milliseconds after the last keystroke before the name is written.
     *  `rename.js`'s 400 where the caller does not say. */
    delay?: number;
    /** Where the caret is owed. `asked()` is read inside an effect, so a
     *  module-scope rune behind it is what makes this reactive; `answered()`
     *  is said by whichever field took it, so the next ask is a new one. */
    caret?: { asked(): boolean; answered(): void };
    /** vorlaut's page head is `.pagehead__name`, not `.title-input`, and it
     *  carries its own id, placeholder and label with it. */
    class?: string;
  } & Omit<
    HTMLInputAttributes,
    'value' | 'type' | 'class' | 'id' | 'placeholder' | 'aria-label' | 'oninput' | 'autocomplete'
  > = $props();

  let input: HTMLInputElement;
  let naming: RenameField | undefined = $state(undefined);

  $effect(() => {
    const made = renameField(input, (typed) => write(typed), delay === undefined ? {} : { delay });
    naming = made;
    return () => {
      made.stop();
      naming = undefined;
    };
  });

  /* Through refresh() rather than by assigning: it declines while somebody is
     typing in the field, and while a keystroke is still waiting out its
     debounce. A value comparison is not the same guard — it holds only where
     the caller's own input handler has already echoed the keystroke into the
     model, so a render caused by anything else would compare against the
     stored name and put it back over what is being typed. */
  $effect(() => {
    naming?.refresh(value);
  });

  /* After the one above, so the field already says the new name by the time
     the caret lands in it. Effects run in the order they are written. */
  $effect(() => {
    if (!caret?.asked()) return;
    naming?.refresh(value);
    input.focus();
    if (select) input.select();
    caret.answered();
  });

  /** Write now if anything is owed. What a product calls before it does
   *  something that would leave a pending keystroke nowhere to land. */
  export function flush(): Promise<void> {
    return naming?.flush() ?? Promise.resolve();
  }
</script>

<input
  bind:this={input}
  {id}
  class={className}
  type="text"
  autocomplete="off"
  {placeholder}
  aria-label={label}
  {oninput}
  {...rest}
/>
