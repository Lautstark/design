/*
 * sRGB <-> OKLab <-> OKLCH, plus WCAG contrast.
 *
 * Why OKLCH and not HSL: the whole point of this file is "take the neutrals a
 * step darker" and "make this accent legible as text". In HSL both operations
 * lie. Dropping HSL lightness by a fixed amount moves a yellow far less than it
 * moves a blue, and rotating nothing while changing lightness still shifts the
 * apparent hue of a saturated colour. OKLab is built so that equal steps look
 * equal, which is exactly what a token ramp needs.
 *
 * No dependencies, on purpose: this module is imported unchanged by the gallery
 * page in the browser and by build.js under node. One implementation, two
 * surfaces — if the maths lived twice it would disagree twice.
 */

/* ------------------------------------------------------------ sRGB <-> hex */

export function hexToRgb(hex) {
  const h = hex.trim().replace(/^#/, '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`not a hex colour: ${hex}`);
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}

export function rgbToHex([r, g, b]) {
  const byte = (c) => {
    const v = Math.round(Math.min(1, Math.max(0, c)) * 255);
    return v.toString(16).padStart(2, '0');
  };
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}

/* ------------------------------------------------- gamma <-> linear light */

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/* ------------------------------------------------------- sRGB <-> OKLab */

export function rgbToOklab([r, g, b]) {
  const R = toLinear(r), G = toLinear(g), B = toLinear(b);

  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);

  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

export function oklabToRgb([L, a, bb]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * bb) ** 3;

  return [
    toGamma(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ];
}

/* ------------------------------------------------------ OKLab <-> OKLCH */

export function oklabToOklch([L, a, b]) {
  return [L, Math.hypot(a, b), (Math.atan2(b, a) * 180) / Math.PI];
}

export function oklchToOklab([L, C, H]) {
  const rad = (H * Math.PI) / 180;
  return [L, C * Math.cos(rad), C * Math.sin(rad)];
}

export const hexToOklch = (hex) => oklabToOklch(rgbToOklab(hexToRgb(hex)));

/*
 * OKLCH -> hex, clamped into sRGB.
 *
 * A hue/chroma pair can name a colour no monitor can show, and the naive fix
 * (clip each channel at 0 and 1) shifts the hue while it does so — a bright
 * accent clipped that way comes back a different colour. Instead hold L and H
 * and walk chroma down until the result fits, which is the standard gamut
 * mapping and keeps the colour recognisably the one that was asked for.
 */
export function oklchToHex([L, C, H]) {
  const fits = (rgb) => rgb.every((c) => c >= -0.0001 && c <= 1.0001);

  let rgb = oklabToRgb(oklchToOklab([L, C, H]));
  if (fits(rgb)) return rgbToHex(rgb);

  let lo = 0, hi = C;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (fits(oklabToRgb(oklchToOklab([L, mid, H])))) lo = mid;
    else hi = mid;
  }
  return rgbToHex(oklabToRgb(oklchToOklab([L, lo, H])));
}

/* ------------------------------------------------------------- contrast */

/* WCAG 2.1 relative luminance. Note this is NOT OKLab's L: the two disagree,
   and it is the WCAG number that decides whether a ratio passes. */
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(hexA, hexB) {
  const a = luminance(hexA), b = luminance(hexB);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/*
 * Walk a colour's lightness until it clears `target` against `ground`.
 *
 * `dir` is +1 to lighten and -1 to darken. This is the routine that the three
 * shipped contrast bugs all needed and none of them had: white-on-salmon at
 * 2.48:1 on bildhaft's delete-everything button, --text-faint at 2.89:1, and a
 * --text-faint ported from mitreden that still read 4.04:1 on the ground it
 * actually sat on. Every one of those was somebody choosing a hex by eye.
 *
 * Returns the first passing colour, or the endpoint if the hue simply cannot
 * get there — callers check the ratio afterwards rather than trusting it.
 */
export function solveContrast([L, C, H], ground, target, dir) {
  const limit = dir > 0 ? 1 : 0;
  let best = oklchToHex([L, C, H]);
  if (contrast(best, ground) >= target) return best;

  for (let i = 1; i <= 100; i++) {
    const l = L + dir * (Math.abs(limit - L) * i) / 100;
    const hex = oklchToHex([l, C, H]);
    if (contrast(hex, ground) >= target) return hex;
    best = hex;
  }
  return best;
}
