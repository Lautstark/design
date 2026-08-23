/*
 * The scheme a person chose, remembered and applied.
 *
 * tokens/<product>.css carries three rules: the OS's scheme by default, and a
 * :root[data-theme] override for each of the two answers somebody can give
 * instead. This is the half that decides which of them is in force — the same
 * decision in all three products, so it is made here rather than three times.
 *
 * Three values, not a checkbox. "Follows the OS" is a real answer and the
 * default one; a two-state toggle has to open in one of the other two and
 * therefore has to guess, which is how a tablet that dims itself at dusk ends
 * up pinned bright. `system` is the absence of the attribute, so the choice not
 * to choose leaves no trace in the markup.
 */

/** @typedef {'system' | 'light' | 'dark'} Theme */

/** @type {readonly Theme[]} */
export const THEMES = ['system', 'light', 'dark'];

const isTheme = (value) => THEMES.includes(/** @type {Theme} */ (value));

/*
 * localStorage, and not the database the rest of a product's settings live in.
 * Not a preference: IndexedDB is asynchronous, so a scheme read from it arrives
 * after the first paint and the page flashes the OS's answer before correcting
 * itself — which is worst in exactly the case somebody set this to avoid, a
 * light flare on a dark page. This is the one setting that has to be readable
 * synchronously, and localStorage is the only store that is.
 */

/** @param {string} key  storage key, by convention `<product>.theme` */
export function readTheme(key) {
  try {
    const saved = localStorage.getItem(key);
    return isTheme(saved) ? /** @type {Theme} */ (saved) : 'system';
  } catch {
    // Safari in private browsing throws on access rather than returning null.
    return 'system';
  }
}

/** @param {string} key @param {Theme} theme */
export function saveTheme(key, theme) {
  try {
    if (theme === 'system') localStorage.removeItem(key);
    else localStorage.setItem(key, theme);
  } catch { /* nothing to do; the scheme still applies for this session */ }
}

/** Which scheme is actually on screen, with `system` resolved against the OS. */
export function resolveTheme(theme) {
  if (theme !== 'system') return theme;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Put a scheme in force. Everything visual follows from the attribute; the one
 * thing that cannot is the browser chrome around the page, which reads a meta
 * tag and has to be told separately.
 *
 * @param {Theme} theme
 */
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
  paintChrome();
}

/*
 * The address bar, and on iOS the area behind the status bar. It is set from
 * the resolved --bg rather than from a colour written here, so it is right for
 * whichever product this is without any of them declaring their own — and it
 * stays right when the accent moves, because --bg is derived from the accent.
 *
 * Read after the attribute is set, so getComputedStyle sees the scheme that
 * won. A hardcoded value in index.html is what this replaces: vorlaut's said
 * #161618 and so described a dark page in both schemes.
 */
function paintChrome() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (!bg) return;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', bg);
}

/**
 * Read the stored choice, put it in force, and keep the browser chrome correct
 * if the OS changes its mind while `system` is in force. Returns what was
 * stored, for a settings panel that has to show it.
 *
 * The CSS needs no such listener — the media query in the token file is already
 * live. This is only the meta tag, which is not CSS and does not re-evaluate.
 *
 * @param {string} key
 * @returns {Theme}
 */
export function initTheme(key) {
  const theme = readTheme(key);
  applyTheme(theme);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (readTheme(key) === 'system') paintChrome();
  });
  return theme;
}

/**
 * The same read, small enough to inline in <head> before the stylesheet.
 *
 * Without it the page paints once in the OS's scheme and then corrects itself,
 * because the module that would set the attribute is deferred behind the
 * bundle. A product drops this string into index.html inside a <script> — it
 * touches nothing but the attribute, so the tokens are right on the first
 * paint and applyTheme() later finds its own work already done.
 *
 * @param {string} key
 */
export const bootSnippet = (key) =>
  `try{var t=localStorage.getItem(${JSON.stringify(key)});`
  + `if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
