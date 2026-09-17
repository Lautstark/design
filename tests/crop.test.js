import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Crop from '../svelte/Crop.svelte';
import { CLOSEST, FRAME, MARGIN, OUTPUT, STEP, cropName, cutSquare, loadSquare, typeOut }
  from '../docs/lib/crop.js';
import { props } from './props.svelte.js';

/* Cutting somebody's own picture down to a square. conventions.md §6.6.
 *
 * The model was already the same file twice, so most of what is worth holding
 * here is the reconciliation: the four-field output policy, which the first
 * draft of §6.6 got wrong in both of its first two fields; the two fixes that
 * fall out of writing it once — touch-action and stopPropagation, each present
 * in exactly one of the two products; and the handle, because a component
 * returns nothing and one product reaches cut() and close() through the object
 * its factory used to return.
 *
 * happy-dom gives no 2d context, which is the one thing the encoder cannot do
 * without — so the canvas is stubbed and what is asserted is what the encoder
 * asked it for. That is the assertion that matters anyway: the policy is four
 * numbers handed to two platform calls.
 */

const HERE = dirname(fileURLToPath(import.meta.url));

const LOADED = {
  url: 'blob:test',
  wide: 400,
  high: 300,
  name: 'foto.jpg',
  type: 'image/jpeg',
  close: () => {},
};

/** A canvas that answers, and says what it was asked. */
function stubCanvas() {
  const asked = { context: null, blob: null, drawn: null, size: null };
  const realContext = HTMLCanvasElement.prototype.getContext;
  const realBlob = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.getContext = function getContext(kind, options) {
    asked.context = { kind, options };
    return {
      imageSmoothingEnabled: false,
      imageSmoothingQuality: '',
      drawImage: (...args) => { asked.drawn = args.slice(1); },
    };
  };
  HTMLCanvasElement.prototype.toBlob = function toBlob(done, type, quality) {
    asked.blob = { type, quality };
    asked.size = { width: this.width, height: this.height };
    done(new Blob(['x'], { type }));
  };
  asked.restore = () => {
    HTMLCanvasElement.prototype.getContext = realContext;
    HTMLCanvasElement.prototype.toBlob = realBlob;
  };
  return asked;
}

let app;
let given;
let canvas;

afterEach(() => {
  if (app) unmount(app);
  app = undefined;
  if (canvas) canvas.restore();
  canvas = undefined;
  document.body.innerHTML = '';
});

const render = (initial) => {
  given = props({ loaded: LOADED, label: 'Ausschnitt', zoomLabel: 'Näher', ...initial });
  app = mount(Crop, { target: document.body, props: given });
  flushSync();
  return document.body.firstElementChild;
};

const box = () => document.querySelector('.crop');
const image = () => document.querySelector('.crop__img');

/* Where the picture sits, as three numbers. Parsed rather than compared as
   text: the placement is arithmetic over 0.84, so every one of them is a
   binary float and a string comparison would be asserting the last bit of a
   percentage nobody can see. */
const placed = () => {
  const style = image().style;
  return {
    width: parseFloat(style.width),
    left: parseFloat(style.left),
    top: parseFloat(style.top),
  };
};

describe('the model’s constants, which were the same file twice', () => {
  it('keeps the numbers both products wrote', () => {
    expect(FRAME).toBe(0.84);
    // (1 - FRAME) / 2 * 100, written the way both products wrote it — which in
    // binary floating point is 8.000000000000002, and is the number that has
    // been going into their stylesheets all along.
    expect(MARGIN).toBeCloseTo(8, 10);
    expect(CLOSEST).toBe(4);
    expect(STEP).toBe(0.04);
  });
});

