<script>
  import { onMount } from 'svelte';
  import { session } from '$lib/auth/auth.js';
  import { ensureSampleData, getPatientsForOwner, getPraxenForOwner } from '$lib/utils/praxisStore.js';

  let loading = true;
  let patients = [];
  let praxen = [];
  let selectedPraxis = 'all';
  let search = '';

  function slugifyName(name=''){return `pt-${String(name).normalize('NFD').replace(/[^\w\s-]/g,'').trim().toLowerCase().replace(/\s+/g,'-')}`;}

  function load(){
    if (typeof window === 'undefined') return;
    loading = true;
    ensureSampleData();
    const ownerId = $session?.userId || 'sample_owner';
    patients = getPatientsForOwner(ownerId) || [];
    praxen = getPraxenForOwner(ownerId) || [];
    loading = false;
  }

  $: filtered = (patients || [])
    .filter((p) => selectedPraxis === 'all' || String(p.praxisId) === String(selectedPraxis))
    .filter((p) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return String(p.fullName || '').toLowerCase().includes(q);
    })
    .sort((a,b) => String(a.fullName || '').localeCompare(String(b.fullName || '')));

  onMount(load);
</script>

<main class="container">
  {#if !$session || $session.role !== 'praxis'}
    <div class="card">Diese Seite ist nur fuer Praxis-Accounts. Bitte <a href="/login">anmelden</a>.</div>
  {:else}
    <div class="page-header">
      <h1>Patienten</h1>
      <p class="subtitle">Alle Patienten mit Terminen in Ihren Praxen.</p>
    </div>

    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">Praxis filtern</label>
          <select class="filter-select" bind:value={selectedPraxis}>
            <option value="all">Alle Praxen</option>
            {#each praxen as p}
              <option value={p._id || p.id}>{p.name}</option>
            {/each}
          </select>
        </div>
        <div class="search-group">
          <label class="filter-label">Suche</label>
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              class="search-input" 
              type="search" 
              placeholder="Name suchen..." 
              bind:value={search} 
            />
            {#if search}
              <button class="clear-btn" on:click={() => search = ''}>✕</button>
            {/if}
          </div>
        </div>
      </div>
    </div>

    {#if loading}
      <p>Lade...</p>
    {:else if !filtered.length}
      <div class="card">Keine Patienten gefunden.</div>
    {:else}
      <div class="grid">
        {#each filtered as p}
          <a class="card patient" href={`/praxis/patienten/${p.id || slugifyName(p.fullName)}`}>
            <div class="card-head">
              <div>
                <div class="name">{p.fullName}</div>
                <div class="muted">{p.praxisName}</div>
              </div>
              <div class="insurance">{p.healthInsurance}</div>
            </div>
            <div class="row-line"><span class="label">Kontakt</span><span class="value">{p.phone} · {p.email}</span></div>
            <div class="row-line"><span class="label">Adresse</span><span class="value">{p.address}</span></div>
            <div class="row-line"><span class="label">Vers.-Nr.</span><span class="value">{p.insuranceNumber}</span></div>
            <div class="row-line"><span class="label">Hinweis</span><span class="value">{p.medicalNote}</span></div>
          </a>
        {/each}
      </div>
    {/if}
  {/if}
</main>

<style>
  .filter-section{margin:1.5rem 0 2rem;padding:1.5rem;background:var(--secondary);border:1px solid var(--border);border-radius:12px}
  .filter-row{display:flex;gap:1rem;flex-wrap:wrap}
  .filter-group{flex:1;min-width:200px}
  .search-group{flex:2;min-width:300px}
  .filter-label{display:block;font-size:0.875rem;font-weight:600;color:#374151;margin-bottom:0.4rem}
  .filter-select{width:100%;padding:0.6rem 0.85rem;border-radius:8px;border:1px solid rgba(16,24,40,0.15);background:#fff;font-size:0.95rem;transition:all 0.2s ease}
  .filter-select:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px rgba(59,130,246,0.1)}
  .search-wrapper{position:relative;display:flex;align-items:center}
  .search-icon{position:absolute;left:0.85rem;pointer-events:none;opacity:0.5}
  .search-input{width:100%;padding:0.6rem 2.5rem 0.6rem 2.5rem;border-radius:8px;border:1px solid rgba(16,24,40,0.15);background:#fff;font-size:0.95rem;transition:all 0.2s ease}
  .search-input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px rgba(59,130,246,0.1)}
  .search-input::placeholder{color:#9ca3af}
  .clear-btn{position:absolute;right:0.65rem;background:transparent;border:none;padding:0.25rem 0.4rem;cursor:pointer;font-size:0.95rem;color:#6b7280;border-radius:4px;transition:all 0.2s ease}
  .clear-btn:hover{background:rgba(16,24,40,0.05);color:#111827}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:0.75rem}
  .card.patient{display:block;padding:0.85rem;border:1px solid rgba(16,24,40,0.06);border-radius:12px;text-decoration:none;color:inherit;background:#fff;transition:all 0.15s ease}
  .card.patient:hover{box-shadow:0 8px 18px rgba(15,23,42,0.08);border-color:rgba(16,24,40,0.12);background:rgba(255,255,255,0.98)}
  .card-head{display:flex;justify-content:space-between;gap:0.75rem;align-items:flex-start;margin-bottom:0.35rem}
  .name{font-weight:700;font-size:1.05rem}
  .insurance{background:#f8fafc;border:1px solid rgba(16,24,40,0.06);border-radius:8px;padding:4px 8px;font-size:0.9rem}
  .row-line{display:flex;gap:0.5rem;margin-top:0.25rem}
  .label{min-width:82px;color:var(--muted);font-weight:500}
  .value{flex:1;color:#0f172a}
</style>
