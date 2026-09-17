<script lang="ts">
  /**
   * The square, the slider, and the two ways of moving them. conventions.md
   * §6.6, over `@lautstark/design/crop`, which holds the model's constants and
   * the encoder.
   *
   * ## One component, both call shapes
   *
   * bildhaft's is already a Svelte component whose state is runes; vorlaut's is
   * a DOM factory adopted through the vanilla host. The component form wins —
   * but vorlaut reaches `cut()` and `close()` through the object its factory
   * returns, and a component returns nothing. §6.6 said "vorlaut's factory
   * goes" and did not say how the handle arrives, so here is the answer: they
   * are **instance exports**, reached through `bind:this`, which is the
   * mechanism `TitleField.flush()` already uses in this package and the same
   * bargain the sheet's settle closure makes.
   *
   * ```svelte
   * let crop: ReturnType<typeof Crop>;
   * <Crop bind:this={crop} {loaded} label={…} zoomLabel={…} output={…} />
   * …
   * const blob = await crop.cut();
   * crop.close();
   * ```
   *
   * The model, the constants and most of the comments were already the same
   * file twice — `FRAME` 0.84, `CLOSEST` 4, the two-per-cent square tolerance,
   * the `side * 0.04` keyboard step, the inverted drag mapping, the zoom about
   * the centre. One error string is verbatim identical and several comment
   * blocks are the same argument with "card" and "key" swapped.
   *
   * ## The two fixes that fall out of writing it once
   *
   * **`touch-action: none`**, which vorlaut's `.crop` has and bildhaft's does
   * not — so in bildhaft the first drag with a finger scrolls the dialog
   * instead of moving the picture.
   *
   * **`stopPropagation` after the arrow keys**, which bildhaft has and vorlaut
   * does not — so the picker's own Enter/key handling sees a keystroke that was
   * meant for the picture. Stopped only once one of the four has matched, so
   * that Tab and Escape still belong to the dialog.
   *
   * ## What the caller still owns
   *
   * Where the two halves sit. vorlaut's surface goes inside the square preview
   * box it already had and its slider goes under it in the column, which is two
   * places rather than two siblings; adopting this makes them siblings, and
   * that is a layout change to budget rather than a detail. And the decision
   * not to open a second dialog at all — "a modal over a modal to choose a
   * symbol is the thing this design set out to remove" — stays vorlaut's, which
   * is why `.crop`'s placement is not in the style block below.
   */
  import {
    CLOSEST,
    FRAME,
    MARGIN,
    STEP,
    cutSquare,
    type CropOutput,
    type Loaded,
  } from '../docs/lib/crop.js';

  let {
    loaded,
    label,
    zoomLabel,
    output,
    id,
    rowClass = 'crop__row',
  }: {
    /** The picture, from `loadSquare()`. It carries the object URL, the two
     *  measurements, the source's MIME and the `close()` that lets go. */
    loaded: Loaded;
    /** The accessible name of the box. It is a control rather than a picture
     *  being shown, and the two products call it different things. */
    label: string;
    /** The accessible name of the slider. */
    zoomLabel: string;
    /** Overrides on the four-field policy. Left off, the default is bildhaft's
     *  — source type preserved, uncapped, 0.92, Display P3. */
    output?: Partial<CropOutput>;
    id?: string;
    /** The row the slider sits in. vorlaut's is `pick__zoom`, inside a grid of
     *  its own, where the shared `margin-top` would add to a gap. Replaced
     *  rather than appended, which is `TitleField`'s bargain for the same
     *  reason. */
    rowClass?: string;
  } = $props();

  /* Read once, on purpose: the block that draws this component is keyed on the
     picture, so a different file is a different component rather than a new
     value in this one. */
  // svelte-ignore state_referenced_locally
  const full = Math.min(loaded.wide, loaded.high);
  let side = $state(full);
  // svelte-ignore state_referenced_locally
  let x = $state((loaded.wide - full) / 2);
  // svelte-ignore state_referenced_locally
  let y = $state((loaded.high - full) / 2);
  let zoom = $state(100);

  let box: HTMLElement;
  let picture: HTMLImageElement;

  function clamp(): void {
    side = Math.min(side, full);
    x = Math.min(Math.max(x, 0), loaded.wide - side);
    y = Math.min(Math.max(y, 0), loaded.high - side);
  }

  /*
   * Where the picture sits, in percentages of the box. `scale` is how much of
   * the box's width one source pixel takes: the square is FRAME of the box, so
   * a picture `wide` pixels across is `wide * scale` of it. The offsets put
   * source pixel (x, y) on the frame's top left corner, MARGIN in from both
   * edges. Height follows the width, and the box being square is what makes a
   * percentage of it mean the same vertically.
   */
  const scale = $derived(FRAME * 100 / side);

  function zoomed(next: number): void {
    /*
     * About the square's own centre, not its corner. A corner is one line
     * shorter and sends whatever has just been centred sliding off towards the
     * bottom right, so the slider would undo every drag before it.
     */
    zoom = next;
    const factor = next / 100;
    const midX = x + side / 2;
    const midY = y + side / 2;
    side = full / factor;
    x = midX - side / 2;
    y = midY - side / 2;
    clamp();
  }

  /*
   * Dragging. Pointer events with capture, so a finger or a pen works and a
   * drag that leaves the box follows the pointer instead of stopping at the
   * edge.
   *
   * The box is measured here rather than earlier: it is inside a dialog laid
   * out as it opens, and a width read while building is the width of nothing
   * yet. FRAME is in the conversion because a source pixel is measured against
   * the square, not against the box around it.
   */
  let dragging = 0;
  function down(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const perPixel = side / (box.clientWidth * FRAME);
    const fromX = event.clientX;
    const fromY = event.clientY;
    const wasX = x;
    const wasY = y;
    dragging = event.pointerId;
    box.setPointerCapture(dragging);

    const move = (moved: PointerEvent): void => {
      if (moved.pointerId !== dragging) return;
      // Backwards on purpose: dragging the picture right shows more of its left
      // side, so the square being kept moves left.
      x = wasX - (moved.clientX - fromX) * perPixel;
      y = wasY - (moved.clientY - fromY) * perPixel;
      clamp();
    };
    const stop = (ended: PointerEvent): void => {
      if (ended.pointerId !== dragging) return;
      dragging = 0;
      box.removeEventListener('pointermove', move);
      box.removeEventListener('pointerup', stop);
      box.removeEventListener('pointercancel', stop);
    };
    box.addEventListener('pointermove', move);
    box.addEventListener('pointerup', stop);
    box.addEventListener('pointercancel', stop);
  }

  /*
   * The keyboard. The step is a share of the square rather than a count of
   * source pixels, so an arrow moves the same visible amount on a 400px scan
   * and on a 4000px photograph.
   *
   * Zoom is not here: the slider is a native range and already answers the
   * arrow keys when it has focus. Two sets of zoom keys would be two answers to
   * one question — and Enter is the dialog's, which is why only the four are
   * taken.
   */
  function keys(event: KeyboardEvent): void {
    const step = side * STEP;
    if (event.key === 'ArrowLeft') x -= step;
    else if (event.key === 'ArrowRight') x += step;
    else if (event.key === 'ArrowUp') y -= step;
    else if (event.key === 'ArrowDown') y += step;
    else return;
    // Only once one of the four has matched, so Tab and Escape still belong to
    // the dialog.
    event.preventDefault();
    // And stopped, or the picker's own Enter/key handling sees a keystroke that
    // was meant for the picture.
    event.stopPropagation();
    clamp();
  }

  /** The caret, for a caller that has just opened the box. */
  export function focus(): void {
    box.focus();
  }

  /** The chosen square, encoded to the policy. */
  export function cut(): Promise<Blob> {
    return cutSquare(picture, { x, y, side }, loaded.type, output);
  }

  /** Lets go of what the picture was loaded from. **Every way out has to call
   *  it, including the ones that keep the square**: the cut is taken from the
   *  loaded picture, so it cannot be dropped before then. */
  export function close(): void {
    loaded.close();
  }
