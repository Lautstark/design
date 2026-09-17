/*
 * Cutting somebody's own picture down to a square, before anything is kept.
 * conventions.md §6.6.
 *
 * ## Why it exists at all, in both products' words
 *
 * Nothing was broken without it. Every box a symbol is shown in is square — a
 * 68px chip in a row, an 82px tile in a picker, 40mm on a laminated card, a
 * 128px key on a tablet — and every one of them fits with `object-fit:
 * contain`, so a photograph off a phone has always worked and has never filled
 * its box: a 4:3 picture leaves a quarter of the card blank and the child in it
 * smaller than the pictogram beside him. This is about filling the card, not
 * about fixing a fault.
 *
 * ## Only ever the user's own file
 *
 * A symbol from a source is not cropped and must not be. METACOM is read out of
 * a licensed folder and never copied — a crop is a derivative — and ARASAAC
 * pictograms are already square line art with nothing to gain. Both products
 * hang this off the one path that already keeps bytes, and off no other. The
 * rule belongs to the product; it is written here because a shared crop is
 * exactly the file somebody would reach for from the wrong branch.
 *
 * ## The model
 *
 * A square of `side` source pixels at `(x, y)`. Zooming shrinks `side` about
 * its own centre, dragging moves `(x, y)`, and both are clamped so the square
 * can never leave the picture — which is what makes an empty corner impossible
 * without a guard at the drawing end.
 *
 * The picture is placed in percentages of the box rather than in pixels, so
 * nothing is measured except while a drag is actually happening. A dialog that
 * is resized, or opened at a width nobody predicted, stays right by itself.
 *
 * What is deliberately absent is a pinch gesture. The slider is the zoom, it
 * works from the keyboard, and a two-pointer gesture that has to fight the
 * dialog's own scrolling is a lot of code for a second way to do the one thing
 * that already has one.
 *
 * ## Why this is a module and Crop.svelte is a component
 *
 * `cut()` is a canvas and an encoder and has no markup in it, `loadSquare()`
 * decides whether there is anything to ask at all and runs before any of this
 * is on screen, and both are wanted by callers that are not components. Same
 * division as `./rename` under `TitleField` and `./dialog` under `Sheet`.
 */

/*
 * How much of the box the kept square takes. The rest shows what is about to be
 * cut off: somebody moving a face into the middle needs to see the shoulder
 * that is leaving, not only the part that stays. A frame flush with the box
 * would be less code and would answer the wrong question.
 */
export const FRAME = 0.84;

/** Where the frame's top left corner sits, as a percentage of the box. */
export const MARGIN = (1 - FRAME) / 2 * 100;

/** How far the slider goes in. Four times is a face out of a group photo,
 *  which is the far end of what this is for; past that a small tile is being
 *  cut from too few pixels to carry it. */
export const CLOSEST = 4;

/** An arrow's step, as a share of the square. Four per cent moves the same
 *  visible amount on a 400px scan and on a 4000px photograph. */
export const STEP = 0.04;

/**
 * The default output policy, which is bildhaft's.
 *
 * It is the default because it is the one that was reasoned about: the source
 * type is preserved, the square is uncapped, and the canvas is Display P3
 * against a measurement. vorlaut's answer differs on three of the four and
 * passes them — `{ type: 'png', cap: IMAGE_SIZE, colorSpace: 'srgb' }` — which
 * is the shape of a policy rather than a disagreement.
 *
 * @type {import('./crop.js').CropOutput}
 */
export const OUTPUT = {
  /*
   * `'source'`: a JPEG stays a JPEG, anything else becomes PNG.
   *
   * bildhaft's print.css says it outright — never upscale past the source,
   * never downscale before printing — so the square is cut at the picture's own
   * resolution, and a 12-megapixel photograph re-encoded as PNG would multiply
   * what the database holds and what every exported backup carries as a data:
   * URL. Anything that is not already a JPEG becomes PNG because it may have
   * transparency, and a ground colour chosen here would be wrong against a
   * printed card or against half the keys on a board.
   *
   * A MIME string could not say that, which is why this field is a sentinel or
   * a callback. §6.6 corrects its own first draft on exactly this point.
   */
  type: 'source',
  /*
   * Uncapped: the square's own pixels. bildhaft is the product that is, and
   * four of its crop assertions depend on it, so the field is nullable rather
   * than a number with a large default.
   *
   * vorlaut's 512 is its **tablet package** constant. It is not "the device's
   * format from the exchange spec": that spec calls 512 a recommendation the
   * format tolerates violating, it is not one of the seven pinned device
   * numbers, and no fixture holds it. A cap never enlarges either — `out` is
   * the smaller of the square and the cap — which is the half of vorlaut's
   * comment that "capped at 512" loses.
   */
  cap: null,
  /** Applied only when the encoding is JPEG. */
  quality: 0.92,
  /*
   * Display P3, not the default sRGB.
   *
   * A 2d canvas is sRGB unless it is asked otherwise, and `drawImage()` colour
   * manages into whatever the canvas is — so every colour the photograph had
   * outside sRGB was clamped on the way in and the square came out duller than
   * the picture that went into it. Measured in bildhaft before the option
   * existed: a stored Display P3 red of (254, 0, 0) came back (235, 50, 36).
   *
   * That is an on-screen colour-management measurement about photographs, and
   * it is quoted as one. §6.6 records that the first draft wrote it up as "a
   * print at the wrong gamut was measured there", which is not what was
   * measured.
   *
   * Safe the other way round: an sRGB source converts into P3 exactly and comes
   * back tagged, and a browser that does not know the option ignores it and
   * gives the sRGB context it always gave. vorlaut never *chose* sRGB — it
   * calls `getContext("2d")` with no options and inherited the default — so
   * this is not one product's decision overriding another's.
   */
  colorSpace: 'display-p3',
};

