<script>
  import { goto } from '$app/navigation';
  import { session } from '$lib/auth/auth.js';
  import { ensureSampleData, addPraxis } from '$lib/utils/praxisStore.js';

  let form = {
    name: '', fach: '', city: '', address: '', phone: '', email: '', website: '', openingHours: '', description: '', services: [], team: []
  };

  let serviceInput = '';
  let teamNameInput = '';
  let teamPositionInput = '';
  let editingServiceIndex = -1;
  let editingServiceValue = '';
  let editingTeamIndex = -1;
  let editingTeamName = '';
  let editingTeamRole = '';
  let msg = '';

  function addService(){ 
    if(!serviceInput.trim()) return; 
    // reassign array to trigger reactivity
    form.services = [...form.services, serviceInput.trim()];
    serviceInput=''; 
  }

  function removeService(index) {
    form.services.splice(index, 1);
    form.services = form.services;
  }

  function startEditService(index) {
    editingServiceIndex = index;
    editingServiceValue = form.services[index];
  }

  function saveEditService(index) {
    if(editingServiceValue.trim()) {
      form.services[index] = editingServiceValue.trim();
      form.services = form.services;
    }
    editingServiceIndex = -1;
    editingServiceValue = '';
  }

  function cancelEditService() {
    editingServiceIndex = -1;
    editingServiceValue = '';
  }

  function addTeamMember(){ 
    if(!teamNameInput.trim() || !teamPositionInput.trim()) return; 
    // reassign array to trigger reactivity
    form.team = [...form.team, { name: teamNameInput.trim(), role: teamPositionInput.trim() }]; 
    teamNameInput = ''; 
    teamPositionInput = ''; 
  }

  function removeTeamMember(index) {
    form.team.splice(index, 1);
    form.team = form.team;
  }

  function startEditTeam(index) {
    editingTeamIndex = index;
    editingTeamName = form.team[index].name;
    editingTeamRole = form.team[index].role;
  }

  function saveEditTeam(index) {
    if(editingTeamName.trim() && editingTeamRole.trim()) {
      form.team[index] = { name: editingTeamName.trim(), role: editingTeamRole.trim() };
      form.team = form.team;
    }
    editingTeamIndex = -1;
    editingTeamName = '';
    editingTeamRole = '';
  }

  function cancelEditTeam() {
    editingTeamIndex = -1;
    editingTeamName = '';
    editingTeamRole = '';
  }

  async function save(){
    msg='';
    ensureSampleData();
    const ownerId = $session && $session.userId ? $session.userId : 'sample_owner';
    const item = addPraxis({ ...form, ownerId });
    msg = 'Praxis gespeichert.';
    await goto('/praxis/manage');
    return item;
  }
</script>

