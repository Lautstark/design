import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

/*
 * The modules in docs/lib/ that ship behaviour rather than colour maths, and
 * since 2026-09-17 the components in svelte/ that ship markup.
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
 * close and fires `close`. That is also what lets the Sheet component's
 * open and close be asserted directly rather than inferred.
 *
 * What it does not implement is layout: getBoundingClientRect answers zeroes.
 * The one test that needs a real rectangle stubs it rather than pretending,
 * because the thing under test there is a comparison against a rectangle and a
 * zero-sized one would make every press "outside" and the test vacuous.
 *
 * Two lines below are not optional and both were measured rather than guessed:
 *
 * `resolve: { conditions: ['browser'] }` - without it vitest resolves svelte's
 * `server` export, `mount()` throws `lifecycle_function_unavailable`, every
 * test in the file fails at once, and the message says nothing about
 * configuration. It is the first thing to write and the first thing to check.
 *
 * The full `svelte()` plugin - mitreden's recorded crash (the plugin's
 * optimizeDeps set turning vitest's dependency optimizer on, which dies on
 * node:module before collection) does not reproduce at these versions, and a
 * package whose tests mount components wants the real compiler rather than a
 * `compileModule` shim that only handles rune modules.
 */
export default defineConfig({
  plugins: [svelte()],
  resolve: { conditions: ['browser'] },
  test: {
    include: ['tests/*.test.js'],
    environment: 'happy-dom',
  },
});
