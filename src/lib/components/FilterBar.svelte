<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  let fach = '';
  let city = '';
  let sort = '';
  export let praxen = [];
  
  // Derived options: Reaktiv neu berechnet, wenn praxen sich ändern
  $: cities = praxen?.length ? Array.from(new Set(praxen.map(p => p.city).filter(Boolean))).sort() : [];
  $: fachbereiche = praxen?.length ? Array.from(new Set(praxen.map(p => p.fach).filter(Boolean))).sort() : [];
  $: ratings = praxen?.length ? Array.from(new Set(praxen.map(p => p.rating).filter(r=>r!=null))).sort((a,b)=>b-a) : [];

  function apply() {
    dispatch('change', { fach, city, sort });
  }
  
  function clearAll() { 
    fach = ''; 
    city = ''; 
    sort = ''; 
    apply(); 
  }
</script>

<div class="filter">
  <div class="filter-inputs">
    <label class="filter-label">Fachbereich
      <input list="fach-list" bind:value={fach} placeholder="z.B. Allgemeinmedizin" />
      <datalist id="fach-list">
        {#each fachbereiche as f}
          <option value={f}></option>
        {/each}
      </datalist>
    </label>

    <label class="filter-label">Stadt
      <input list="city-list" bind:value={city} placeholder="z.B. Zürich" />
      <datalist id="city-list">
        {#each cities as c}
          <option value={c}></option>
        {/each}
      </datalist>
    </label>

    <label class="filter-label">Sortieren
      <select bind:value={sort}>
        <option value="">—</option>
        <option value="wait">Wartezeit ↑</option>
        <option value="wait_desc">Wartezeit ↓</option>
        <option value="rating_desc">Bewertung ↓</option>
        <option value="rating_asc">Bewertung ↑</option>
      </select>
    </label>
  </div>

  <div class="buttons">
    <button class="btn-primary" on:click={apply}>Anwenden</button>
    <button class="btn-link" on:click={clearAll}>Zurücksetzen</button>
  </div>
</div>

<style>
  .filter { 
    display: flex; 
    gap: 1rem; 
    align-items: flex-end; 
    justify-content: space-between;
    flex-wrap: wrap;
  }
  
  .filter-inputs {
    display: flex;
    gap: 0.75rem;
    align-items: flex-end;
    flex-wrap: wrap;
    flex: 1;
  }
  
  .filter-label { 
    display: flex; 
    flex-direction: column;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    gap: 0.4rem;
  }
  
  input, select {
    padding: 0.6rem 0.85rem;
    border-radius: 8px;
    border: 1px solid rgba(16,24,40,0.15);
    font-size: 0.95rem;
    min-width: 180px;
    background: #fff;
    transition: all 0.2s ease;
  }
  
  input:focus, select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(31,58,95,0.1);
  }
  
  .buttons { 
    display: flex; 
    gap: 0.5rem;
    align-items: center;
    margin-left: auto;
  }
  
  .btn-primary {
    background: var(--primary);
    color: #fff;
    border: none;
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  
  .btn-primary:hover {
    background: var(--primary-light);
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }
  
  .btn-link {
    background: transparent;
    color: var(--primary);
    border: none;
    padding: 0.625rem 0.75rem;
    cursor: pointer;
    text-decoration: underline;
    font-size: 0.95rem;
    font-weight: 500;
    white-space: nowrap;
    transition: all 0.2s ease;
  }
  
  .btn-link:hover {
    color: var(--primary-light);
  }
  
  @media (max-width: 768px) {
    .filter {
      flex-direction: column;
      align-items: stretch;
    }
    .buttons {
      margin-left: 0;
      justify-content: flex-end;
    }
  }
</style>
