<script>
  export let t;
  import { createEventDispatcher } from 'svelte';
  import { canCancelSlot } from '$lib/utils/slots.js';
  import { cancelTermin, updateTermin } from '$lib/utils/termineStore.js';
  
  const dispatch = createEventDispatcher();

  let editMode = false;
  let editNote = '';

  function formatDateNice(time){
    const d = new Date(time);
    if (isNaN(d)) return '';
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return `Heute, ${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
    }
    const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
    const date = d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${weekday}, ${date}, ${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
  }

  let isCancellable = false;
  let isEditable = false;

  // Check if cancellation/editing is allowed (24h rule)
  $: {
    const now = new Date();
    const terminTime = new Date(t.dateTime || t.time);
    const hoursUntil = (terminTime - now) / (1000 * 60 * 60);
    isCancellable = hoursUntil > 24 && t.status !== 'Storniert' && t.status !== 'storniert';
    isEditable = hoursUntil > 24 && t.status !== 'Storniert' && t.status !== 'storniert' && t.status !== 'abgesagt' && t.status !== 'Abgesagt';
  }

  function startEdit() {
    editNote = t.note || '';
    editMode = true;
  }

  function cancelEdit() {
    editMode = false;
    editNote = '';
  }

  function saveEdit() {
    const success = updateTermin(t.id, { note: editNote.trim() });
    if (success) {
      editMode = false;
      dispatch('updated', { id: t.id });
    } else {
      alert('Fehler beim Speichern der Änderungen');
    }
  }

  async function cancel(){
    if(!isCancellable) {
      alert('Stornierung nur bis 24h vorher möglich.');
      return;
    }
    if(!confirm('Termin stornieren?')) return;
    
    // Nutze den Store für die Stornierung
    const success = cancelTermin(t.id);
    if (success) {
      dispatch('updated', { id: t.id });
    } else {
      alert('Fehler beim Stornieren des Termins');
    }
  }
</script>

<div class="card-term">
  <div class="card-header">
    <div class="header-left">
      <h3 class="praxis-name">{t.praxisName || 'Unbekannte Praxis'}</h3>
      <p class="praxis-info">{t.fach}{t.fach && t.city ? ' — ' : ''}{t.city}</p>
      <div class="time-block">
        <strong style="font-size: 1.1rem; color: var(--primary);">
          {formatDateNice(t.dateTime || t.time)}
        </strong>
      </div>
    </div>
    <div class="header-right">
      {#if t.status}
        <span class="badge" class:confirmed={t.status === 'Bestätigt' || t.status === 'bestätigt'} class:cancelled={t.status === 'Storniert' || t.status === 'storniert'} class:declined={t.status === 'abgesagt' || t.status === 'Abgesagt'} class:past={t.status === 'vergangen'}>
          {t.status === 'Bestätigt' || t.status === 'bestätigt' ? '✓ Bestätigt' : t.status === 'Storniert' || t.status === 'storniert' ? '✗ Storniert' : t.status === 'abgesagt' || t.status === 'Abgesagt' ? '✗ Abgesagt' : 'Ausstehend'}
        </span>
      {/if}
    </div>
  </div>

  <div class="card-details">
    {#if t.waitMinutes != null}
      <div class="detail-row">
        <span class="icon">⏱️</span>
        <span><strong>Aktuelle Wartezeit:</strong> {t.waitMinutes} min</span>
      </div>
    {/if}
    {#if t.waitingPatients != null}
      <div class="detail-row waiting-patients-row">
        <span class="icon">👥</span>
        <span><strong>Wartende Patienten:</strong> <span class="waiting-count">{t.waitingPatients}</span></span>
      </div>
    {/if}
    {#if t.address}
      <div class="detail-row">
        <span class="icon">📍</span>
        <span>{t.address}</span>
      </div>
    {/if}
    {#if t.phone}
      <div class="detail-row">
        <span class="icon">📞</span>
        <a href={`tel:${t.phone}`}>{t.phone}</a>
      </div>
    {/if}
    {#if t.email}
      <div class="detail-row">
        <span class="icon">✉️</span>
        <a href={`mailto:${t.email}`}>{t.email}</a>
      </div>
    {/if}
    {#if t.patient}
      <div class="detail-row">
        <span class="icon">👤</span>
        <span>{t.patient}</span>
      </div>
    {/if}
    {#if editMode}
      <div class="detail-row">
        <span class="icon">📝</span>
        <div class="edit-note-container">
          <textarea bind:value={editNote} placeholder="Notiz zum Termin" rows="3"></textarea>
        </div>
      </div>
    {:else if t.note}
      <div class="detail-row">
        <span class="icon">📝</span>
        <span>{t.note}</span>
      </div>
    {/if}
  </div>

  <div class="card-actions">
    <a class="btn-link" href={t.praxisId ? '/praxis/' + t.praxisId : '#'}>
      Details zur Praxis →
    </a>
    {#if editMode}
      <button on:click={saveEdit} class="btn-save">
        Speichern
      </button>
      <button on:click={cancelEdit} class="btn-cancel-edit">
        Abbrechen
      </button>
    {:else}
      {#if isEditable}
        <button on:click={startEdit} class="btn-edit">
          Bearbeiten
        </button>
      {/if}
      {#if isCancellable}
        <button on:click={cancel} class="btn-cancel">
          Stornieren
        </button>
      {:else if t.status !== 'abgesagt' && t.status !== 'storniert'}
        <button disabled class="btn-cancel-disabled" title="Stornierung nur bis 24h vorher möglich">
          Stornieren
        </button>
        <span class="cancel-hint">Stornierung nur bis 24h vorher möglich</span>
      {/if}
    {/if}
  </div>
</div>

<style>
  .card-term {
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.06);
    border-radius: 12px;
    padding: 1.25rem;
    transition: all 0.2s ease;
  }

  .card-term:hover {
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
    border-color: rgba(15, 23, 42, 0.12);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  }

  .header-left {
    flex: 1;
  }

  .header-right {
    flex-shrink: 0;
  }

  .praxis-name {
    margin: 0 0 0.25rem 0;
    font-size: 1.15rem;
    color: #0f172a;
  }

  .praxis-info {
    margin: 0 0 0.75rem 0;
    color: #64748b;
    font-size: 0.9rem;
  }

  .time-block {
    margin-top: 0.5rem;
  }

  .badge {
    display: inline-block;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .badge.confirmed {
    background: #d1fae5;
    color: #166534;
  }

  .badge.cancelled {
    background: #f3f4f6;
    color: #6b7280;
  }

  .badge.declined {
    background: #fee2e2;
    color: #991b1b;
  }

  .badge.past {
    background: #f3f4f6;
    color: #6b7280;
  }

  .card-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .detail-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #475569;
    font-size: 0.95rem;
  }

  .detail-row strong {
    color: #0f172a;
  }

  .detail-row .icon {
    flex-shrink: 0;
    width: 24px;
    text-align: center;
  }

  .detail-row a {
    color: var(--primary);
    text-decoration: none;
  }

  .detail-row a:hover {
    text-decoration: underline;
  }

  .card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid rgba(15, 23, 42, 0.06);
  }

  .btn-link {
    color: var(--primary);
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn-link:hover {
    text-decoration: underline;
  }

  .btn-cancel {
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(220, 38, 38, 0.2);
    background: #fff;
    color: #dc2626;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn-edit {
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(59, 130, 246, 0.2);
    background: #fff;
    color: #3b82f6;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn-edit:hover {
    background: #eff6ff;
    border-color: #3b82f6;
  }

  .btn-save {
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(34, 197, 94, 0.2);
    background: #fff;
    color: #22c55e;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn-save:hover {
    background: #f0fdf4;
    border-color: #22c55e;
  }

  .btn-cancel-edit {
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(107, 114, 128, 0.2);
    background: #fff;
    color: #6b7280;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn-cancel-edit:hover {
    background: #f9fafb;
    border-color: #6b7280;
  }

  .edit-note-container {
    flex: 1;
  }

  .edit-note-container textarea {
    width: 100%;
    padding: 0.5rem 0.65rem;
    border-radius: 8px;
    border: 1px solid rgba(15, 23, 42, 0.12);
    resize: vertical;
    font-family: inherit;
  }

  .edit-note-container textarea:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .waiting-patients-row {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-left: 3px solid #f59e0b;
    padding: 8px 12px;
    margin: 4px -12px;
    border-radius: 6px;
  }

  .waiting-count {
    color: #d97706;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .btn-cancel:hover {
    background: #fef2f2;
    border-color: #dc2626;
  }

  .btn-cancel-disabled {
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(15, 23, 42, 0.06);
    background: #f8fafc;
    color: #94a3b8;
    cursor: not-allowed;
    font-weight: 500;
  }

  .cancel-hint {
    font-size: 0.8rem;
    color: #64748b;
    font-style: italic;
  }

  @media (max-width: 600px) {
    .card-header {
      flex-direction: column;
    }

    .card-actions {
      flex-direction: column;
      width: 100%;
    }

    .card-actions > * {
      width: 100%;
      text-align: center;
    }
  }
</style>
