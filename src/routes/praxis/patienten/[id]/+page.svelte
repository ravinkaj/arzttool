<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { session } from '$lib/auth/auth.js';
  import { ensureSampleData, getPatientById, updatePatientNote, getPraxenForOwner } from '$lib/utils/praxisStore.js';
  import { getTermine, updateTermin } from '$lib/utils/termineStore.js';

  let patient = null;
  let loading = true;
  let saving = false;
  let editableNote = '';
  let allowed = false;
  let patientTermine = [];
  let filteredTermine = [];
  let searchQuery = '';
  let filterStatus = 'alle';
  let filterSort = 'datum-neu';
  let activeTab = 'future';

  $: patientId = $page.params.id;

  function load() {
    if (typeof window === 'undefined') return;
    loading = true;
    ensureSampleData();
    const ownerId = $session?.userId || 'sample_owner';
    const praxen = getPraxenForOwner(ownerId) || [];
    const ids = new Set(praxen.map((p) => String(p._id || p.id)));
    const p = getPatientById(patientId);
    allowed = !!(p && ids.has(String(p.praxisId)));
    if (!allowed) {
      loading = false;
      patient = null;
      return;
    }
    patient = p;
    editableNote = p?.medicalNote || '';
    
    // Lade alle Termine des Patienten
    loadPatientTermine();
    loading = false;
  }

  function loadPatientTermine() {
    if (!patient) return;
    const allTermine = getTermine();
    patientTermine = allTermine.filter(t => 
      String(t.patientId) === String(patient.id) ||
      (t.patient && String(t.patient).toLowerCase() === String(patient.fullName).toLowerCase())
    ).sort((a, b) => new Date(b.dateTime || b.time) - new Date(a.dateTime || a.time));
    
    applyFilters();
  }

  function applyFilters() {
    let result = [...patientTermine];
    
    // Trennung nach Vergangenheit/Zukunft basierend auf activeTab
    if (activeTab === 'future') {
      result = result.filter(t => !isPastTermin(t.dateTime || t.time));
    } else {
      result = result.filter(t => isPastTermin(t.dateTime || t.time));
    }
    
    // Status-Filter
    if (filterStatus !== 'alle') {
      result = result.filter(t => t.status === filterStatus);
    }
    
    // Such-Filter (Notiz oder Praxis-Name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.note && String(t.note).toLowerCase().includes(q)) ||
        (t.praxisName && String(t.praxisName).toLowerCase().includes(q))
      );
    }
    
    // Sortierung
    if (filterSort === 'datum-neu') {
      result.sort((a, b) => new Date(b.dateTime || b.time) - new Date(a.dateTime || a.time));
    } else if (filterSort === 'datum-alt') {
      result.sort((a, b) => new Date(a.dateTime || a.time) - new Date(b.dateTime || b.time));
    }
    
    filteredTermine = result;
  }

  function canConfirm(status = '') {
    const s = String(status || '').toLowerCase();
    return s === 'angefragt' || s === 'abgesagt';
  }

  function canCancel(status = '') {
    const s = String(status || '').toLowerCase();
    return s === 'bestätigt' || s === 'angefragt';
  }

  function confirmTermin(id) {
    const success = updateTermin(id, { status: 'Bestätigt' });
    if (!success) return alert('Termin konnte nicht bestätigt werden.');
    loadPatientTermine();
  }

  function cancelTermin(id) {
    const success = updateTermin(id, { status: 'Abgesagt' });
    if (!success) return alert('Termin konnte nicht abgesagt werden.');
    loadPatientTermine();
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Unbekannt';
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
  }

  function isPastTermin(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return d < now;
  }

  async function saveNote() {
    saving = true;
    updatePatientNote(patientId, editableNote);
    load();
    saving = false;
  }

  $: if (searchQuery !== undefined || filterStatus !== undefined || filterSort !== undefined || activeTab !== undefined) {
    applyFilters();
  }

  onMount(load);
</script>

