<script lang="ts">
  /* A product's page, as small as one can be and still be one: the four
     snippets the sidebar takes, a collapse control drawn by the brand row
     rather than by the component, and the reveal and the bar beside it wired
     to the same column.

     It exists because the seams §6.3 argues hardest about are snippets, and a
     snippet cannot be written from a plain props object. What is asserted
     against it is that the product's markup arrives where the product put it,
     that the sections are one snippet with the product's own wrappers and
     headings inside them, and that the wiring reaches a button this file
     owns. */
  import Sidebar from '../../svelte/Sidebar.svelte';
  import Reveal from '../../svelte/Reveal.svelte';
  import TopBar from '../../svelte/TopBar.svelte';

  let {
    drawer = false,
    collapsed = false,
    searching = false,
  }: { drawer?: boolean; collapsed?: boolean; searching?: boolean } = $props();

  let showing = $state(false);
</script>

<Sidebar
  id="sidebar"
  label="Sammlungen"
  closeLabel="Zu"
  closeId="sidebarClose"
  {drawer}
  {collapsed}
  bind:showing
>
  {#snippet brand(wired)}
    <h1>vorlaut</h1>
    <button id="sidebarHide" class="btn quiet icon" type="button" {...wired}>‹</button>
  {/snippet}
  {#snippet search()}
    <div class="sidebar__part"><input id="q" class="field" type="search" /></div>
  {/snippet}
  {#snippet sections()}
    <!-- The heading is part of what a search swaps, which is why there is one
         snippet here and not three. -->
    <div class="sidebar__section sidebar__section--collections">
      <h2>{searching ? '2 Treffer' : 'Sammlungen'}</h2>
      <div class="collections"></div>
    </div>
  {/snippet}
  {#snippet foot()}
    <button id="settingsLink" class="btn quiet sm" type="button">Einstellungen</button>
  {/snippet}
</Sidebar>

<Reveal id="reveal" controls="sidebar" shown={!showing}>
  {#snippet brand(wired)}
    <button id="sidebarShowBtn" class="btn quiet icon" type="button" {...wired}>›</button>
    <span class="logo"></span>
  {/snippet}
</Reveal>

<TopBar buttonId="sidebarOpenBtn" controls="sidebar" expanded={showing} label="Sammlungen zeigen">
  {#snippet brand()}<h1>vorlaut</h1>{/snippet}
</TopBar>
