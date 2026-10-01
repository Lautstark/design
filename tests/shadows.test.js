import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

/* shadows.js, run the way a product runs it: from the product's root, with
 * this package under node_modules and the product's stylesheets under src/.
 *
 * The shared sheet here is a small stand-in rather than components.css, so a
 * case says exactly which class it is about. The cases that matter are the
 * ones the old reader skipped: it split on `}` and dropped any stretch with an
 * `@` in it, which took the rule after an @import and the first rule inside
 * every @media with the at-rule - so those shadows were never reported.
 */

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'shadows.js');
const SHARED = '.btn { color: red } .field { color: red } .chip { color: red } .sheet { color: red }';

let dir;
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

const run = (css, ...args) => {
  dir = mkdtempSync(join(tmpdir(), 'shadows-'));
  const shared = join(dir, 'node_modules', '@lautstark', 'design', 'docs');
  mkdirSync(shared, { recursive: true });
  writeFileSync(join(shared, 'components.css'), SHARED);
  mkdirSync(join(dir, 'src'));
  writeFileSync(join(dir, 'src', 'app.css'), css);
  const done = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: dir, encoding: 'utf8' });
  return { out: done.stdout, status: done.status };
};

/** The class names reported as unexplained. */
const unexplained = (out) => [...out.matchAll(/✗ \.([\w-]+)/g)].map((m) => m[1]).sort();

describe('shadows.js', () => {
  it('reads the rule straight after an @import', () => {
    const { out, status } = run('@import "fonts.css";\n.btn { color: blue }', '--strict');
    expect(unexplained(out)).toEqual(['btn']);
    expect(status).toBe(1);
  });

  it('reads the first rule inside a media query, and the ones after it', () => {
    const { out } = run('@media (max-width: 820px) { .btn { color: blue } .field { color: blue } }');
    expect(unexplained(out)).toEqual(['btn', 'field']);
  });

  it('reads through nested at-rules', () => {
    const { out } = run('@layer app { @supports (display: grid) { .chip { color: blue } } }');
    expect(unexplained(out)).toEqual(['chip']);
  });

  it('drops the at-rule itself, not what follows it', () => {
    const { out } = run('@font-face { font-family: x; src: url(x.woff2) }\n.sheet { color: blue }');
    expect(unexplained(out)).toEqual(['sheet']);
  });

  it('still leaves an aimed rule alone, nested or not', () => {
    const { out, status } = run('.row .btn { color: blue }\n.row { .field { color: blue } }\ndialog.sheet { color: blue }', '--strict');
    expect(unexplained(out)).toEqual([]);
    expect(status).toBe(0);
  });

  it('is not thrown by a brace inside a string', () => {
    const { out } = run('.x::before { content: "{" }\n.btn { color: blue }');
    expect(unexplained(out)).toEqual(['btn']);
  });

  it('takes a written reason', () => {
    const { out, status } = run('/* shadows .btn: read from four metres away. */\n@import "x.css";\n.btn { color: blue }', '--strict');
    expect(unexplained(out)).toEqual([]);
    expect(out).toContain('(says why)');
    expect(status).toBe(0);
  });
});