<main class="container">
  {#if !$session || $session.role !== 'praxis'}
    <div class="card">Diese Seite ist nur fuer Praxis-Accounts. Bitte <a href="/login">anmelden</a>.</div>
  {:else if loading}
    <p>Lade...</p>
  {:else if !allowed || !patient}
    <div class="card">Kein Zugriff auf diesen Patienten. <button class="ghost" on:click={() => goto('/praxis/patienten')}>Zur Übersicht</button></div>
  {:else}
    <div class="crumbs"><a href="/praxis/patienten">Patienten</a> / <span>{patient.fullName}</span></div>
    <div class="header">
      <div>
        <h1>{patient.fullName}</h1>
        <p class="muted">Zugeordnet zu {patient.praxisName}</p>
      </div>
      <div class="tag">{patient.healthInsurance}</div>
    </div>

    <div class="grid">
      <section class="card info">
        <h3>Kontakt</h3>
        <div class="line"><span class="label">E-Mail</span><span>{patient.email}</span></div>
        <div class="line"><span class="label">Telefon</span><span>{patient.phone}</span></div>
        <div class="line"><span class="label">Adresse</span><span>{patient.address}</span></div>
        <div class="line"><span class="label">Beigetreten am</span><span>{formatDate(patient.registeredAt || patient.updatedAt)}</span></div>
      </section>

      <section class="card info">
        <h3>Versicherung</h3>
        <div class="line"><span class="label">Kasse</span><span>{patient.healthInsurance}</span></div>
        <div class="line"><span class="label">Versicherungsnummer</span><span>{patient.insuranceNumber}</span></div>
        <div class="card-img" aria-label="Abbild der Krankenkassenkarte">Krankenkassenkarte (Mock)</div>
      </section>
    </div>

    <section class="card">
      <div class="section-head">
        <h3>Bisherige Behandlungen</h3>
      </div>
      {#if patient.treatments && patient.treatments.length}
        <ul class="timeline">
            {#each patient.treatments as treatment}
              <li class="tl-item">
                <div class="tl-date">{treatment.date}</div>
                <div class="tl-body">
                  <div class="tl-title">{treatment.title}</div>
                  <div class="tl-meta">{treatment.praxis}</div>
                  <div class="tl-note">{treatment.note}</div>
                  <div class="tl-time">{treatment.time ? `Zeit: ${treatment.time}` : ''}</div>
                </div>
              </li>
            {/each}
        </ul>
      {:else}
        <p class="muted">Keine dokumentierten Behandlungen hinterlegt.</p>
      {/if}
    </section>

    <section class="card">
      <div class="section-head">
        <h3>📅 Termine dieser Patientin / dieses Patienten</h3>
      </div>
      
      <!-- Tabs -->
      <div class="tabs">
        <button 
          class="tab-btn" 
          class:active={activeTab === 'future'}
          on:click={() => activeTab = 'future'}
        >
          📆 Künftige Termine
        </button>
        <button 
          class="tab-btn" 
          class:active={activeTab === 'past'}
          on:click={() => activeTab = 'past'}
        >
          📋 Vergangene Termine
        </button>
      </div>
      
      <!-- Filter/Search für beide Tabs -->
      <div class="filters" style="margin-top:1rem">
        <div class="filter-row">
          <input 
            type="text" 
            class="search-input"
            placeholder="🔍 Suche nach Notiz oder Praxis..."
            bind:value={searchQuery}
          />
          <select bind:value={filterStatus} class="filter-select">
            <option value="alle">Alle Status</option>
            <option value="Bestätigt">Bestätigt</option>
            <option value="Abgeschlossen">Abgeschlossen</option>
            <option value="Abgesagt">Abgesagt</option>
            <option value="Angefragt">Angefragt</option>
          </select>
          <select bind:value={filterSort} class="filter-select">
            <option value="datum-neu">Neueste zuerst</option>
            <option value="datum-alt">Älteste zuerst</option>
          </select>
        </div>
      </div>

      <!-- Künftige Termine Tab -->
      {#if activeTab === 'future'}
        <div class="tab-content">
          {#if filteredTermine.length}
            <div class="termine-list">
              {#each filteredTermine as termin}
                <div class="termin-item future">
                  <div class="termin-header">
                    <div class="termin-date">
                      <div class="date-badge">{formatDate(termin.dateTime || termin.time)}</div>
                      <div class="time-badge">{formatTime(termin.dateTime || termin.time)}</div>
                    </div>
                    <div class="status-badge status-{termin.status.toLowerCase()}">{termin.status}</div>
                  </div>
                  <div class="termin-body">
                    <div class="termin-praxis">🏥 {termin.praxisName}</div>
                    {#if termin.note}
                      <div class="termin-note">📝 {termin.note}</div>
                    {/if}
                  </div>
                  <div class="termin-actions">
                    <button 
                      class="btn-small btn-confirm" 
                      title="Bestätigen"
                      type="button"
                      disabled={!canConfirm(termin.status)}
                      on:click={() => confirmTermin(termin.id)}
                    >
                      ✓ Bestätigen
                    </button>
                    <button 
                      class="btn-small btn-cancel" 
                      title="Absagen"
                      type="button"
                      disabled={!canCancel(termin.status)}
                      on:click={() => cancelTermin(termin.id)}
                    >
                      ✗ Absagen
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="muted">Keine künftigen Termine {filterStatus !== 'alle' || searchQuery ? 'mit diesen Filterkriterien' : 'vorhanden'}.</p>
          {/if}
        </div>
      {/if}

      <!-- Vergangene Termine Tab -->
      {#if activeTab === 'past'}
        <div class="tab-content">
          {#if filteredTermine.length}
            <div class="termine-list">
              {#each filteredTermine as termin}
                <a href="/praxis/termine/{termin.id}" class="termin-item past">
                  <div class="termin-header">
                    <div class="termin-date">
                      <div class="date-badge">{formatDate(termin.dateTime || termin.time)}</div>
                      <div class="time-badge">{formatTime(termin.dateTime || termin.time)}</div>
                    </div>
                    <div class="status-badge status-{termin.status.toLowerCase()}">{termin.status}</div>
                  </div>
                  <div class="termin-body">
                    <div class="termin-praxis">🏥 {termin.praxisName}</div>
                    {#if termin.note}
                      <div class="termin-note">📝 {termin.note}</div>
                    {/if}
                  </div>
                  <div class="termin-arrow">→</div>
                </a>
              {/each}
            </div>
          {:else}
            <p class="muted">Keine vergangenen Termine {filterStatus !== 'alle' || searchQuery ? 'mit diesen Filterkriterien' : 'vorhanden'}.</p>
          {/if}
        </div>
      {/if}
    </section>

    <section class="card">
      <div class="section-head">
        <h3>Medizinische Notizen</h3>
        <span class="muted">Nur fuer die Praxis sichtbar</span>
      </div>
      <textarea rows="5" bind:value={editableNote}></textarea>
      <div class="actions">
        <button class="ghost" on:click={load} type="button">Zurücksetzen</button>
        <button class="btn-primary" type="button" on:click={saveNote} disabled={saving}>Speichern</button>
      </div>
    </section>
  {/if}
</main>

<style>
  main{padding:1.5rem}
  .muted{color:var(--muted)}
  .crumbs{margin-bottom:0.5rem;color:var(--muted)}
  .crumbs a{color:var(--primary);text-decoration:none}
  .crumbs a:hover{text-decoration:underline}
  .header{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem}
  .tag{background:#f8fafc;border:1px solid rgba(16,24,40,0.08);border-radius:8px;padding:6px 10px;font-weight:600}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin-bottom:1rem}
  .card{margin-bottom:1rem}
  .card.info{display:flex;flex-direction:column;gap:0.35rem}
  .line{display:flex;gap:0.5rem}
  .label{min-width:130px;color:var(--muted);font-weight:600}
  textarea{width:100%;border:1px solid rgba(16,24,40,0.1);border-radius:10px;padding:0.65rem;font-size:1rem}
  .section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem}
  .actions{display:flex;gap:0.5rem;justify-content:flex-end;margin-top:0.35rem}
  .ghost{padding:0.45rem 0.75rem;border:1px solid rgba(16,24,40,0.1);border-radius:8px;background:#fff;cursor:pointer}
  .btn-primary{padding:0.45rem 0.75rem;border-radius:8px;border:1px solid transparent;background:var(--primary);color:#fff;cursor:pointer}
  .card-img{margin-top:0.35rem;padding:1.2rem;border:1px dashed rgba(16,24,40,0.25);border-radius:10px;text-align:center;background:linear-gradient(120deg,#f8fafc,#eef2ff)}
  .timeline{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.6rem}
  .tl-item{display:flex;gap:0.75rem;align-items:flex-start}
  .tl-date{min-width:110px;font-weight:700;color:#0f172a}
  .tl-body{background:#f8fafc;border:1px solid rgba(16,24,40,0.08);border-radius:10px;padding:0.6rem;flex:1}
  .tl-title{font-weight:700;margin-bottom:0.15rem}
  .tl-meta{color:var(--muted);margin-bottom:0.15rem}
  .tl-note{color:#0f172a}
  
  .filters{margin:1rem 0}
  .filter-row{display:flex;gap:0.75rem;flex-wrap:wrap}
  .search-input{flex:1;min-width:200px;padding:0.6rem 0.85rem;border:1.5px solid var(--border-color);border-radius:8px;font-size:0.9375rem;transition:all 0.2s ease}
  .search-input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px rgba(31,58,95,0.1)}
  .filter-select{padding:0.6rem 0.85rem;border:1.5px solid var(--border-color);border-radius:8px;font-size:0.9375rem;background:white;cursor:pointer;transition:all 0.2s ease}
  .filter-select:hover{border-color:var(--primary)}
  .filter-select:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px rgba(31,58,95,0.1)}
  
  .termine-list{display:flex;flex-direction:column;gap:0.75rem;margin-top:1rem}
  .termin-item{position:relative;border:1.5px solid var(--border-color);border-radius:10px;padding:1rem;transition:all 0.2s ease;text-decoration:none;color:inherit;display:block}
  .termin-item:hover{border-color:var(--primary);box-shadow:0 4px 12px rgba(31,58,95,0.08);transform:translateX(4px)}
  .termin-header{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:0.75rem;flex-wrap:wrap}
  .termin-date{display:flex;gap:0.5rem;align-items:center}
  .date-badge{font-weight:700;color:var(--text-primary);font-size:0.9375rem}
  .time-badge{padding:0.25rem 0.5rem;background:var(--secondary);border-radius:6px;font-size:0.875rem;color:var(--text-secondary)}
  .status-badge{padding:0.375rem 0.75rem;border-radius:6px;font-size:0.875rem;font-weight:600}
  .status-bestätigt{background:#d1fae5;color:#065f46}
  .status-abgeschlossen{background:#dbeafe;color:#1e40af}
  .status-abgesagt{background:#fee2e2;color:#991b1b}
  .status-angefragt{background:#fef3c7;color:#92400e}
  .termin-body{display:flex;flex-direction:column;gap:0.35rem}
  .termin-praxis{font-weight:600;color:var(--text-primary)}
  .termin-note{color:var(--text-secondary);font-size:0.9375rem}
  .termin-arrow{position:absolute;right:1rem;top:50%;transform:translateY(-50%);font-size:1.5rem;color:var(--primary);opacity:0;transition:all 0.2s ease}
  .termin-item.past:hover .termin-arrow{opacity:1;right:0.75rem}
  
  .tabs{display:flex;gap:0.5rem;border-bottom:2px solid var(--border-color);margin-bottom:1.5rem;flex-wrap:wrap}
  .tab-btn{padding:0.75rem 1rem;background:none;border:none;border-bottom:3px solid transparent;color:var(--text-secondary);font-weight:500;cursor:pointer;transition:all 0.2s ease;font-size:0.9375rem}
  .tab-btn:hover{color:var(--text-primary)}
  .tab-btn.active{color:var(--primary);border-bottom-color:var(--primary)}
  
  .tab-content{animation:fadeIn 0.2s ease}
  
  .termin-item.future{position:relative;display:flex;flex-direction:column;gap:0.75rem}
  .termin-item.future .termin-header{flex-wrap:wrap}
  .termin-item.future .termin-actions{display:flex;gap:0.5rem;flex-wrap:wrap}
  
  .btn-small{padding:0.375rem 0.75rem;border-radius:6px;border:1.5px solid var(--border-color);background:white;font-size:0.875rem;font-weight:500;cursor:pointer;transition:all 0.2s ease}
  .btn-confirm{border-color:#10b981;color:#10b981}
  .btn-confirm:hover{background:#d1fae5;border-color:#059669}
  .btn-cancel{border-color:#ef4444;color:#ef4444}
  .btn-cancel:hover{background:#fee2e2;border-color:#dc2626}
  .btn-small:disabled{opacity:0.45;cursor:not-allowed;background:#f8fafc;border-color:var(--border-color);color:var(--muted)}
</style>