</script>

<!-- Focusable, because the arrow keys above are the only way to move the square
     without a pointer, and named, because it is a control rather than a picture
     being shown. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_no_noninteractive_tabindex -->
<div
  bind:this={box}
  {id}
  class="crop"
  tabindex="0"
  role="group"
  aria-label={label}
  onpointerdown={down}
  onkeydown={keys}
  ><img
    bind:this={picture}
    class="crop__img"
    src={loaded.url}
    alt=""
    draggable="false"
    style:width="{loaded.wide * scale}%"
    style:left="{MARGIN - x * scale}%"
    style:top="{MARGIN - y * scale}%"
  /><div class="crop__frame"></div></div
><div class={rowClass}
  ><input
    class="crop__zoom"
    type="range"
    min="100"
    max={CLOSEST * 100}
    step="1"
    value={zoom}
    aria-label={zoomLabel}
    oninput={(event) => zoomed(Number(event.currentTarget.value))}
  /></div
>

<style>
  /* What is not here is the placement: one product's box is `position:
     absolute; inset: 0` inside a preview it already had, and the other's is a
     `min(260px, 100%)` square with `aspect-ratio: 1` and a border. Both also
     set `overflow: hidden`, and the frame's dimming depends on it — but so does
     the box's own shape, so it stays beside the placement rather than being
     half-answered here. */
  .crop {
    cursor: grab;
    /* Or the browser scrolls the dialog instead of moving the picture, the
       first time somebody drags with a finger. vorlaut has this and bildhaft
       does not; writing it once is what §6.6 calls a fix falling out. */
    touch-action: none;
  }
  .crop:active {
    cursor: grabbing;
  }
  .crop:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  /* Placed from the script above in percentages of the box, so width, left and
     top are the three properties left out here. `max-width: none`, because that
     width is deliberately larger than the box — the overflow is what the frame
     is cutting off — and the img default would clamp it back. */
  .crop__img {
    position: absolute;
    height: auto;
    max-width: none;
    user-select: none;
    -webkit-user-drag: none;
  }

  /* The square that will be kept. The inset is FRAME and the two have to agree:
     that constant is what maps a source pixel onto this box.

     One enormous spread rather than four rectangles round the frame, trimmed by
     the box's own overflow. Its point is that what is being cut off stays
     visible. White in both schemes, like the picture under it — this line is
     drawn against a photograph rather than against the page. */
  .crop__frame {
    position: absolute;
    inset: 8%;
    pointer-events: none;
    box-shadow: 0 0 0 9999px rgb(0 0 0 / 0.45);
    outline: 1px solid rgb(255 255 255 / 0.9);
  }

  .crop__row {
    margin-top: 10px;
  }

  .crop__zoom {
    width: 100%;
    accent-color: var(--accent);
  }
</style>
