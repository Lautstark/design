/*
 * Empty on purpose, and present on purpose.
 *
 * The components here are plain Svelte 5 with `lang="ts"`, which the compiler
 * strips itself — there is no preprocessor to configure and this package has
 * no build step to configure one for. What the file buys is that
 * vite-plugin-svelte and svelte-check stop guessing: without it the plugin
 * prints "no Svelte config found ... using default configuration" on every run,
 * which is a line somebody eventually goes looking for a cause behind.
 */
export default {};