describe('the output policy', () => {
  it('is four fields, and the default is the one that was reasoned about', () => {
    expect(OUTPUT).toEqual({
      type: 'source',
      cap: null,
      quality: 0.92,
      colorSpace: 'display-p3',
    });
  });

  describe('type', () => {
    it('preserves a JPEG under the source policy, which no MIME string could say', () => {
      /* bildhaft's, and the reason the field is a sentinel: print.css says
         never upscale past the source and never downscale before printing, so
         a 12-megapixel photograph re-encoded as PNG would multiply what the
         database holds and what every backup carries as a data: URL. */
      expect(typeOut('source', 'image/jpeg')).toBe('image/jpeg');
      expect(typeOut('source', 'image/jpg')).toBe('image/jpeg');
    });

    it('writes everything else as PNG, because it may have transparency', () => {
      expect(typeOut('source', 'image/webp')).toBe('image/png');
      expect(typeOut('source', 'image/heic')).toBe('image/png');
      // A file the browser could not name. Not a JPEG is the safe half.
      expect(typeOut('source', '')).toBe('image/png');
    });

    it('takes the png sentinel for the product whose keys are line art on nothing', () => {
      expect(typeOut('png', 'image/jpeg')).toBe('image/png');
    });

    it('takes a callback, for a product whose answer is neither', () => {
      expect(typeOut((source) => `${source}+`, 'image/avif')).toBe('image/avif+');
    });
  });

  describe('cap', () => {
    it('is nullable, and null means the square’s own pixels', async () => {
      /* bildhaft is uncapped and four of its crop assertions depend on it, so
         this is not a number with a large default. */
      canvas = stubCanvas();
      await cutSquare(new Image(), { x: 0, y: 0, side: 900 }, 'image/png');
      expect(canvas.size).toEqual({ width: 900, height: 900 });
    });

    it('caps where there is one', async () => {
      canvas = stubCanvas();
      await cutSquare(new Image(), { x: 0, y: 0, side: 900 }, 'image/png', { cap: 512 });
      expect(canvas.size).toEqual({ width: 512, height: 512 });
    });

    it('never enlarges, which is the half "capped at 512" loses', async () => {
      canvas = stubCanvas();
      await cutSquare(new Image(), { x: 0, y: 0, side: 300 }, 'image/png', { cap: 512 });
      expect(canvas.size).toEqual({ width: 300, height: 300 });
    });

    it('never writes a nothing-by-nothing square', async () => {
      canvas = stubCanvas();
      await cutSquare(new Image(), { x: 0, y: 0, side: 0.2 }, 'image/png');
      expect(canvas.size).toEqual({ width: 1, height: 1 });
    });
  });

  describe('quality', () => {
    it('is 0.92, and reaches the encoder only for a JPEG', async () => {
      canvas = stubCanvas();
      await cutSquare(new Image(), { x: 0, y: 0, side: 10 }, 'image/jpeg');
      expect(canvas.blob).toEqual({ type: 'image/jpeg', quality: 0.92 });
    });

    it('is left off for anything else, rather than passed and ignored', async () => {
      canvas = stubCanvas();
      await cutSquare(new Image(), { x: 0, y: 0, side: 10 }, 'image/png');
      expect(canvas.blob).toEqual({ type: 'image/png', quality: undefined });
    });
  });

  describe('colorSpace', () => {
    it('asks for Display P3 by default, on the measurement bildhaft took', async () => {
      /* A stored Display P3 red of (254, 0, 0) came back (235, 50, 36). An
         on-screen colour-management measurement about photographs, quoted as
         one — §6.6 records that the first draft laundered it into an anecdote
         about a print. */
      canvas = stubCanvas();
      await cutSquare(new Image(), { x: 0, y: 0, side: 10 }, 'image/png');
      expect(canvas.context).toEqual({ kind: '2d', options: { colorSpace: 'display-p3' } });
    });

    it('takes sRGB from the product that inherited it', async () => {
      /* vorlaut never chose sRGB — it calls getContext("2d") with no options.
         Saying so explicitly is the same context it always got. */
      canvas = stubCanvas();
      await cutSquare(new Image(), { x: 0, y: 0, side: 10 }, 'image/png', { colorSpace: 'srgb' });
      expect(canvas.context.options).toEqual({ colorSpace: 'srgb' });
    });
  });

  it('cuts the square that was chosen, at the size that was written', async () => {
    canvas = stubCanvas();
    const picture = new Image();
    await cutSquare(picture, { x: 40, y: 12, side: 300 }, 'image/png', { cap: 128 });
    expect(canvas.drawn).toEqual([40, 12, 300, 300, 0, 0, 128, 128]);
  });

  it('says so out loud when the browser gives no canvas to cut on', async () => {
    // happy-dom is that browser, so this is the real path rather than a stub.
    await expect(cutSquare(new Image(), { x: 0, y: 0, side: 10 }, 'image/png'))
      .rejects.toThrow('this browser gave no 2d canvas to cut a picture on');
  });
});

describe('what a cropped file is called', () => {
  it('keeps the name and corrects the extension', () => {
    expect(cropName('foto.jpg', 'image/jpeg')).toBe('foto.jpg');
    expect(cropName('foto.jpg', 'image/png')).toBe('foto.png');
    expect(cropName('scan.HEIC', 'image/png')).toBe('scan.png');
  });

  it('leaves a name with no extension recognisably theirs', () => {
    expect(cropName('Mia am Strand', 'image/png')).toBe('Mia am Strand.png');
  });
});

