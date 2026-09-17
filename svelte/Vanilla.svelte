<script lang="ts">
  /* A node built outside Svelte — one of the family's shared panels, which are
     plain DOM by design — standing among components. `display: contents` keeps
     the wrapper out of the layout, so the panel sits in its parent's grid or
     flex as the direct child it would otherwise have been; nothing in the
     stylesheets addresses these panels by parent, which is what makes the
     wrapper safe.

     wochenwerk's, which is where the shape was piloted (bildhaft adr/0003),
     and by 2026-09-17 it was in all four products character-identical but for
     one token: two typed the prop `HTMLElement` and two `Node`. `Node` is the
     one that is true — `replaceChildren` takes any of them — so four files
     become this one. conventions.md §6.10.

     The `style` is inline rather than in a `<style>` block on purpose. A
     scoped rule would put a class on this wrapper and the class would reach
     every consumer's contract test as a name components.css does not draw;
     this component has no arrangement worth a stylesheet, only the one
     declaration that makes it disappear. */
  let { node }: { node: Node | null | undefined } = $props();
  let host: HTMLElement;
  $effect(() => { if (node) host.replaceChildren(node); else host.replaceChildren(); });
</script>

<div bind:this={host} style="display:contents"></div>
