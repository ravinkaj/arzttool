<script>
  import { onMount } from 'svelte';
  import { session } from '$lib/auth/auth.js';
  import { ensureSampleData, getPraxenForOwner, getTermineForOwner, setTerminStatus } from '$lib/utils/praxisStore.js';

  let loading = true;
  let praxen = [];
  let termine = [];
  let selectedPraxis = 'all';
  let selectedStatus = 'all';
  let searchQuery = '';
  let selectedTermin = null;

  function formatTime(d) { return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  function formatDate(d) { return new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: '2-digit' }); }
  function formatDateTime(d) { return new Date(d).toLocaleString(undefined, { weekday: 'long', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function normalizeStatus(s){ return String(s || '').toLowerCase().replace(/\u00e4/g,'ae').replace(/\u00f6/g,'oe').replace(/\u00fc/g,'ue'); }
  function slugifyName(name=''){return `pt-${String(name).normalize('NFD').replace(/[^\w\s-]/g,'').trim().toLowerCase().replace(/\s+/g,'-')}`;}

  function load() {
    if (typeof window === 'undefined') return;
    loading = true;
    ensureSampleData();
    const ownerId = $session?.userId || 'sample_owner';
    praxen = getPraxenForOwner(ownerId);
    termine = getTermineForOwner(ownerId);
    loading = false;
  }

  $: filteredTermine = (termine || []).filter((t) => {
    if (selectedPraxis !== 'all' && String(t.praxisId) !== String(selectedPraxis)) return false;
    if (selectedStatus !== 'all' && normalizeStatus(t.status) !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesPatient = (t.patient || '').toLowerCase().includes(query);
      const matchesEmail = (t.patientEmail || '').toLowerCase().includes(query);
      const matchesPhone = (t.patientPhone || '').toLowerCase().includes(query);
      if (!matchesPatient && !matchesEmail && !matchesPhone) return false;
    }
    return true;
  });

  $: todayList = filteredTermine.filter((t) => {
    const d = new Date(t.dateTime || t.time);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });

  $: next7List = filteredTermine.filter((t) => {
    const d = new Date(t.dateTime || t.time);
    const now = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + 7);
    return d > now && d <= limit;
  });

  function openTermin(t){ selectedTermin = t; }
  function closeModal(){ selectedTermin = null; }

  function setStatus(id, status){
    termine = termine.map((t) => (t.id === id ? { ...t, status } : t));
    if (selectedTermin && selectedTermin.id === id) {
      selectedTermin = { ...selectedTermin, status };
    }
    setTerminStatus(id, status);
  }

  onMount(load);
</script>

<main class="container">
  {#if !$session || $session.role !== 'praxis'}
    <div class="card">Diese Seite ist nur fuer Praxis-Accounts. Bitte <a href="/login">anmelden</a>.</div>
  {:else}
    <div class="page-header">
      <h1>Praxis Dashboard</h1>
      <p class="subtitle">Schneller Überblick über heutige und kommende Termine.</p>
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
        <div class="filter-group">
          <label class="filter-label">Status filtern</label>
          <select class="filter-select" bind:value={selectedStatus}>
            <option value="all">Alle Status</option>
            <option value="angefragt">Angefragt</option>
            <option value="bestaetigt">Bestätigt</option>
          </select>
        </div>
        <div class="search-group">
          <label class="filter-label">Suche</label>
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              class="search-input" 
              type="text" 
              bind:value={searchQuery} 
              placeholder="Patient, E-Mail oder Telefon suchen..."
            />
            {#if searchQuery}
              <button class="clear-btn" on:click={() => searchQuery = ''}>✕</button>
            {/if}
          </div>
        </div>
      </div>
    </div>

    {#if loading}
      <p>Lade...</p>
    {:else}
      <section class="grid">
        <div class="card stat">
          <div class="stat-top"><span class="icon">🕒</span><div><div class="label">Termine heute</div><div class="sub">inkl. bestaetigte & angefragte Termine</div></div></div>
          <div class="value">{todayList.length}</div>
        </div>
        <div class="card stat">
          <div class="stat-top"><span class="icon">📅</span><div><div class="label">Termine naechste 7 Tage</div><div class="sub">inkl. bestaetigte & angefragte Termine</div></div></div>
          <div class="value">{next7List.length}</div>
        </div>
        <div class="card stat">
          <div class="stat-top"><span class="icon">🏥</span><div><div class="label">Meine Praxen</div><div class="sub">veroeffentlicht</div></div></div>
          <div class="value">{praxen.length}</div>
        </div>
      </section>

      <div class="flex">
        <section class="card flex-1">
          <div class="section-head">
            <h3>Termine heute</h3>
            <span class="muted">{todayList.length} Eintraege</span>
          </div>
          {#if todayList.length}
            <ul class="list">
              {#each todayList as t}
                <li>
                  <div class="row clickable">
                    <div>
                      <strong>{formatTime(t.dateTime || t.time)}</strong> - <a class="patient-link" href={`/praxis/patienten/${t.patientId || slugifyName(t.patient)}`}>{t.patient || 'Patient'}</a>
                      <div class="muted">{t.praxisName}</div>
                    </div>
                    <div class="row-actions">
                      <span class={`status ${normalizeStatus(t.status)}`}>{t.status || 'offen'}</span>
                      <button class="ghost" type="button" on:click={() => openTermin(t)}>Details</button>
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="muted">Keine Termine heute.</p>
          {/if}
        </section>

        <section class="card flex-1">
          <div class="section-head">
            <h3>Naechste 7 Tage</h3>
            <span class="muted">{next7List.length} Eintraege</span>
          </div>
          {#if next7List.length}
            <ul class="list">
              {#each next7List as t}
                <li>
                  <div class="row clickable">
                    <div>
                      <strong>{formatDate(t.dateTime || t.time)}</strong> - {formatTime(t.dateTime || t.time)}
                      <div class="muted"><a class="patient-link" href={`/praxis/patienten/${t.patientId || slugifyName(t.patient)}`}>{t.patient || 'Patient'}</a> - {t.praxisName}</div>
                    </div>
                    <div class="row-actions">
                      <span class={`status ${normalizeStatus(t.status)}`}>{t.status || 'offen'}</span>
                      <button class="ghost" type="button" on:click={() => openTermin(t)}>Details</button>
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="muted">Keine kommenden Termine.</p>
          {/if}
        </section>
      </div>
    {/if}
  {/if}

  {#if selectedTermin}
    <div class="modal-backdrop" role="button" tabindex="0" aria-label="Modal schliessen" on:click={closeModal} on:keydown={(e) => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && closeModal()}>
      <div class="modal" role="dialog" aria-modal="true" aria-label="Termin-Details" tabindex="-1" on:click={(e) => e.stopPropagation()} on:keydown={(e) => { if (e.key === 'Escape') { closeModal(); } }}>
        <div class="modal-head">
          <h3>Termin-Details</h3>
          <button class="icon-btn" on:click={closeModal}>✕</button>
        </div>
        <div class="modal-body">
          <div class="row-line"><span class="muted">Patient</span><a class="patient-link" href={`/praxis/patienten/${selectedTermin.patientId || slugifyName(selectedTermin.patient)}`}>{selectedTermin.patient || 'Patient'}</a></div>
          <div class="row-line"><span class="muted">Praxis</span><strong>{selectedTermin.praxisName}</strong></div>
          <div class="row-line"><span class="muted">Datum & Uhrzeit</span><strong>{formatDateTime(selectedTermin.dateTime || selectedTermin.time)}</strong></div>
          {#if selectedTermin.patientAddress}
            <div class="row-line"><span class="muted">Adresse</span><span>{selectedTermin.patientAddress}</span></div>
          {/if}
          {#if selectedTermin.patientPhone}
            <div class="row-line"><span class="muted">Telefon</span><span>{selectedTermin.patientPhone}</span></div>
          {/if}
          {#if selectedTermin.patientEmail}
            <div class="row-line"><span class="muted">E-Mail</span><span>{selectedTermin.patientEmail}</span></div>
          {/if}
          {#if selectedTermin.healthInsurance}
            <div class="row-line"><span class="muted">Versicherung</span><span>{selectedTermin.healthInsurance}</span></div>
          {/if}
          {#if selectedTermin.insuranceNumber}
            <div class="row-line"><span class="muted">Versicherungsnummer</span><span>{selectedTermin.insuranceNumber}</span></div>
          {/if}
          <div class="row-line"><span class="muted">Status</span><span class={`status ${normalizeStatus(selectedTermin.status)}`}>{selectedTermin.status}</span></div>
          {#if selectedTermin.note}
            <div class="row-line"><span class="muted">Notiz</span><span>{selectedTermin.note}</span></div>
          {/if}
        </div>
        <div class="modal-actions">
          <button class="btn" on:click={() => setStatus(selectedTermin.id, 'Abgesagt')} disabled={normalizeStatus(selectedTermin.status) === 'abgesagt'}>Absagen</button>
          <button class="btn-primary" on:click={() => setStatus(selectedTermin.id, 'Bestaetigt')} disabled={normalizeStatus(selectedTermin.status) === 'abgesagt' || normalizeStatus(selectedTermin.status) === 'bestaetigt'}>Bestaetigen</button>
          <button class="btn" on:click={closeModal}>Schliessen</button>
        </div>
      </div>
    </div>
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
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:0.75rem;margin:1rem 0}
  .stat{padding:1rem;}
  .stat-top{display:flex;gap:0.6rem;align-items:center;margin-bottom:0.4rem}
  .icon{font-size:1.2rem}
  .stat .label{font-weight:600}
  .stat .sub{font-size:0.9rem;color:var(--muted)}
  .stat .value{font-size:1.9rem;font-weight:700;margin-top:0.1rem}
  .flex{display:flex;gap:1rem;flex-wrap:wrap}
  .flex-1{flex:1;min-width:280px}
  .section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem}
  .list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.5rem}
  .row{display:flex;justify-content:space-between;align-items:center;border:1px solid rgba(16,24,40,0.05);border-radius:10px;padding:0.6rem;transition:all 0.15s ease;width:100%;text-align:left;background:#fff}
  .row.clickable{cursor:default}
  .row:hover{box-shadow:0 6px 18px rgba(15,23,42,0.08);border-color:rgba(16,24,40,0.12);background:rgba(16,24,40,0.02)}
  .row-actions{display:flex;align-items:center;gap:0.35rem}
  .patient-link{color:var(--primary);font-weight:600;text-decoration:none}
  .patient-link:hover{text-decoration:underline}
  .ghost{padding:0.35rem 0.6rem;border:1px solid rgba(16,24,40,0.1);background:#fff;border-radius:8px;cursor:pointer;transition:all 0.15s ease}
  .ghost:hover{background:var(--primary);color:#fff;border-color:var(--primary)}
  .status{padding:0.35rem 0.75rem;border-radius:6px;font-size:0.85rem;text-transform:capitalize;font-weight:600;letter-spacing:0.02em}
  .status.bestaetigt{background:var(--accent-light);color:#1e7e34;border:1px solid rgba(46,204,113,0.25)}
  .status.angefragt{background:var(--info-light);color:#1c5fa8;border:1px solid rgba(52,152,219,0.25)}
  .status.abgesagt,.status.storniert{background:var(--danger-light);color:#c0392b;border:1px solid rgba(231,76,60,0.25)}

  .modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.35);display:flex;align-items:center;justify-content:center;padding:1rem;z-index:200}
  .modal{background:#fff;border-radius:12px;max-width:520px;width:100%;padding:1rem 1.25rem;box-shadow:0 12px 30px rgba(15,23,42,0.18)}
  .modal-head{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(16,24,40,0.08);padding-bottom:0.5rem;margin-bottom:0.75rem}
  .modal-body{display:flex;flex-direction:column;gap:0.55rem}
  .row-line{display:flex;justify-content:space-between;gap:1rem}
  .modal-actions{display:flex;gap:0.5rem;justify-content:flex-end;margin-top:0.9rem}
  .btn{padding:0.45rem 0.75rem;border-radius:8px;border:1px solid rgba(16,24,40,0.1);background:#fff;cursor:pointer}
  .btn-primary{padding:0.45rem 0.75rem;border-radius:8px;border:1px solid transparent;background:var(--primary);color:#fff;cursor:pointer}
  .btn:disabled,.btn-primary:disabled{opacity:0.5;cursor:default}
  .icon-btn{border:none;background:transparent;cursor:pointer;font-size:1.1rem;padding:0.25rem}
</style>