describe('loading', () => {
  /* The two silences, both meaning "keep the file exactly as it is". happy-dom
     decodes nothing, so the measurements are stubbed on the prototype — what
     is under test is the tolerance and the two exits, not the decoder. */
  const withSize = async (wide, high, fn) => {
    const proto = Object.getPrototypeOf(new Image());
    const was = {
      wide: Object.getOwnPropertyDescriptor(proto, 'naturalWidth'),
      high: Object.getOwnPropertyDescriptor(proto, 'naturalHeight'),
      decode: Object.getOwnPropertyDescriptor(proto, 'decode'),
    };
    const put = (name, value) =>
      (value ? Object.defineProperty(proto, name, value) : delete proto[name]);
    Object.defineProperty(proto, 'naturalWidth', { get: () => wide, configurable: true });
    Object.defineProperty(proto, 'naturalHeight', { get: () => high, configurable: true });
    Object.defineProperty(proto, 'decode', {
      value: () => Promise.resolve(), configurable: true, writable: true,
    });
    try {
      return await fn();
    } finally {
      put('naturalWidth', was.wide);
      put('naturalHeight', was.high);
      put('decode', was.decode);
    }
  };

  it('hands back the picture, its size, its name and its own MIME', async () => {
    const loaded = await withSize(400, 300, () =>
      loadSquare(new Blob(['x'], { type: 'image/jpeg' }), 'foto.jpg'));
    expect(loaded.wide).toBe(400);
    expect(loaded.high).toBe(300);
    expect(loaded.name).toBe('foto.jpg');
    // So that a policy of 'source' has something to preserve.
    expect(loaded.type).toBe('image/jpeg');
    expect(typeof loaded.close).toBe('function');
    loaded.close();
  });

  it('says nothing to ask about a picture that is already square', async () => {
    const loaded = await withSize(500, 500, () => loadSquare(new Blob(['x'])));
    expect(loaded).toBeNull();
  });

  it('holds the two per cent both products wrote', async () => {
    /* A 500x510 scan is square as far as anybody looking at a card is
       concerned, and the fit downstream absorbs it without a visible margin. */
    expect(await withSize(500, 510, () => loadSquare(new Blob(['x'])))).toBeNull();
    expect(await withSize(500, 520, () => loadSquare(new Blob(['x'])))).not.toBeNull();
  });

  it('says nothing to ask where the browser read no size', async () => {
    // An SVG with no intrinsic size, or a file that is not a picture at all.
    expect(await withSize(0, 0, () => loadSquare(new Blob(['x'])))).toBeNull();
  });

  it('says nothing to ask when the picture will not decode', async () => {
    /* A file that is not a picture at all. It failed before this step existed
       and fails after; what must not happen is an object URL left behind on the
       way out, which is why the exit revokes before it returns. */
    const proto = Object.getPrototypeOf(new Image());
    const was = Object.getOwnPropertyDescriptor(proto, 'decode');
    Object.defineProperty(proto, 'decode', {
      value: () => Promise.reject(new Error('no')), configurable: true, writable: true,
    });
    try {
      expect(await loadSquare(new Blob(['not a picture']))).toBeNull();
    } finally {
      if (was) Object.defineProperty(proto, 'decode', was);
      else delete proto.decode;
    }
  });
});

