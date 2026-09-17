/*
 * A reactive props object for the component tests.
 *
 * `mount()` hands back a component's *exports*, not its props, so assigning to
 * what it returns changes nothing — which is a failure that reads like the
 * component ignoring the new value. Props move when the object they came from
 * is reactive, and a rune only exists in a file the compiler has seen. Hence a
 * `.svelte.js` beside the tests rather than a helper inside one.
 *
 * It is also the shape a consumer has: every one of these components is
 * mounted by another component, where every prop expression is already
 * reactive.
 */
export function props(initial) {
  // A declaration initializer, which is the only place the rune is allowed;
  // for an object it hands back a proxy, so the caller can go on writing
  // fields on it and every read inside the component sees them.
  const reactive = $state(initial);
  return reactive;
}