/**
 * Loads a file and says whether there is a square to ask about, or `null` when
 * there is nothing to ask.
 *
 * Two silences, both meaning "keep the file exactly as it is", because that is
 * what happened before this step existed and neither is worth a sentence:
 *
 * - the picture is already square, so the crop would only ask for a decision
 *   the picture has already made. It also keeps the original bytes rather than
 *   re-encoding them for no gain.
 * - the browser could not read a size off it — an SVG with no intrinsic size,
 *   or a file that is not a picture at all. The first still works as a symbol
 *   and the second failed before this and fails after.
 *
 * @param {Blob} file
 * @param {string} [name] What the file arrived under, kept so the square can be
 *   named after it. One product names the stored file and one does not.
 * @returns {Promise<import('./crop.js').Loaded | null>}
 */
export async function loadSquare(file, name = '') {
  const url = URL.createObjectURL(file);
  const picture = new Image();
  picture.src = url;
  try {
    await picture.decode();
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }

  const wide = picture.naturalWidth;
  const high = picture.naturalHeight;
  /* Two per cent rather than exactly equal: a 500x510 scan is square as far as
     anybody looking at a card is concerned, and the fit downstream absorbs the
     difference without a visible margin. The same number, and the same
     sentence, in both products. */
  if (!wide || !high || Math.abs(wide - high) <= Math.max(wide, high) * 0.02) {
    URL.revokeObjectURL(url);
    return null;
  }

  return {
    url,
    wide,
    high,
    name,
    /* The source's own MIME, so an output policy of `'source'` has something to
       preserve. `Blob.type` is `''` for a file the browser could not name, and
       `typeOut` treats that as "not a JPEG", which is the safe half. */
    type: file.type,
    close: () => URL.revokeObjectURL(url),
  };
}

/**
 * What the square is written as, from the policy and the source.
 *
 * @param {import('./crop.js').CropOutput['type']} policy
 * @param {string} source
 * @returns {string}
 */
export function typeOut(policy, source) {
  if (typeof policy === 'function') return policy(source);
  if (policy === 'png') return 'image/png';
  return source === 'image/jpeg' || source === 'image/jpg' ? 'image/jpeg' : 'image/png';
}

/**
 * What a cropped file is called.
 *
 * The bytes are ones this has just drawn, so the chosen name's extension is no
 * longer necessarily true of them. The name is shown to a person picking a
 * picture out of their library, so it stays recognisably theirs; only the
 * extension follows what was actually written. In the product that sniffs
 * rather than reads the name this is tidiness with one thing to show for it: a
 * cropped foto.jpg and an uncropped one are no longer the same store key.
 *
 * @param {string} name
 * @param {string} type The MIME actually written — `typeOut`'s answer.
 * @returns {string}
 */
export function cropName(name, type) {
  const stem = name.replace(/\.[^./\\]*$/, '');
  return `${stem}${type === 'image/jpeg' ? '.jpg' : '.png'}`;
}

/**
 * Cuts the chosen square out of a loaded picture.
 *
 * @param {HTMLImageElement} picture
 * @param {{ x: number, y: number, side: number }} at
 * @param {string} source The picture's own MIME, for a `'source'` policy.
 * @param {Partial<import('./crop.js').CropOutput>} [output]
 * @returns {Promise<Blob>}
 */
export async function cutSquare(picture, at, source, output) {
  const { type, cap, quality, colorSpace } = { ...OUTPUT, ...output };
  /* Never enlarged. `out` is the square's own pixels, or the cap where there is
     one and the square is bigger than it — cutting a 300-pixel square out of a
     small scan and blowing it up would add bytes and blur to something that is
     going to be scaled to a button anyway. */
  const square = Math.max(1, Math.round(at.side));
  const out = cap === null || cap === undefined ? square : Math.min(square, cap);
  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const context = canvas.getContext('2d', { colorSpace });
  if (!context) throw new Error('this browser gave no 2d canvas to cut a picture on');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(picture, at.x, at.y, at.side, at.side, 0, 0, out, out);
  const wanted = typeOut(type, source);
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, wanted, wanted === 'image/jpeg' ? quality : undefined));
  if (!blob) throw new Error('this browser would not encode the picture');
  return blob;
}
