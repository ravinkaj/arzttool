<script>
  import { onMount } from 'svelte';
  import TerminCard from '$lib/components/TerminCard.svelte';
  import { session } from '$lib/auth/auth.js';
  import { getTermine, cancelTermin } from '$lib/utils/termineStore.js';

  let termine = [];
  let praxen = [];
  let loading = true;
  let showBookingNotification = false;
  let bookingMessage = '';
  let selectedFilter = 'all'; // 'all', 'upcoming', 'past', 'cancelled'
  let searchQuery = '';
  let selectedDate = '';

  // Map praxis data to termine
  $: termineWithPraxisData = termine.map(t => {
    const praxis = praxen.find(p => (p._id || p.id) === t.praxisId);
    return {
      ...t,
      waitingPatients: (praxis?.waitingPatients ?? (function(){
        // Fallback: derive a deterministic 0-8 value from the praxisId digits
        const digits = String(t.praxisId || '').replace(/\D/g,'');
        if (!digits) return 0;
        return Number(digits) % 9; // 0..8
      })())
    };
  });

  function startOfToday(){ const d=new Date(); d.setHours(0,0,0,0); return d; }
  function endOfToday(){ const d=new Date(); d.setHours(23,59,59,999); return d; }
  function tomorrow(){ const d=new Date(); d.setDate(d.getDate() + 1); d.setHours(0,0,0,0); return d; }

  // Filter termine based on selected filter and search
  $: filteredTermine = (() => {
    if (!termineWithPraxisData || !termineWithPraxisData.length) return [];
    
    const now = new Date();
    let result = termineWithPraxisData;
    
    // Apply status filter
    switch(selectedFilter) {
      case 'upcoming':
        result = result.filter(t => {
          const time = new Date(t.dateTime || t.time);
          return time >= now && t.status !== 'Storniert' && t.status !== 'storniert';
        });
        break;
      case 'past':
        result = result.filter(t => {
          const time = new Date(t.dateTime || t.time);
          return time < now;
        });
        break;
      case 'cancelled':
        result = result.filter(t => 
          t.status === 'Storniert' || t.status === 'storniert' || t.status === 'Abgesagt' || t.status === 'abgesagt'
        );
        break;
      default: // 'all'
        break;
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => {
        const praxis = praxen.find(p => (p._id || p.id) === t.praxisId);
        const praxisName = praxis?.name || '';
        const praxisFach = praxis?.fach || '';
        return praxisName.toLowerCase().includes(query) ||
               praxisFach.toLowerCase().includes(query);
      });
    }

    // Apply date filter (exact day match)
    if (selectedDate) {
      result = result.filter(t => {
        const key = dateKey(t.dateTime || t.time);
        return key === selectedDate;
      });
    }
    
    return result;
  })();

  function dateKey(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Group termine by relative date
  $: groupedTermine = (() => {
    const groups = { today: [], tomorrow: [], upcoming: [], past: [] };
    const now = startOfToday();
    const tom = tomorrow();
    const eod = endOfToday();
    
    (filteredTermine || []).forEach(t => {
      const time = new Date(t.dateTime || t.time);
      if (time >= now && time <= eod) {
        groups.today.push(t);
      } else if (time >= tom && time < new Date(tom.getTime() + 24*60*60*1000)) {
        groups.tomorrow.push(t);
      } else if (time > eod) {
        groups.upcoming.push(t);
      } else {
        groups.past.push(t);
      }
    });
    
    return groups;
  })();

  async function load() {
    loading = true;
    
    // Lade Termine aus dem zentralen Store
    const allTermine = getTermine();
    termine = allTermine.sort((a, b) => new Date(a.dateTime || a.time) - new Date(b.dateTime || b.time));
    
    // Lade Praxen-Daten (Market + Owner-Demo)
    try {
      const res = await fetch('/api/praxen');
      if (res.ok) {
        praxen = await res.json();
      }
      // Ergänze Demo-Owner-Praxen, damit Zuordnung für owner-* IDs klappt
      const resOwner = await fetch('/api/praxen?ownerId=sample_owner');
      if (resOwner.ok) {
        const ownerList = await resOwner.json();
        praxen = praxen.concat(ownerList);
      }
    } catch (e) {
      console.error('Fehler beim Laden der Praxen:', e);
    }
    
    loading = false;
  }

  async function handleTerminCancelled(event) {
    const terminId = event.detail?.id;
    if (terminId) {
      cancelTermin(terminId);
      await load();
    }
  }

  onMount(() => {
    load();
    
    // Check for booking notification from localStorage
    if (typeof window !== 'undefined') {
      const bookingData = localStorage.getItem('lastBooking');
      
      if (bookingData) {
        showBookingNotification = true;
        const booking = JSON.parse(bookingData);
        bookingMessage = `✅ Termin erfolgreich gebucht: ${booking.date} um ${booking.time} bei ${booking.praxisName}`;
        
        // Clear after display
        setTimeout(() => {
          showBookingNotification = false;
          localStorage.removeItem('lastBooking');
        }, 5000);
      }
    }
  });
</script>

<main>
  <div class="container">
    <div class="header">
      <h1>Meine Termine</h1>
      <p class="subtitle">Hier findest du deine gebuchten Termine. Du kannst Termine bis 24h vorher stornieren.</p>
    </div>

    {#if showBookingNotification}
      <div class="notification success">
        {bookingMessage}
      </div>
    {/if}

    {#if !$session || $session.role !== 'patient'}
      <div class="card">
        <p>Bitte <a href="/login">anmelden</a> als Patient, um deine Termine zu sehen.</p>
      </div>
    {:else}
      <!-- Filter Section -->
      {#if termine && termine.length > 0}
        <div class="filter-section">
          <div class="filter-row">
            <div class="filter-top">
              <div class="filter-tabs">
                <button 
                  class="filter-tab" 
                  class:active={selectedFilter === 'all'}
                  on:click={() => selectedFilter = 'all'}
                >
                  Alle
                </button>
                <button 
                  class="filter-tab" 
                  class:active={selectedFilter === 'upcoming'}
                  on:click={() => selectedFilter = 'upcoming'}
                >
                  Bevorstehend
                </button>
                <button 
                  class="filter-tab" 
                  class:active={selectedFilter === 'past'}
                  on:click={() => selectedFilter = 'past'}
                >
                  Vergangene
                </button>
                <button 
                  class="filter-tab" 
                  class:active={selectedFilter === 'cancelled'}
                  on:click={() => selectedFilter = 'cancelled'}
                >
                  Storniert
                </button>
              </div>
            </div>
            <div class="filter-bottom">
              <div class="search-group">
                <div class="search-wrapper">
                  <span class="search-icon">🔍</span>
                  <input 
                    class="search-input" 
                    type="text" 
                    bind:value={searchQuery} 
                    placeholder="Praxis oder Fachbereich suchen..."
                  />
                  {#if searchQuery}
                    <button class="clear-btn" on:click={() => searchQuery = ''}>✕</button>
                  {/if}
                </div>
              </div>
              <div class="date-filter">
                <label>
                  <span class="date-label">Datum</span>
                  <div class="date-input-wrap">
                    <span class="date-icon">📅</span>
                    <input 
                      type="date" 
                      bind:value={selectedDate}
                      aria-label="Termine nach Datum filtern"
                    />
                    {#if selectedDate}
                      <button class="clear-btn" on:click={() => selectedDate = ''} aria-label="Datum löschen">✕</button>
                    {/if}
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      {/if}

      {#if loading}
        <p class="muted">Lade Termine…</p>
      {:else}
        {#if filteredTermine && filteredTermine.length}
          <div class="list">
            {#if groupedTermine.today.length > 0}
              <div class="group">
                <h3 class="group-title">📅 Heute</h3>
                {#each groupedTermine.today as t}
                  <TerminCard {t} on:deleted={load} on:updated={load} />
                {/each}
              </div>
            {/if}

            {#if groupedTermine.tomorrow.length > 0}
              <div class="group">
                <h3 class="group-title">📅 Morgen</h3>
                {#each groupedTermine.tomorrow as t}
                  <TerminCard {t} on:deleted={load} on:updated={load} />
                {/each}
              </div>
            {/if}

            {#if groupedTermine.upcoming.length > 0}
              <div class="group">
                <h3 class="group-title">📅 Nächste Tage</h3>
                {#each groupedTermine.upcoming as t}
                  <TerminCard {t} on:deleted={load} on:updated={load} />
                {/each}
              </div>
            {/if}

            {#if groupedTermine.past.length > 0}
              <div class="group">
                <h3 class="group-title">⏱ Vergangene Termine</h3>
                {#each groupedTermine.past as t}
                  <TerminCard {t} on:deleted={load} on:updated={load} />
                {/each}
              </div>
            {/if}
          </div>
        {:else}
          <div class="card empty">
            <div class="empty-icon">📋</div>
            <h3>
              {#if selectedFilter === 'upcoming'}
                Keine bevorstehenden Termine
              {:else if selectedFilter === 'past'}
                Keine vergangenen Termine
              {:else if selectedFilter === 'cancelled'}
                Keine stornierten Termine
              {:else}
                Du hast noch keine Termine
              {/if}
            </h3>
            <p>
              {#if selectedFilter === 'all'}
                Vereinbare jetzt einen Termin bei einer Praxis in deiner Nähe.
              {:else}
                Wähle einen anderen Filter oder vereinbare einen neuen Termin.
              {/if}
            </p>
            <a class="btn-primary" href="/">Praxen finden</a>
          </div>
        {/if}
      {/if}
    {/if}
  </div>
</main>

<style>
  main {
    background: #f6f8fb;
    padding: 24px 16px;
    min-height: 100%;
  }

  .container {
    max-width: 900px;
    margin: 0 auto;
  }

  .filter-section{margin:1.5rem 0 2rem;padding:1.5rem;background:var(--secondary);border:1px solid var(--border);border-radius:12px}
  .filter-row{display:flex;flex-direction:column;gap:0.9rem}
  .filter-top{display:flex;justify-content:flex-start}
  .filter-tabs{display:flex;gap:0.5rem;flex-wrap:wrap}
  .filter-tab{padding:0.6rem 1rem;border-radius:8px;border:1px solid rgba(16,24,40,0.15);background:#fff;color:#64748b;font-weight:500;cursor:pointer;transition:all 0.2s ease;font-size:0.9rem}
  .filter-tab:hover{border-color:var(--primary);color:var(--primary);background:rgba(59,130,246,0.05)}
  .filter-tab.active{background:var(--primary);color:#fff;border-color:var(--primary)}
  .filter-bottom{display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap}
  .search-group{flex:1;min-width:260px;max-width:460px}
  .search-wrapper{position:relative;display:flex;align-items:center}
  .search-icon{position:absolute;left:0.85rem;pointer-events:none;opacity:0.5}
  .search-input{width:100%;padding:0.6rem 2.5rem 0.6rem 2.5rem;border-radius:8px;border:1px solid rgba(16,24,40,0.15);background:#fff;font-size:0.95rem;transition:all 0.2s ease}
  .search-input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px rgba(59,130,246,0.1)}
  .search-input::placeholder{color:#9ca3af}
  .clear-btn{position:absolute;right:0.65rem;background:transparent;border:none;padding:0.25rem 0.4rem;cursor:pointer;font-size:0.95rem;color:#6b7280;border-radius:4px;transition:all 0.2s ease}
  .clear-btn:hover{background:rgba(16,24,40,0.05);color:#111827}
  .date-filter{min-width:190px;width:210px}
  .date-filter label{display:flex;align-items:center;gap:0.45rem;font-size:0.9rem;color:#475569;font-weight:600}
  .date-label{white-space:nowrap}
  .date-input-wrap{position:relative;display:flex;align-items:center}
  .date-icon{position:absolute;left:0.65rem;opacity:0.7;font-size:0.95rem;pointer-events:none}
  .date-filter input[type="date"]{width:100%;padding:0.55rem 2.2rem 0.55rem 2.1rem;border-radius:10px;border:1px solid rgba(16,24,40,0.1);background:#fff;font-size:0.95rem;transition:all 0.2s ease;color:#0f172a;box-shadow:0 1px 2px rgba(15,23,42,0.08)}
  .date-filter input[type="date"]:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px rgba(31,58,95,0.12)}
  .date-filter .clear-btn{position:absolute;right:0.55rem;top:50%;transform:translateY(-50%);padding:0.2rem 0.35rem;font-size:0.85rem;color:#6b7280;border-radius:6px}
  .date-filter .clear-btn:hover{background:rgba(16,24,40,0.06)}

  .notification {
    padding: 1rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    font-weight: 500;
    animation: slideDown 0.3s ease;
  }

  .notification.success {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .group-title {
    margin: 0;
    font-size: 1.1rem;
    color: #334155;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid rgba(15, 23, 42, 0.08);
    font-weight: 600;
  }

  .card {
    background: #fff;
    padding: 1rem;
    border-radius: 12px;
    border: 1px solid rgba(15, 23, 42, 0.06);
  }

  .card.empty {
    text-align: center;
    padding: 3rem 1.5rem;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .card.empty h3 {
    margin: 0 0 0.5rem 0;
    color: #0f172a;
  }

  .card.empty p {
    margin: 0 0 1.5rem 0;
    color: #64748b;
  }

  .btn-primary {
    display: inline-block;
    background: var(--primary);
    color: #fff;
    padding: 0.6rem 1.2rem;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 600;
    transition: filter 0.2s ease;
    border: none;
    cursor: pointer;
  }

  .btn-primary:hover {
    filter: brightness(0.95);
  }

  .muted {
    color: #64748b;
  }

  @media (max-width: 600px) {
    .header h1 {
      font-size: 1.5rem;
    }

    .list {
      gap: 1.5rem;
    }
  }
</style>
