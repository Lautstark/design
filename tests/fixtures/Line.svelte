<script lang="ts">
  /* A body, head or foot for the imperative sheet's tests: it prints the state
     it was handed and offers a press that closes the sheet through the handle,
     which is the seam `openSheet` exists to provide. */
  import type { Handle } from '../../svelte/sheet.js';
  let { s, handle }: { s: string; handle: Handle } = $props();
</script>

<p class="said">{s}</p>
<button class="btn" type="button" onclick={() => handle.close()}>weg</button>
