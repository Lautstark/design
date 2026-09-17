/* Hand-written, because crop.js is hand-written JavaScript rather than build
   output: this package ships source and has no compile step. The same reasoning
   as rename.d.ts and collections.d.ts beside it. */

/** A picture that is worth asking about, and what it measures. */
export interface Loaded {
  /** The object URL the crop draws from. Let go of by `close()`. */
  url: string;
  wide: number;
  high: number;
  /** The name the file arrived under, kept so the square can be named after it.
   *  `''` where the caller did not pass one. */
  name: string;
  /** The source's own MIME, so a `'source'` output policy has something to
   *  preserve. `''` for a file the browser could not name. */
  type: string;
  /** Lets go of what the picture was loaded from. **Every way out has to call
   *  it, including the ones that keep the square**: the cut is taken from the
   *  loaded picture, so it cannot be dropped before then. */
  close(): void;
}

/**
 * What the square is written as. conventions.md §6.6: four fields, and the
 * first draft got both halves of the first two wrong.
 */
export interface CropOutput {
  /**
   * The encoding.
   *
   * - `'source'` — a JPEG stays a JPEG, everything else becomes PNG. This is
   *   bildhaft's, and it is why the field is not a MIME string: preserving the
   *   source is not something a string can say.
   * - `'png'` — always PNG, alpha kept. vorlaut's, because a symbol may be line
   *   art on nothing and a ground colour chosen here would be wrong against
   *   half the keys.
   * - a callback, for a product whose answer is neither.
   */
  type: 'source' | 'png' | ((source: string) => string);
  /**
   * The longest side of what is written, or `null` for the square's own pixels.
   *
   * **Nullable, and that matters.** bildhaft is uncapped — print must not
   * upscale or downscale — and four of its crop assertions depend on it. A cap
   * never enlarges: what is written is the smaller of the square and the cap.
   */
  cap: number | null;
  /** JPEG only, and ignored for any other encoding. 0.92. */
  quality: number;
  /** The canvas's colour space. See `OUTPUT` in crop.js for the measurement
   *  behind the default, and for why sRGB is not a decision anybody made. */
  colorSpace: PredefinedColorSpace;
}

/** How much of the box the kept square takes. 0.84. */
export declare const FRAME: number;
/** Where the frame's top left corner sits, as a percentage of the box. */
export declare const MARGIN: number;
/** How far the slider goes in. 4. */
export declare const CLOSEST: number;
/** An arrow's step, as a share of the square. 0.04. */
export declare const STEP: number;
/** The default policy, which is bildhaft's. */
export declare const OUTPUT: CropOutput;

/** Loads a file and says whether there is a square to ask about, or `null`
 *  when the picture is already square or has no size to read. */
export declare function loadSquare(file: Blob, name?: string): Promise<Loaded | null>;

/** What the square is written as, from the policy and the source's MIME. */
export declare function typeOut(policy: CropOutput['type'], source: string): string;

/** What a cropped file is called: the chosen name, with the extension that is
 *  actually true of the bytes. */
export declare function cropName(name: string, type: string): string;

/** Cuts the chosen square out of a loaded picture. */
export declare function cutSquare(
  picture: HTMLImageElement,
  at: { x: number; y: number; side: number },
  source: string,
  output?: Partial<CropOutput>,
): Promise<Blob>;
