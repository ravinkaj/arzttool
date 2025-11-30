<script>
  import { onMount } from 'svelte';
  import TerminCard from '$lib/components/TerminCard.svelte';
  import WartezeitBadge from '$lib/components/WartezeitBadge.svelte';
  import { validateAppointment } from '$lib/utils/validation.js';

  export let params;
  let praxis = null;
  let termine = [];
  let loading = true;
  let form = { patient: '', time: '', note: '' };
  let message = '';
  import { session } from '$lib/auth/auth.js';
  // use auto-subscription `$session` in the template and script when needed

  async function load() {
    loading = true;
    const res = await fetch('/api/praxen/' + params.id);
    praxis = await res.json();
    const t = await (await fetch('/api/termine')).json();
    termine = t.filter(x => x.praxisId == (praxis._id || praxis._id));
    loading = false;
  }

  async function submit() {
    message = '';
    // require logged-in patient
    if (!$session || $session.role !== 'patient') { message = 'Bitte als Patient anmelden, um Termine zu buchen.'; return; }
    const err = validateAppointment({ praxisId: params.id, ...form });
    if (err) { message = err; return; }
    const payload = { praxisId: params.id, ...form };
    // attach patient name from session userId if name omitted
    if (!payload.patient) payload.patient = $session.userId || 'Unbekannt';
    const res = await fetch('/api/termine', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (res.ok) {
      message = 'Termin erstellt';
      form = { patient: '', time: '', note: '' };
      await load();
    } else {
      message = data.error || 'Fehler';
    }
  }

  onMount(load);
</script>

<main>
  {#if loading}
    <p>Lade…</p>
  {:else}
    <h1>{praxis.name}</h1>
    <p>{praxis.fach} — {praxis.city}</p>
    <WartezeitBadge minutes={praxis.waitMinutes} />
    <section>
      <h2>Neue Terminbuchung</h2>
      {#if message}<div class="msg">{message}</div>{/if}
      {#if !$session}
        <div class="card">Bitte <a href="/login">anmelden</a>, um Termine zu buchen.</div>
      {:else if $session.role !== 'patient'}
        <div class="card">Nur als Patient können Termine gebucht werden. Melden Sie sich als Patient an.</div>
      {:else}
        <div class="form">
          <label>Patient<br/><input bind:value={form.patient} /></label>
          <label>Datum & Zeit<br/><input type="datetime-local" bind:value={form.time} /></label>
          <label>Notiz<br/><input bind:value={form.note} /></label>
          <button on:click={submit}>Buchen</button>
        </div>
      {/if}
    </section>

    <section>
      <h2>Termine</h2>
      {#if termine.length}
        {#each termine as t}
          <TerminCard {t} onDeleted={load} />
        {/each}
      {:else}
        <p>Keine Termine.</p>
      {/if}
    </section>
  {/if}
</main>

<style>
  .form { display:flex; flex-direction:column; gap:0.5rem; max-width:420px }
  .msg { margin: 0.5rem 0; color: green }
</style>
