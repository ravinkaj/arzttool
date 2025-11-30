<script>
  import { onMount } from 'svelte';
  import TerminCard from '$lib/components/TerminCard.svelte';

  let termine = [];
  let loading = true;

  async function load() {
    loading = true;
    const res = await fetch('/api/termine');
    termine = await res.json();
    loading = false;
  }

  onMount(load);
</script>

<main>
  <h1>Termine</h1>
  {#if loading}
    <p>Lade Termine…</p>
  {:else}
    {#if termine.length}
      <div class="list">
        {#each termine as t}
          <TerminCard t={t} onDeleted={load} />
        {/each}
      </div>
    {:else}
      <p>Keine Termine vorhanden.</p>
    {/if}
  {/if}
</main>

<style>
  .list { display:flex; flex-direction:column; gap:0.75rem }
</style>
