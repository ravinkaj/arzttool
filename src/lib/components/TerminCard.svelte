<script>
  export let t;
  import { createEventDispatcher } from 'svelte';
  import { session } from '$lib/auth/auth.js';
  const dispatch = createEventDispatcher();

  async function del() {
    if (!confirm('Termin löschen?')) return;
    const res = await fetch('/api/termine', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ _id: t._id }) });
    const data = await res.json();
    if (res.ok) {
      dispatch('deleted');
    } else {
      alert(data.error || 'Fehler beim Löschen');
    }
  }
</script>

<div class="term">
  <div class="head">
    <strong>{t.patient}</strong>
    <small>{new Date(t.time).toLocaleString()}</small>
  </div>
  {#if t.note}<div class="note">{t.note}</div>{/if}
  <div class="actions">
    {#if $session && ($session.role === 'patient' || $session.role === 'arzt')}
      <button on:click={del}>Löschen</button>
    {/if}
  </div>
</div>

<style>
  .term { padding:0.6rem; border:1px solid #eee; border-radius:6px }
  .head { display:flex; justify-content:space-between }
  .note { color:#444 }
  .actions { margin-top:0.5rem }
</style>
