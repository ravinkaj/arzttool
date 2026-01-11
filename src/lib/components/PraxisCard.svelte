<script>
  import { createEventDispatcher } from 'svelte';
  import WartezeitBadge from './WartezeitBadge.svelte';
  import { getNextAvailableSlot, formatDateLabel, getBookedSlotsForPraxis } from '$lib/utils/slots.js';
  
  const dispatch = createEventDispatcher();
  export let praxis;
  export let isFavorite = false;

  function toggleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();
    dispatch('toggle', { id: praxis._id || praxis.id });
  }

  function handleCardClick(e) {
    // Ignore clicks on interactive controls but navigate for the rest of the card
    if (e.target.closest('button')) return;
    window.location.href = '/praxis/' + (praxis._id || praxis.id);
  }

  // Get next available slot using the central utility
  $: praxisId = praxis._id || praxis.id;
  $: bookedSlots = getBookedSlotsForPraxis(praxisId);
  $: nextSlotDate = getNextAvailableSlot(praxisId, bookedSlots);
  $: nextSlotLabel = nextSlotDate ? formatDateLabel(nextSlotDate) : null;
</script>

<article class="card">
  <a class="card-link" href={'/praxis/' + (praxis._id || praxis.id)} on:click|preventDefault={handleCardClick}>
    <div class="card-head">
      <div class="title-section">
        <h3 class="praxis-name">{praxis.name}</h3>
        <p class="meta">{praxis.fach}</p>
      </div>
    </div>

    <div class="info-row">
      <div class="left-info">
        {#if praxis.avgRating}
          <div class="rating-prominent">
            <span class="rating-value">⭐ {praxis.avgRating}</span>
            <span class="rating-count">({praxis.reviewCount} Bewertungen)</span>
          </div>
        {/if}
        {#if praxis.address}
          <p class="addr">📍 {praxis.address}</p>
        {:else}
          <p class="addr">📍 {praxis.city}</p>
        {/if}
      </div>
      
      <div class="right-info">
        {#if nextSlotLabel}
          <div class="next-badge">
            <div class="label">🗓 Nächster Termin</div>
            <div class="value">{nextSlotLabel}</div>
          </div>
        {:else}
          <div class="no-slots">Keine freien Termine verfügbar</div>
        {/if}
      </div>
    </div>

    <div class="foot">
      <div class="wait-section" title="Geschätzter Durchschnitt basierend auf aktuellen Daten">
        <div class="wait-label">Aktuelle Wartezeit</div>
        <WartezeitBadge minutes={praxis.waitMinutes ?? 0} />
      </div>
    </div>
  </a>
  <button 
    class="star" 
    class:favorite={isFavorite}
    aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Als Favorit merken'} 
    title={isFavorite ? 'In Favoriten' : 'Als Favorit merken'}
    on:click={toggleFavorite}
    type="button"
  >
    {isFavorite ? '★' : '☆'}
  </button>
</article>

<style>
  .card { 
    padding: 1.1rem; 
    border: 1px solid rgba(15,23,42,0.06); 
    border-radius: 12px; 
    background: #fff;
    position: relative;
    transition: all 0.2s ease;
  }
  
  .card:hover { 
    box-shadow: 0 4px 12px rgba(15,23,42,0.1); 
    border-color: rgba(15,23,42,0.12);
  }

  .card-link {
    color: inherit;
    text-decoration: none;
    display: block;
    width: 100%;
  }
  
  .card-head { 
    display: flex; 
    align-items: flex-start; 
    gap: 0.75rem; 
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }
  
  .title-section {
    flex: 1;
  }
  
  .praxis-name { 
    margin: 0 0 0.25rem 0;
    font-size: 1.15rem;
    color: #0f172a;
  }
  
  .meta { 
    color: #64748b; 
    margin: 0;
    font-size: 0.9rem;
  }
  
  .star { 
    background: transparent;
    border: 0;
    font-size: 1.5rem;
    cursor: pointer;
    color: #cbd5e1;
    transition: all 0.2s ease;
    flex-shrink: 0;
    position: absolute;
    top: 12px;
    right: 12px;
  }
  
  .star:hover {
    transform: scale(1.15);
  }
  
  .star.favorite {
    color: #f59e0b;
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }
  
  .left-info {
    flex: 1;
    min-width: 200px;
  }
  
  .right-info {
    display: flex;
    align-items: center;
  }
  
  .rating-prominent {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .rating-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #0f172a;
  }
  
  .rating-count {
    color: #64748b;
    font-size: 0.9rem;
  }
  
  .addr { 
    font-size: 0.875rem; 
    margin: 0;
    color: #94a3b8;
  }
  
  .next-badge {
    background: #f8fafc;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    text-align: right;
    border: 1px solid rgba(15,23,42,0.06);
  }
  
  .next-badge .label {
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.15rem;
  }
  
  .next-badge .value {
    font-weight: 600;
    color: #0f172a;
    font-size: 0.9rem;
  }
  
  .no-slots {
    color: #94a3b8;
    font-size: 0.85rem;
    font-style: italic;
  }
  
  .foot { 
    margin-top: 0.5rem;
    display: flex; 
    align-items: center; 
  }
  
  .wait-section {
    cursor: help;
  }

  .wait-label {
    font-size: 0.9rem;
    color: #475569;
    font-weight: 600;
  }
</style>
