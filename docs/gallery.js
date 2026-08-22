/*
 * The gallery is the generator with a hue picker on it.
 *
 * It imports the same modules build.js does and applies their output straight to
 * the document, so there is nothing here that could drift from what ships. If
 * this page looks right, the file written into the products is right, because it
 * is the identical function call.
 */

import { derive, deriveScheme } from './lib/derive.js';
import { contrast } from './lib/oklch.js';
import { toCss } from './lib/emit.js';

const PRODUCTS = { '#ff6b35': 'bildhaft', '#ff8bc7': 'mitreden', '#9b7bff': 'vorlaut' };

const PLANES = ['bg', 'surface', 'surface-2', 'surface-3', 'line'];
const TEXTS = ['text', 'text-dim', 'text-faint'];
const ACCENTS = ['accent', 'accent-ink', 'accent-strong', 'accent-hover', 'accent-soft',
                 'danger', 'danger-ink', 'danger-soft'];

let accent = '#ff6b35';
let scheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------------ render */

function swatch(name, value, tokens) {
  /* Show each token against a ground it is actually used on, so the tile is a
     demonstration rather than a colour chip: text tokens print on --surface-2
     because that is what they are solved against, ink prints on its own fill. */
  let ground = tokens.surface, ink = tokens.text;
  if (TEXTS.includes(name)) { ground = tokens['surface-2']; ink = value; }
  else if (name === 'accent-ink') { ground = tokens.accent; ink = value; }
  else if (name === 'danger-ink') { ground = tokens.danger; ink = value; }
  else if (name === 'accent-strong') { ground = tokens['accent-soft']; ink = value; }
  else if (name === 'danger') { ground = tokens['danger-soft']; ink = value; }
  else { ground = value; ink = contrast(value, tokens.text) >= contrast(value, tokens.bg) ? tokens.text : tokens.bg; }

  const el = document.createElement('div');
  el.className = 'swatch';
  el.innerHTML = `
    <div class="sample" style="background:${ground}"><span style="color:${ink}">Aa</span></div>
    <div class="meta"><div class="name">--${name}</div><div class="val">${value}</div></div>`;
  return el;
}

function fill(id, names, tokens) {
  const host = $(id);
  host.replaceChildren(...names.map((n) => swatch(n, tokens[n], tokens)));
}

function renderAudit(checks) {
  $('audit').replaceChildren(...checks.map(({ fg, bg, ratio, target, pass }) => {
    const tr = document.createElement('tr');
    tr.className = pass ? 'pass' : 'fail';
    tr.innerHTML = `<td><code>${fg}</code></td><td><code>${bg}</code></td>
      <td class="ratio">${ratio.toFixed(2)}:1</td>
      <td><code>${target}:1</code></td>
      <td class="verdict">${pass ? 'passes' : 'FAILS'}</td>`;
    return tr;
  }));
}

/* The CSS block, syntax-lit by hand — a highlighter would be a dependency, and
   there are exactly two things to colour. */
function renderCss(css) {
  $('css').innerHTML = css
    .replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="cm">$1</span>')
    .replace(/^(\s*)(--[a-z0-9-]+)/gm, '$1<span class="tok">$2</span>');
}

function render() {
  const product = PRODUCTS[accent.toLowerCase()] ?? null;
  const opts = { ok: product === 'mitreden' };
  const { tokens, checks } = deriveScheme(accent, scheme, opts);

  /* Applied to the root as inline custom properties: the page then styles itself
     with the very values it is describing. */
  const root = document.documentElement;
  for (const [k, v] of Object.entries(tokens)) root.style.setProperty(`--${k}`, v);
  root.style.colorScheme = scheme;

  fill('sw-planes', PLANES, tokens);
  fill('sw-text', TEXTS, tokens);
  fill('sw-accent', ACCENTS.filter((n) => n in tokens), tokens);
  renderAudit(checks);
  renderCss(toCss(accent, product ?? 'your-product', opts));

  $('scheme').textContent = scheme === 'dark' ? 'Light' : 'Dark';
  $('scheme').setAttribute('aria-pressed', String(scheme === 'dark'));
  for (const b of document.querySelectorAll('.hue')) {
    b.style.background = b.dataset.hue;
    b.setAttribute('aria-pressed', String(b.dataset.hue.toLowerCase() === accent.toLowerCase()));
  }
}

/* ------------------------------------------------------------------ events */

for (const b of document.querySelectorAll('.hue')) {
  b.addEventListener('click', () => { accent = b.dataset.hue; $('pick').value = accent; render(); });
}
$('pick').addEventListener('input', (e) => { accent = e.target.value; render(); });
$('scheme').addEventListener('click', () => { scheme = scheme === 'dark' ? 'light' : 'dark'; render(); });

$('copy').addEventListener('click', async () => {
  const product = PRODUCTS[accent.toLowerCase()] ?? 'your-product';
  await navigator.clipboard.writeText(toCss(accent, product, { ok: product === 'mitreden' }));
  const flag = $('copied');
  flag.hidden = false;
  setTimeout(() => { flag.hidden = true; }, 2000);
});

/* Only follow the OS while the visitor has not overridden it. */
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!document.documentElement.dataset.userSet) { scheme = e.matches ? 'dark' : 'light'; render(); }
});
$('scheme').addEventListener('click', () => { document.documentElement.dataset.userSet = '1'; });

/* Chips are a filter demo: one at a time, and clicking one is not an action. */
$('chips').addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  for (const c of $('chips').querySelectorAll('.chip')) c.setAttribute('aria-pressed', String(c === b));
});

render();
