<script>
  import { onMount } from 'svelte';
  import { session } from '$lib/auth/auth.js';
  import { ensureSampleData, getPraxenForOwner, deletePraxis, getTermineForOwner } from '$lib/utils/praxisStore.js';

  let loading = true;
  let myPraxen = [];
  let termine = [];

  function load() {
    if (typeof window === 'undefined') return;
    loading = true;
    ensureSampleData();
    const ownerId = $session?.userId || 'sample_owner';
    myPraxen = getPraxenForOwner(ownerId);
    termine = getTermineForOwner(ownerId);
    loading = false;
  }

  async function remove(id) {
    if (!confirm('Praxis löschen?')) return;
    deletePraxis(id);
    load();
  }

  function getStatsForPraxis(praxisId) {
    const praxisTermine = termine.filter((t) => String(t.praxisId) === String(praxisId));
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const limit7 = new Date();
    limit7.setDate(limit7.getDate() + 7);

    const todayCount = praxisTermine.filter((t) => (t.date || t.time || t.dateTime || '').slice(0, 10) === todayStr).length;
    const next7Count = praxisTermine.filter((t) => {
      const d = new Date(t.dateTime || t.time);
      return d > today && d <= limit7;
    }).length;
    const angefragtCount = praxisTermine.filter((t) => String(t.status || '').toLowerCase() === 'angefragt').length;

    return { todayCount, next7Count, angefragtCount };
  }

  onMount(load);
</script>

<main class="container">
  {#if !$session || $session.role !== 'praxis'}
    <div class="card">Diese Seite ist nur für Praxis-Accounts. Bitte <a href="/login">anmelden</a>.</div>
  {:else}
    <div class="page-header">
      <div>
        <h1>Meine Praxen</h1>
        <p class="subtitle">Verwalten Sie Ihre Praxen zentral an einem Ort.</p>
      </div>
      <div class="actions-inline">
        <a class="btn-primary" href="/praxis/neu">Neue Praxis anlegen</a>
        <a class="btn" href="/praxis/calendar">Kalender öffnen</a>
      </div>
    </div>

    <section style="margin-top:1rem">
      <h2>Übersicht</h2>
      {#if loading}
        <p>Lade…</p>
      {:else}
        {#if myPraxen.length}
          <ul class="list">
            {#each myPraxen as p}
              {@const stats = getStatsForPraxis(p._id)}
              <li class="card row">
                <div class="info">
                  <div class="name">{p.name}</div>
                  <div class="meta">{p.fach} • {p.city}</div>
                  <div class="stats-line">
                    <span class="chip chip-today">🕒 Heute: {stats.todayCount}</span>
                    <span class="chip chip-week">📅 Nächste 7 Tage: {stats.next7Count}</span>
                    <span class="chip chip-req">⚠️ Anfragen: {stats.angefragtCount}</span>
                  </div>
                </div>
                <div class="actions">
                  <a class="action-btn" href={'/praxis/' + p._id}>
                    <span class="icon">👁️</span>
                    <span class="label">Vorschau</span>
                  </a>
                  <a class="action-btn" href={'/praxis/' + p._id + '/bearbeiten'}>
                    <span class="icon">✏️</span>
                    <span class="label">Bearbeiten</span>
                  </a>
                  <a class="action-btn" href="/praxis/calendar">
                    <span class="icon">📅</span>
                    <span class="label">Kalender</span>
                  </a>
                  <button class="action-btn danger" on:click={() => remove(p._id)}>
                    <span class="icon">🗑️</span>
                    <span class="label">Löschen</span>
                  </button>
                </div>
              </li>
            {/each}
          </ul>
        {:else}
          <div class="card empty"><h3>Keine Praxen gefunden</h3><p>Du kannst eine neue Praxis hinzufügen.</p></div>
        {/if}
      {/if}
    </section>
  {/if}
</main>

<style>
  main.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
    flex-wrap: wrap;
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 1rem;
    margin: 0;
  }

  .actions-inline {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .btn-primary {
    background: var(--primary);
    color: white;
    padding: 0.625rem 1.25rem;
    border-radius: var(--border-radius);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9375rem;
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
    white-space: nowrap;
  }

  .btn-primary:hover {
    background: var(--primary-light);
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }

  .btn {
    background: white;
    color: var(--primary);
    padding: 0.625rem 1.25rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9375rem;
    transition: all 0.2s ease;
    cursor: pointer;
    white-space: nowrap;
  }

  .btn:hover {
    background: rgba(31, 58, 95, 0.02);
    border-color: var(--primary);
  }

  section {
    margin-top: 2rem;
  }

  section h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 1.25rem 0;
  }

  .list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
    padding: 1.5rem;
    background: white;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  .row:hover {
    box-shadow: var(--shadow);
    border-color: rgba(31, 58, 95, 0.15);
  }

  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .name {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .meta {
    font-size: 0.9375rem;
    color: var(--text-secondary);
  }

  .stats-line {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 0.625rem;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .chip-today {
    background: var(--info-light);
    color: #1c5fa8;
    border: 1px solid rgba(52, 152, 219, 0.25);
  }

  .chip-week {
    background: var(--accent-light);
    color: #1e7e34;
    border: 1px solid rgba(46, 204, 113, 0.25);
  }

  .chip-req {
    background: var(--warn-light);
    color: #c87619;
    border: 1px solid rgba(245, 166, 35, 0.25);
  }

  .actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(120px, 1fr));
    gap: 0.625rem;
    min-width: 260px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: flex-start;
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    background: white;
    text-decoration: none;
    color: var(--text-primary);
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: var(--secondary);
    border-color: var(--primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .action-btn .icon {
    font-size: 1.125rem;
  }

  .action-btn .label {
    font-size: 0.9375rem;
  }

  .action-btn.danger {
    color: var(--error-color);
    border-color: rgba(231, 76, 60, 0.3);
  }

  .action-btn.danger:hover {
    background: var(--danger-light);
    border-color: var(--error-color);
  }

  .card {
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid var(--border-color);
    background: white;
    box-shadow: var(--shadow-sm);
  }

  .empty {
    text-align: center;
    padding: 3rem 1.5rem;
  }

  .empty h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
  }

  .empty p {
    color: var(--text-secondary);
    margin: 0;
  }

  @media (max-width: 768px) {
    main.container {
      padding: 1.5rem 1rem;
    }

    .page-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .page-header h1 {
      font-size: 1.75rem;
    }

    .row {
      flex-direction: column;
      gap: 1.25rem;
    }

    .actions {
      width: 100%;
      min-width: 100%;
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
