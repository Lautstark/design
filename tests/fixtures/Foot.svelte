<script lang="ts">
  /* A product's footer and the dialog it opens, as small as one can be and
     still be one.

     It exists because both seams are snippets: the credit line above the links
     and the links themselves in the footer, and one page's prose in the legal
     dialog. What is asserted against it is that the shell is shared and every
     word in it is the product's — including the wrapper bildhaft puts its four
     links in and the other two do not, which is why the component draws none. */
  import Footer from '../../svelte/Footer.svelte';
  import Legal from '../../svelte/Legal.svelte';

  let {
    attribution = '',
    page = $bindable(null),
  }: { attribution?: string; page?: string | null } = $props();

  const PAGES = [
    { key: 'about', title: 'Was ist vorlaut?', id: 'aboutPage' },
    { key: 'impressum', title: 'Impressum', id: 'impressumPage' },
    { key: 'privacy', title: 'Datenschutz', id: 'privacyPage' },
  ];
</script>

<Footer id="foot" credit={attribution}>
  <p class="footer__links">
    <button class="linklike" type="button" onclick={() => { page = 'about'; }}>Was ist das?</button>
    <button class="linklike" type="button" onclick={() => { page = 'impressum'; }}>Impressum</button>
    <button class="linklike" type="button" onclick={() => { page = 'privacy'; }}>Datenschutz</button>
    <a href="https://github.com/Lautstark" target="_blank" rel="noreferrer noopener">Quellcode</a>
  </p>
</Footer>

<Legal bind:page pages={PAGES} id="legal" class="legal" closeLabel="Schließen">
  {#snippet children(key)}<p class="lead">{key}</p>{/snippet}
</Legal>
