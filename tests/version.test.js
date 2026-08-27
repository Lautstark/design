import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/* The lockfile's own version has to be the one package.json states.
 *
 * npm writes the package's version into package-lock.json in two places and
 * treats them as a mirror of package.json, not as something it solves. Nothing
 * reads them: a consumer pins this package by git tag and gets its version from
 * package.json, so a stale pair here changes no install anywhere and breaks
 * nothing that would show up in `npm run check` or in the other four suites.
 *
 * What it does instead is quieter. A release here is a hand-edit to
 * package.json - there is no `npm version` step and no release script - so the
 * two files part company at every bump, and from then on the first `npm install`
 * in any fresh worktree rewrites the lockfile as a side effect of installing.
 * Every agent's tree comes up dirty in a file they did not open, which is a good
 * way to have a version bump land inside somebody else's commit, or to have a
 * real lockfile change reverted by whoever noticed the noise first.
 *
 * It had drifted two releases, 1.15.0 against 1.17.0, before an agent tripped
 * over the dirty tree and looked. This is cheaper than looking.
 *
 * When this fails, the bump did not reach the lockfile. `npm install
 * --package-lock-only` writes it without touching node_modules, and the diff
 * should be the two version lines and nothing else.
 *
 * Only the version is checked. The resolved dependency tree below it is npm's
 * to solve and no business of a test - the question here is whether two files
 * that must agree still do.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const read = (name) => JSON.parse(readFileSync(join(ROOT, name), 'utf8'));

describe('package-lock.json', () => {
  const pkg = read('package.json');
  const lock = read('package-lock.json');

  /* Both of them, because npm writes both and a bump that updated only the
   * root one would leave the same silence in a smaller place. */
  it('states the version package.json states', () => {
    expect(lock.version).toBe(pkg.version);
    expect(lock.packages[''].version).toBe(pkg.version);
  });

  it('is the lockfile for this package', () => {
    expect(lock.name).toBe(pkg.name);
    expect(lock.packages[''].name).toBe(pkg.name);
  });
});