<main class="container">
  {#if !$session || $session.role !== 'praxis'}
    <div class="card">Nur für Praxis-Accounts. Bitte <a href="/login">anmelden</a>.</div>
  {:else}
    <div class="page-head">
      <div>
        <h1>Neue Praxis anlegen</h1>
        <p class="muted">Diese Daten werden lokal gespeichert.</p>
      </div>
      {#if msg}
        <div class="msg success">{msg}</div>
      {/if}
    </div>

    <div class="stack">
      <section class="card section">
        <h3 class="section-title">
          <span class="icon">📋</span>
          Basisdaten
        </h3>
        <div class="form-grid three-col">
          <label>
            <span class="label-text">Praxisname <span class="required">*</span></span>
            <input type="text" placeholder="z.B. Hausarztpraxis Dr. Müller" bind:value={form.name} required />
          </label>
          <label>
            <span class="label-text">Fachrichtung <span class="required">*</span></span>
            <input type="text" placeholder="z.B. Allgemeinmedizin" bind:value={form.fach} required />
          </label>
          <label>
            <span class="label-text">Stadt <span class="required">*</span></span>
            <input type="text" placeholder="z.B. Zürich" bind:value={form.city} required />
          </label>
        </div>
        <div class="form-grid full">
          <label>
            <span class="label-text">Adresse</span>
            <input type="text" placeholder="Strasse und Hausnummer" bind:value={form.address} />
          </label>
        </div>
      </section>

      <section class="card section">
        <h3 class="section-title">
          <span class="icon">📞</span>
          Kontakt
        </h3>
        <p class="help">Telefon, E-Mail und Website erscheinen im Profil.</p>
        <div class="form-grid three-col">
          <label>
            <span class="label-text">Telefon</span>
            <input type="tel" placeholder="+41 44 123 45 67" bind:value={form.phone} />
          </label>
          <label>
            <span class="label-text">E-Mail</span>
            <input type="email" placeholder="info@praxis.ch" bind:value={form.email} />
          </label>
          <label>
            <span class="label-text">Website <span class="optional">(optional)</span></span>
            <input type="url" placeholder="https://www.praxis.ch" bind:value={form.website} />
          </label>
        </div>
      </section>

      <section class="card section">
        <h3 class="section-title">
          <span class="icon">⏰</span>
          Öffnungszeiten & Beschreibung
        </h3>
        <div class="form-grid two-col">
          <label>
            <span class="label-text">Öffnungszeiten</span>
            <textarea rows="4" placeholder="Mo-Fr: 08:00 - 18:00&#10;Sa: 09:00 - 12:00" bind:value={form.openingHours}></textarea>
          </label>
          <label>
            <span class="label-text">Beschreibung / Schwerpunkt</span>
            <textarea rows="4" placeholder="Kurze Beschreibung der Praxis und ihrer Schwerpunkte..." bind:value={form.description}></textarea>
          </label>
        </div>
      </section>

      <section class="card section">
        <h3 class="section-title">
          <span class="icon">⚕️</span>
          Leistungen
        </h3>
        <p class="help">Leistungen werden auf der Praxis-Detailseite angezeigt.</p>
        <div class="input-with-button">
          <input 
            type="text"
            class="input-grow"
            placeholder="Leistung eingeben (z.B. Allgemeine Untersuchung)" 
            bind:value={serviceInput} 
            on:keydown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); addService(); } }} 
          />
          <button on:click={addService} class="btn-add" disabled={!serviceInput.trim()}>
            <span class="btn-icon">➕</span>
            Hinzufügen
          </button>
        </div>
        
        {#if form.services.length === 0}
          <div class="empty-state">
            <span class="empty-icon">📝</span>
            <p>Noch keine Leistungen erfasst</p>
          </div>
        {:else}
          <div class="list-items">
            {#each form.services as service, i}
              <div class="list-item">
                {#if editingServiceIndex === i}
                  <input 
                    type="text" 
                    class="edit-input" 
                    bind:value={editingServiceValue}
                    on:keydown={(e)=>{ 
                      if(e.key==='Enter'){ e.preventDefault(); saveEditService(i); }
                      if(e.key==='Escape'){ e.preventDefault(); cancelEditService(); }
                    }}
                  />
                  <div class="item-actions">
                    <button class="btn-icon-small save" on:click={() => saveEditService(i)} title="Speichern">✓</button>
                    <button class="btn-icon-small cancel" on:click={cancelEditService} title="Abbrechen">✕</button>
                  </div>
                {:else}
                  <span class="item-text">{service}</span>
                  <div class="item-actions">
                    <button class="btn-icon-small edit" on:click={() => startEditService(i)} title="Bearbeiten">✏️</button>
                    <button class="btn-icon-small delete" on:click={() => removeService(i)} title="Löschen">🗑️</button>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <section class="card section">
        <h3 class="section-title">
          <span class="icon">👥</span>
          Team
        </h3>
        <p class="help">Teammitglieder erscheinen unter „Unser Team“.</p>
        <div class="team-input-grid">
          <input 
            type="text"
            placeholder="Name (z.B. Dr. Maria Müller)" 
            bind:value={teamNameInput} 
            on:keydown={(e)=>{ if(e.key==='Enter' && teamNameInput.trim() && teamPositionInput.trim()){ e.preventDefault(); addTeamMember(); } }} 
          />
          <input 
            type="text"
            placeholder="Position (z.B. Fachärztin)" 
            bind:value={teamPositionInput} 
            on:keydown={(e)=>{ if(e.key==='Enter' && teamNameInput.trim() && teamPositionInput.trim()){ e.preventDefault(); addTeamMember(); } }} 
          />
          <button on:click={addTeamMember} class="btn-add" disabled={!teamNameInput.trim() || !teamPositionInput.trim()}>
            <span class="btn-icon">➕</span>
            Hinzufügen
          </button>
        </div>

        {#if form.team.length === 0}
          <div class="empty-state">
            <span class="empty-icon">👤</span>
            <p>Noch keine Teammitglieder erfasst</p>
          </div>
        {:else}
          <div class="team-table">
            <div class="table-header">
              <div class="col-name">Name</div>
              <div class="col-role">Position</div>
              <div class="col-actions">Aktionen</div>
            </div>
            {#each form.team as member, i}
              <div class="table-row">
                {#if editingTeamIndex === i}
                  <div class="col-name">
                    <input 
                      type="text" 
                      class="edit-input-inline" 
                      bind:value={editingTeamName}
                      on:keydown={(e)=>{ 
                        if(e.key==='Enter'){ e.preventDefault(); saveEditTeam(i); }
                        if(e.key==='Escape'){ e.preventDefault(); cancelEditTeam(); }
                      }}
                    />
                  </div>
                  <div class="col-role">
                    <input 
                      type="text" 
                      class="edit-input-inline" 
                      bind:value={editingTeamRole}
                      on:keydown={(e)=>{ 
                        if(e.key==='Enter'){ e.preventDefault(); saveEditTeam(i); }
                        if(e.key==='Escape'){ e.preventDefault(); cancelEditTeam(); }
                      }}
                    />
                  </div>
                  <div class="col-actions">
                    <button class="btn-icon-small save" on:click={() => saveEditTeam(i)} title="Speichern">✓</button>
                    <button class="btn-icon-small cancel" on:click={cancelEditTeam} title="Abbrechen">✕</button>
                  </div>
                {:else}
                  <div class="col-name">{member.name}</div>
                  <div class="col-role">{member.role}</div>
                  <div class="col-actions">
                    <button class="btn-icon-small edit" on:click={() => startEditTeam(i)} title="Bearbeiten">✏️</button>
                    <button class="btn-icon-small delete" on:click={() => removeTeamMember(i)} title="Löschen">🗑️</button>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </section>

    </div>
      <div class="action-bar">
        <div class="action-bar-content">
          <button class="btn-primary-large" on:click={save}>
            <span class="btn-icon">💾</span>
            Praxis speichern
          </button>
          <a class="btn-secondary-large" href="/praxis/manage">
            Abbrechen
          </a>
        </div>
      </div>
  {/if}
</main>

<style>
  main.container {
     max-width: 1000px;
    margin: 0 auto;
     padding: 2rem 1.5rem 120px;
  }

  .page-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
  }

  .page-head h1 {
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
  }

  .muted {
    color: var(--text-secondary);
    font-size: 0.9375rem;
    margin: 0;
  }

  .stack {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .card {
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: var(--shadow-sm);
  }

  .section {
    padding: 2rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 1.5rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid var(--secondary);
  }

  .section-title .icon {
    font-size: 1.5rem;
  }

  .help {
    color: var(--text-secondary);
    font-size: 0.9375rem;
    margin: -0.75rem 0 1.25rem 0;
    line-height: 1.5;
  }

  .form-grid {
    display: grid;
    gap: 1.25rem;
  }

  .form-grid.three-col {
    grid-template-columns: repeat(3, 1fr);
  }

  .form-grid.two-col {
    grid-template-columns: 1fr 1.5fr;
  }

  .form-grid.full {
    grid-template-columns: 1fr;
    margin-top: 1.25rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .label-text {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.9375rem;
    display: block;
  }

  .required {
    color: var(--error-color);
    font-weight: 700;
  }

  .optional {
    color: var(--text-secondary);
    font-weight: 400;
    font-size: 0.875rem;
  }

  input, textarea {
    padding: 0.75rem 1rem;
    border-radius: var(--border-radius);
    border: 1.5px solid var(--border-color);
    font-size: 1rem;
    transition: all 0.2s ease;
    background: white;
      font-family: inherit;
    }

    input::placeholder, textarea::placeholder {
      color: #9ca3af;
  }

  input:focus, textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(31, 58, 95, 0.1);
  }

  textarea {
    min-height: 100px;
    resize: vertical;
    line-height: 1.6;
  }

  .input-with-button {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .input-grow {
    flex: 1;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1.5rem;
    background: var(--secondary);
    border-radius: var(--border-radius);
    margin-top: 1.25rem;
    border: 2px dashed var(--border-color);
  }

  .empty-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 0.75rem;
    opacity: 0.5;
  }

  .empty-state p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 1rem;
  }

  .list-items {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    margin-top: 1.25rem;
  }

  .list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.875rem 1.125rem;
    background: white;
    border: 1.5px solid var(--border-color);
    border-radius: var(--border-radius);
    transition: all 0.2s ease;
  }

  .list-item:hover {
    border-color: var(--primary);
    box-shadow: var(--shadow-sm);
  }

  .item-text {
    flex: 1;
    font-size: 0.9375rem;
    color: var(--text-primary);
  }

  .item-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .edit-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1.5px solid var(--primary);
    border-radius: var(--border-radius);
    font-size: 0.9375rem;
    background: #fffbeb;
  }

  .edit-input:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(31, 58, 95, 0.1);
  }

  .team-input-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr auto;
    gap: 0.75rem;
    align-items: center;
  }

    .team-table {
      margin-top: 1.25rem;
      border: 1.5px solid var(--border-color);
    border-radius: var(--border-radius);
      overflow: hidden;
  }

    .table-header {
      display: grid;
      grid-template-columns: 1.5fr 1fr auto;
      gap: 1rem;
      padding: 0.875rem 1.125rem;
      background: var(--secondary);
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-primary);
      border-bottom: 1.5px solid var(--border-color);
  }

    .table-row {
      display: grid;
      grid-template-columns: 1.5fr 1fr auto;
      gap: 1rem;
      padding: 0.875rem 1.125rem;
      background: white;
      border-bottom: 1px solid var(--border-color);
      transition: background 0.2s ease;
  }

    .table-row:last-child {
      border-bottom: none;
  }

    .table-row:hover {
      background: var(--secondary);
  }

    .col-name, .col-role {
      display: flex;
      align-items: center;
      font-size: 0.9375rem;
      color: var(--text-primary);
    }

    .col-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      justify-content: flex-end;
    }

    .edit-input-inline {
      width: 100%;
      padding: 0.375rem 0.625rem;
      border: 1.5px solid var(--primary);
      border-radius: var(--border-radius);
      font-size: 0.9375rem;
      background: #fffbeb;
    }

    .edit-input-inline:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(31, 58, 95, 0.1);
    }

    .btn-add {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--primary);
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: var(--border-radius);
      font-weight: 500;
      font-size: 0.9375rem;
    cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .btn-add:hover:not(:disabled) {
      background: var(--primary-light);
      transform: translateY(-1px);
      box-shadow: var(--shadow);
    }

    .btn-add:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-icon {
      font-size: 1rem;
    }

    .btn-icon-small {
      background: transparent;
      border: 1px solid var(--border-color);
      padding: 0.375rem 0.625rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9375rem;
    transition: all 0.2s ease;
  }

    .btn-icon-small.edit {
      color: var(--primary);
      border-color: var(--primary);
    }

    .btn-icon-small.edit:hover {
      background: var(--secondary);
    }

    .btn-icon-small.delete {
    color: var(--error-color);
      border-color: rgba(231, 76, 60, 0.3);
  }

    .btn-icon-small.delete:hover {
      background: var(--danger-light);
      border-color: var(--error-color);
    }

    .btn-icon-small.save {
      color: #1e7e34;
      border-color: rgba(46, 204, 113, 0.5);
      background: var(--accent-light);
      font-weight: 700;
    }

    .btn-icon-small.save:hover {
      background: #c3f4d6;
      border-color: #1e7e34;
    }

    .btn-icon-small.cancel {
      color: #6b7280;
      border-color: #d1d5db;
    }

    .btn-icon-small.cancel:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .action-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-top: 2px solid var(--border-color);
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
      z-index: 100;
      padding: 1.25rem 1.5rem;
    }

    .action-bar-content {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      gap: 1rem;
      justify-content: flex-start;
  }

    .btn-primary-large {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      background: var(--primary);
      color: white;
      padding: 0.875rem 2rem;
      border: none;
      border-radius: var(--border-radius);
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
    }

    .btn-primary-large:hover {
      background: var(--primary-light);
      transform: translateY(-2px);
      box-shadow: var(--shadow);
    }

    .btn-secondary-large {
      display: flex;
      align-items: center;
      background: white;
    color: var(--primary);
      padding: 0.875rem 2rem;
      border: 1.5px solid var(--border-color);
    border-radius: var(--border-radius);
      font-weight: 600;
      font-size: 1rem;
      text-decoration: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

    .btn-secondary-large:hover {
    background: var(--secondary);
    border-color: var(--primary);
  }

  .msg {
    padding: 1rem;
    border-radius: var(--border-radius);
    margin-top: 1.5rem;
    font-weight: 500;
  }

  .msg.success {
    background: var(--accent-light);
    color: #1e7e34;
    border: 1px solid rgba(46, 204, 113, 0.25);
  }

  @media (max-width: 768px) {
    main.container {
      padding: 1.5rem 1rem 140px;
    }

    .form-grid.three-col,
    .form-grid.two-col {
      grid-template-columns: 1fr;
    }

    .team-input-grid {
      grid-template-columns: 1fr;
    }

    .table-header,
    .table-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .col-actions {
      justify-content: flex-start;
    }

    .action-bar-content {
      flex-direction: column;
    }

    .btn-primary-large,
    .btn-secondary-large {
      width: 100%;
      justify-content: center;
    }
  }
</style>
