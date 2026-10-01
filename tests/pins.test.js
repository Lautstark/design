import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

/* pins.js, run the way a product runs it: as a script, in a directory with a
 * package.json, reading what it prints and how it exits.
 *
 * Only pins that are not tags are written here, because those are answered
 * without asking the remote - a tag pin is checked against `git ls-remote`,
 * and a unit test that needs the network is one that fails offline for a
 * reason that has nothing to do with the code.
 *
 * What is pinned is the case that used to slip through: a pin with no ref at
 * all, and npm's bare `Lautstark/x#ref` shorthand. Both were skipped as "not a
 * pin of ours", so the worst pin there is passed --strict without a word.
 */

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'pins.js');

let dir;
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

const run = (dependencies, ...args) => {
  dir = mkdtempSync(join(tmpdir(), 'pins-'));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'x', dependencies }));
  const env = { ...process.env };
  delete env.GITHUB_ACTIONS;
  const done = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: dir, encoding: 'utf8', env });
  return { out: done.stdout, status: done.status };
};

describe('pins.js', () => {
  it('reports a pin with no ref as loose, and fails --strict on it', () => {
    const { out, status } = run({ '@lautstark/design': 'github:Lautstark/design' }, '--strict');
    expect(out).toContain('@lautstark/design');
    expect(out).toContain('no ref (not a tag)');
    expect(out).toContain('1 not pinned to a tag');
    expect(status).toBe(1);
  });

  it('reads npm\'s bare shorthand as a pin of ours', () => {
    const { out, status } = run({ '@lautstark/werkzeuge': 'Lautstark/werkzeuge#main' }, '--strict');
    expect(out).toContain('main (not a tag)');
    expect(status).toBe(1);
  });

  it('reads the bare shorthand without a ref too', () => {
    const { out } = run({ '@lautstark/werkzeuge': 'Lautstark/werkzeuge' });
    expect(out).toContain('no ref (not a tag)');
  });

  it('still reports a branch on the github: form', () => {
    const { out, status } = run({ '@lautstark/design': 'github:Lautstark/design#main' }, '--strict');
    expect(out).toContain('main (not a tag)');
    expect(status).toBe(1);
  });

  it('warns rather than fails without --strict', () => {
    const { status } = run({ '@lautstark/design': 'github:Lautstark/design' });
    expect(status).toBe(0);
  });

  it('leaves everybody else\'s dependencies alone', () => {
    const { out, status } = run({ svelte: '^5', other: 'github:someone/else#main', deep: 'Lautstark/a/b' }, '--strict');
    expect(out).toContain('No github:Lautstark pins');
    expect(status).toBe(0);
  });
});
