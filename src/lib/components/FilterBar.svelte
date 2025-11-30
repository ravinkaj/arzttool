<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  let fach = '';
  let city = '';
  let sort = '';
  export let praxen = [];
  // derived options
  $: cities = Array.from(new Set((praxen || []).map(p => p.city).filter(Boolean))).sort();
  $: fachbereiche = Array.from(new Set((praxen || []).map(p => p.fach).filter(Boolean))).sort();
  $: ratings = Array.from(new Set((praxen || []).map(p => p.rating).filter(r=>r!=null))).sort((a,b)=>b-a);

  function apply() {
    dispatch('change', { fach, city, sort });
  }
  function clearAll() { fach=''; city=''; sort=''; apply(); }
</script>

<div class="filter">
  <label>Fachbereich<br/>
    <input list="fach-list" bind:value={fach} placeholder="z.B. Allgemeinmedizin" />
    <datalist id="fach-list">
      {#each fachbereiche as f}
        <option value={f} />
      {/each}
    </datalist>
  </label>

  <label>Stadt<br/>
    <input list="city-list" bind:value={city} placeholder="z.B. Zürich" />
    <datalist id="city-list">
      {#each cities as c}
        <option value={c} />
      {/each}
    </datalist>
  </label>

  <label>Sortieren<br/>
    <select bind:value={sort}>
      <option value="">—</option>
      <option value="wait">Wartezeit ↑</option>
      <option value="wait_desc">Wartezeit ↓</option>
      <option value="rating_desc">Bewertung ↓</option>
      <option value="rating_asc">Bewertung ↑</option>
    </select>
  </label>

  <div class="buttons">
    <button class="btn-primary" on:click={apply}>Anwenden</button>
    <button on:click={clearAll}>Zurücksetzen</button>
  </div>
</div>

<style>
  .filter { display:flex; gap:0.75rem; align-items:end; flex-wrap:wrap }
  label { display:flex; flex-direction:column }
  .buttons { display:flex; gap:0.5rem }
</style>
