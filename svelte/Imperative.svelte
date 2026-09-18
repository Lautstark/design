<script lang="ts">
  /**
   * What `./svelte/sheet`'s `openSheet` mounts. Not exported: the imperative
   * half of conventions.md §6.1 is a function, and this is the one component
   * between it and `Sheet`.
   *
   * It exists because the two halves take their content differently and must
   * not diverge in what they draw. A declarative caller has snippets; an
   * imperative one — a controller module that opens a sheet from a menu item,
   * which is most of vorlaut and half of mitreden — has components and a piece
   * of state to hand them. So the options' three components become the three
   * snippets `Sheet` takes, and `Sheet` goes on being the only file that knows
   * what a sheet looks like.
   */
  import Sheet from './Sheet.svelte';
  import type { SheetOptions, Handle } from './sheet.js';

  let { options, handle }: { options: SheetOptions<unknown>; handle: Handle } = $props();

  let dialog = $state<HTMLDialogElement | undefined>(undefined);
  let body = $state<HTMLElement | undefined>(undefined);

  /* The handle is a plain object on purpose — `openSheet` hands it back to a
     caller that is not in a reactive context and would see nothing change. It
     is filled here rather than read out of the DOM, so the two names on it mean
     exactly the elements `Sheet` drew. */
  $effect(() => {
    if (dialog) handle.dialog = dialog;
    if (body) handle.body = body;
  });
</script>

{#snippet headContent()}
  {@const Head = options.head!}
  <Head s={options.state} {handle} />
{/snippet}

{#snippet footContent()}
  {@const Foot = options.foot!}
  <Foot s={options.state} {handle} />
{/snippet}

{#snippet bodyContent()}
  {@const Body = options.body}
  <Body s={options.state} {handle} />
{/snippet}

<!-- The two optional snippets are passed as values rather than declared inline,
     because which of them is present is the difference between a sheet with a
     heading and one without, and between a `.foot` being drawn and not. -->
<Sheet
  open
  id={options.id}
  titleId={options.titleId}
  closeId={options.closeId}
  bodyId={options.bodyId}
  title={options.title}
  closeLabel={options.closeLabel}
  panels={options.panels}
  wide={options.wide}
  class={options.class}
  onclose={options.onClose}
  bind:dialog
  bind:body
  head={options.head ? headContent : undefined}
  foot={options.foot ? footContent : undefined}
  children={bodyContent}
/>
