import { defineConfig } from 'vitest/config';

/*
 * The four modules in docs/lib/ that ship behaviour rather than colour maths.
 *
 * They had no tests for a long time and the reason was defensible while this
 * package was a generator: build.js has no dependencies, the audit in CI runs
 * it with none, and that property is one the three products are protecting on
 * purpose. Then ./menu, ./dialog, ./rename and ./collections arrived, and the
 * argument stopped covering them - they are the family's shared *behaviour*,
 * every one of them exists because three products got the same thing subtly
 * wrong, and a change here lands in three places at once behind a tag.
 *
 * The audit job in CI still installs nothing. This is a second job.
 *
 * happy-dom rather than jsdom, and for one reason that decided it: jsdom has no
 * HTMLDialogElement.showModal at all, so dialog.js - which is the module whose
 * whole subject is what the platform gives you when you stop hand-building an
 * overlay - could not be run under it. happy-dom implements show/showModal/
 * close and fires `close`.
 *
 * What it does not implement is layout: getBoundingClientRect answers zeroes.
 * The one test that needs a real rectangle stubs it rather than pretending,
 * because the thing under test there is a comparison against a rectangle and a
 * zero-sized one would make every press "outside" and the test vacuous.
 */
export default defineConfig({
  test: {
    include: ['tests/*.test.js'],
    environment: 'happy-dom',
  },
});