describe('Crop', () => {
  it('draws the box, the picture and the frame, and the slider under them', () => {
    const node = render();
    expect(node.className.split(' ')[0]).toBe('crop');
    expect(node.tagName).toBe('DIV');
    expect(image().tagName).toBe('IMG');
    expect(image().getAttribute('src')).toBe('blob:test');
    // Empty alt: it is the thing being chosen, not a picture being described.
    expect(image().getAttribute('alt')).toBe('');
    expect(node.querySelector('.crop__frame')).not.toBeNull();
    const row = document.querySelectorAll('.crop__row');
    expect(row).toHaveLength(1);
    expect(row[0].querySelector('.crop__zoom').type).toBe('range');
  });

  it('is focusable and named, because it is a control rather than a picture', () => {
    const node = render();
    expect(node.getAttribute('tabindex')).toBe('0');
    expect(node.getAttribute('role')).toBe('group');
    expect(node.getAttribute('aria-label')).toBe('Ausschnitt');
  });

  it('names the slider and runs it from 100 to CLOSEST', () => {
    render();
    const zoom = document.querySelector('.crop__zoom');
    expect(zoom.getAttribute('aria-label')).toBe('Näher');
    expect(zoom.min).toBe('100');
    expect(zoom.max).toBe('400');
    expect(zoom.step).toBe('1');
  });

  it('takes the product’s own name for the row the slider sits in', () => {
    /* vorlaut's is `pick__zoom`, inside a grid of its own where the shared
       margin-top would add to a gap. Replaced rather than appended, which is
       TitleField's bargain for the same reason. */
    render({ rowClass: 'pick__zoom' });
    expect(document.querySelector('.crop__row')).toBeNull();
    expect(document.querySelector('.pick__zoom .crop__zoom')).not.toBeNull();
  });

  it('opens on the middle of the picture, in percentages of the box', () => {
    /* Nothing is measured: the square is FRAME of the box, so a picture `wide`
       pixels across is `wide * scale` of it, and the offsets put source pixel
       (x, y) on the frame's corner, MARGIN in from both edges. */
    render();
    expect(placed().width).toBeCloseTo(112, 6);
    expect(placed().left).toBeCloseTo(-6, 6);
    expect(placed().top).toBeCloseTo(8, 6);
  });

  describe('the keyboard', () => {
    const press = (key) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      box().dispatchEvent(event);
      flushSync();
      return event;
    };

    it('moves the square by a share of itself, not by a count of source pixels', () => {
      // So an arrow moves the same visible amount on a 400px scan and on a
      // 4000px photograph. 300 * 0.04 = 12 source pixels, here.
      render();
      press('ArrowRight');
      expect(placed().left).toBeCloseTo(-9.36, 6);
      press('ArrowLeft');
      expect(placed().left).toBeCloseTo(-6, 6);
    });

    it('clamps, so the square can never leave the picture', () => {
      render();
      for (let i = 0; i < 20; i += 1) press('ArrowUp');
      // y is 0 and cannot go below it; the frame's corner is MARGIN in.
      expect(placed().top).toBeCloseTo(8, 6);
    });

    it('takes the four, and only the four', () => {
      render();
      expect(press('ArrowRight').defaultPrevented).toBe(true);
      // Tab and Escape still belong to the dialog, and Enter to its foot.
      expect(press('Tab').defaultPrevented).toBe(false);
      expect(press('Enter').defaultPrevented).toBe(false);
    });

    it('stops the four from reaching the picker around it', () => {
      /* bildhaft has this and vorlaut does not, so the picker's own Enter
         handling sees a keystroke meant for the picture. One of the two fixes
         §6.6 says falls out of writing this once.
 
         Asserted on the event rather than through a listener above: Svelte 5
         delegates keydown to the root and walks the path itself, honouring
         cancelBubble as it goes, so a plain ancestor listener in this document
         would run in the real bubble phase before any of that and would be
         measuring the runtime rather than the component. */
      render();
      expect(press('ArrowRight').cancelBubble).toBe(true);
      expect(press('Enter').cancelBubble).toBe(false);
    });
  });

  it('zooms about the square’s own centre', () => {
    /* A corner is one line shorter and sends whatever has just been centred
       sliding off towards the bottom right, so the slider would undo every
       drag before it. */
    render();
    const zoom = document.querySelector('.crop__zoom');
    zoom.value = '200';
    zoom.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    expect(placed().width).toBeCloseTo(224, 6);
    expect(placed().left).toBeCloseTo(-62, 6);
    expect(placed().top).toBeCloseTo(-34, 6);
  });

  it('brings touch-action with it, which one of the two products lacks', () => {
    /* Or the browser scrolls the dialog instead of moving the picture, the
       first time somebody drags with a finger. */
    const file = readFileSync(join(HERE, '..', 'svelte', 'Crop.svelte'), 'utf8');
    const style = /<style>([\s\S]*)<\/style>/.exec(file)[1];
    expect(style).toMatch(/\.crop\s*\{[^}]*touch-action:\s*none/);
  });

  describe('the handle', () => {
    /* vorlaut reaches cut() and close() through the object its factory
       returns, and a component returns nothing — so they are instance exports,
       which is the mechanism TitleField.flush() already uses here. */
    it('cuts the square that is on screen, to the policy it was given', async () => {
      canvas = stubCanvas();
      render({ output: { type: 'png', cap: 128, colorSpace: 'srgb' } });
      const blob = await app.cut();
      expect(canvas.drawn).toEqual([50, 0, 300, 300, 0, 0, 128, 128]);
      expect(canvas.blob).toEqual({ type: 'image/png', quality: undefined });
      expect(blob.type).toBe('image/png');
    });

    it('preserves the source type where the policy says to', async () => {
      canvas = stubCanvas();
      render();
      await app.cut();
      expect(canvas.blob).toEqual({ type: 'image/jpeg', quality: 0.92 });
      // Uncapped: the square's own pixels.
      expect(canvas.size).toEqual({ width: 300, height: 300 });
    });

    it('cuts where the square was moved to, not where it started', async () => {
      canvas = stubCanvas();
      render();
      box().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      flushSync();
      await app.cut();
      expect(canvas.drawn[0]).toBe(62);
    });

    it('lets go of what the picture was loaded from', () => {
      let released = 0;
      render({ loaded: { ...LOADED, close: () => { released += 1; } } });
      app.close();
      expect(released).toBe(1);
    });

    it('puts the caret in the box', () => {
      render();
      app.focus();
      expect(document.activeElement).toBe(box());
    });
  });
});
