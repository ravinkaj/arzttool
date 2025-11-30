<script>
  import { onMount } from 'svelte';
  import { getSession, login } from '$lib/auth/auth.js';

  let session = null;
  let myPraxen = [];
  let loading = true;
  let form = { name:'', fach:'', city:'', waitMinutes:0, rating:4.0, address:'', coords: { lat:47.3769, lng:8.5417 } };

  async function load() {
    loading = true;
    session = getSession();
    // require arzt role for dashboard
    if (!session || session.role !== 'arzt') {
      // do not auto-login here; prompt user to login
      loading = false;
      return;
    }
    const res = await fetch('/api/praxen?ownerId=' + (session.userId || session.userId));
    myPraxen = await res.json();
    loading = false;
  }

  async function save() {
    const payload = { ...form, ownerId: session.userId };
    const res = await fetch('/api/praxen', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
    const data = await res.json();
    if (data.insertedId) {
      await load();
      form = { name:'', fach:'', city:'', waitMinutes:0, rating:4.0, address:'', coords: { lat:47.3769, lng:8.5417 } };
    }
  }

  // delete practice
  async function remove(id) {
    if (!confirm('Praxis wirklich löschen?')) return;
    const res = await fetch('/api/praxen/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.deleted) {
      await load();
    } else {
      alert('Löschen fehlgeschlagen');
    }
  }

  // edit: load into form
  function edit(p) {
    form = { name: p.name, fach: p.fach, city: p.city, waitMinutes: p.waitMinutes, rating: p.rating || 4.0, address: p.address || '', coords: p.coords || { lat:47.3769, lng:8.5417 }, _id: p._id };
  }

  async function update() {
    if (!form._id) return;
    const payload = { name: form.name, fach: form.fach, city: form.city, waitMinutes: Number(form.waitMinutes), rating: Number(form.rating), address: form.address, coords: form.coords };
    const res = await fetch('/api/praxen/' + form._id, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (data.matched) {
      form = { name:'', fach:'', city:'', waitMinutes:0, rating:4.0, address:'', coords: { lat:47.3769, lng:8.5417 } };
      await load();
    } else {
      alert('Update fehlgeschlagen');
    }
  }

  onMount(load);
</script>

<main>
  <h1>Arzt Dashboard</h1>
  {#if loading}
    <p>Lade…</p>
  {:else}
    {#if !session || session.role !== 'arzt'}
      <div class="card">
        <p>Sie sind nicht als Arzt angemeldet. <a href="/login">Zur Anmeldung</a></p>
      </div>
    {:else}
      <section class="card">
        <h2>{form._id ? 'Praxis bearbeiten' : 'Neue Praxis hinzufügen'}</h2>
        <div class="form">
          <label>Name<br/><input bind:value={form.name} /></label>
          <label>Fach<br/><input bind:value={form.fach} /></label>
          <label>Stadt<br/><input bind:value={form.city} /></label>
          <label>Wartezeit (Min)<br/><input type="number" bind:value={form.waitMinutes} /></label>
          <label>Bewertung<br/><input type="number" step="0.1" min="0" max="5" bind:value={form.rating} /></label>
          <label>Adresse<br/><input bind:value={form.address} /></label>
          <div style="display:flex;gap:0.5rem">
            {#if form._id}
              <button class="btn-primary" on:click={update}>Update</button>
              <button on:click={() => form = { name:'', fach:'', city:'', waitMinutes:0, rating:4.0, address:'', coords: { lat:47.3769, lng:8.5417 } }}>Abbrechen</button>
            {:else}
              <button class="btn-primary" on:click={save}>Speichern</button>
            {/if}
          </div>
        </div>
      </section>

      <section>
        <h2>Meine Praxen</h2>
        {#if myPraxen.length}
          <ul>
            {#each myPraxen as p}
              <li class="card">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <div>
                    <strong>{p.name}</strong>
                    <div class="muted">{p.fach} — {p.city}</div>
                  </div>
                  <div style="display:flex;gap:0.5rem">
                    <button on:click={() => edit(p)}>Bearbeiten</button>
                    <button on:click={() => remove(p._id)}>Löschen</button>
                  </div>
                </div>
              </li>
            {/each}
          </ul>
        {:else}
          <p>Keine Praxen gefunden.</p>
        {/if}
      </section>
    {/if}
  {/if}
</main>

<style>
  .form{display:flex;flex-direction:column;gap:0.5rem;max-width:480px}
  ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.5rem}
</style>
