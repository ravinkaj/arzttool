<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { session } from '$lib/auth/auth.js';
  import { ensureSampleData, getPraxisById, updatePraxis } from '$lib/utils/praxisStore.js';

  export let params;
  let praxis = null;
  let loading = true;
  let error = '';

  onMount(() => {
    loading = true;
    ensureSampleData();
    praxis = getPraxisById(params.id);
    if (!praxis) error = 'Praxis nicht gefunden';
    loading = false;
  });

  async function save(){
    if (!praxis) return;
    updatePraxis(praxis._id || praxis.id, praxis);
    await goto('/praxis/' + (praxis._id || praxis.id));
  }

</script>

<main class="container">
  {#if !$session || $session.role !== 'praxis'}
    <div class="card">Nur für Praxis-Accounts. Bitte <a href="/login">anmelden</a>.</div>
  {:else}
    {#if loading}
      <p>Lade…</p>
    {:else if !praxis}
      <div class="card">Praxis nicht gefunden.</div>
    {:else}
      <div class="page-head">
        <div>
          <h1>Praxis bearbeiten</h1>
          <p class="muted">Diese Daten werden lokal gespeichert.</p>
        </div>
        <div class="muted">{praxis.name}</div>
      </div>

      <div class="stack">
        <section class="card section">
          <h3>Basisdaten</h3>
          <div class="form-grid">
            <label>Praxisname<input bind:value={praxis.name} /></label>
            <label>Fachrichtung<input bind:value={praxis.fach} /></label>
            <label>Stadt<input bind:value={praxis.city} /></label>
            <label>Adresse<input bind:value={praxis.address} /></label>
          </div>
        </section>

        <section class="card section">
          <h3>Kontakt</h3>
          <p class="help">Telefon, E-Mail und Website erscheinen im Profil.</p>
          <div class="form-grid">
            <label>Telefon<input bind:value={praxis.phone} /></label>
            <label>E-Mail<input bind:value={praxis.email} /></label>
            <label>Website<input bind:value={praxis.website} /></label>
          </div>
        </section>

        <section class="card section">
          <h3>Öffnungszeiten & Beschreibung</h3>
          <div class="form-grid single">
            <label>Öffnungszeiten<textarea rows="2" bind:value={praxis.openingHours}></textarea></label>
            <label>Beschreibung<textarea rows="3" bind:value={praxis.description}></textarea></label>
          </div>
        </section>

        <section class="card section">
          <h3>Leistungen</h3>
          <p class="help">Leistungen werden auf der Praxis-Detailseite angezeigt.</p>
          <div class="list-block">
            {#each (praxis.services || []) as s, i}
              <div class="list-row">
                <input bind:value={praxis.services[i]} />
                <button class="btn ghost" on:click={()=>praxis.services.splice(i,1)}>Entfernen</button>
              </div>
            {/each}
            <button class="btn" on:click={()=> (praxis.services = praxis.services || [], praxis.services.push('Neue Leistung'))}>Leistung hinzufügen</button>
          </div>
        </section>

        <section class="card section">
          <h3>Team</h3>
          <p class="help">Teammitglieder erscheinen unter „Unser Team“.</p>
          <div class="team-list">
            {#each (praxis.team || []) as m, i}
              <div class="team-card">
                <div class="form-grid single">
                  <label>Name<input bind:value={m.name} placeholder="Name" /></label>
                  <label>Rolle<input bind:value={m.role} placeholder="Rolle" /></label>
                  <label>Spezialisierung<input bind:value={m.specialization} placeholder="Spezialisierung" /></label>
                </div>
                <button class="btn ghost" on:click={()=>praxis.team.splice(i,1)}>Entfernen</button>
              </div>
            {/each}
          </div>
          <button class="btn" on:click={()=> (praxis.team = praxis.team || [], praxis.team.push({ name:'', role:'', specialization:'', initials:'' }))}>Teammitglied hinzufügen</button>
        </section>

        <div class="actions-row">
          <button class="btn-primary" on:click={save}>Speichern</button>
          <a class="btn ghost" href={'/praxis/' + (praxis._id||praxis.id)}>Abbrechen</a>
        </div>
      </div>
    {/if}
  {/if}
</main>

<style>
  .page-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem}
  .stack{display:flex;flex-direction:column;gap:1rem}
  .section{padding:1.1rem 1.2rem}
  .form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.8rem}
  .form-grid.single{grid-template-columns:1fr}
  label{display:flex;flex-direction:column;gap:0.25rem;font-weight:600;color:#0f172a;font-size:0.95rem}
  input,textarea{padding:0.55rem 0.65rem;border-radius:10px;border:1px solid rgba(16,24,40,0.12);font-size:0.95rem}
  textarea{min-height:70px}
  .help{color:#6b7280;font-size:0.9rem;margin-top:-0.2rem;margin-bottom:0.4rem}
  .list-block{display:flex;flex-direction:column;gap:0.4rem}
  .list-row{display:flex;gap:0.5rem;align-items:center}
  .team-list{display:flex;flex-direction:column;gap:0.6rem}
  .team-card{border:1px solid rgba(16,24,40,0.08);border-radius:10px;padding:0.75rem}
  .actions-row{display:flex;gap:0.6rem;margin-top:0.5rem}
  .btn.ghost{background:#fff;border:1px solid rgba(16,24,40,0.12)}
</style>
