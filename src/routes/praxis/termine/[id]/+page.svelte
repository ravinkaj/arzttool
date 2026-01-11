<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { session } from '$lib/auth/auth.js';
  import { getTermine } from '$lib/utils/termineStore.js';
  import { getPraxenForOwner } from '$lib/utils/praxisStore.js';

  let termin = null;
  let loading = true;
  let allowed = false;
  let isPast = false;

  $: terminId = $page.params.id;

  function formatDate(dateStr) {
    if (!dateStr) return 'Unbekannt';
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-CH', { 
      weekday: 'long',
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
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

  function getArzt(fachrichtung) {
    const aerzte = {
      'Allgemeinmedizin': ['Dr. med. Nora Keller', 'Dr. med. Thomas Steiner', 'Dr. med. Anna Meier'],
      'Zahnmedizin': ['Dr. med. dent. Peter Huber', 'Dr. med. dent. Sophie Weber'],
      'Kardiologie': ['Dr. med. Felix Graf', 'Dr. med. Michael Zimmermann'],
      'Dermatologie': ['Dr. med. Lisa Bachmann', 'Dr. med. Julia Fischer'],
      'Pädiatrie': ['Dr. med. Jana Frei', 'Dr. med. Lea Marti'],
      'Orthopädie': ['Dr. med. Marco Widmer', 'Dr. med. Stefan Bauer'],
      'HNO': ['Dr. med. Monika Gerber', 'Dr. med. Daniel Wyss'],
      'Neurologie': ['Dr. med. Emma Müller', 'Dr. med. Noah Fischer'],
      'Augenheilkunde': ['Dr. med. Luca Schmidt', 'Dr. med. Mia Weber']
    };
    
    const list = aerzte[fachrichtung] || ['Dr. med. Andreas Keller'];
    return list[Math.floor(Math.random() * list.length)];
  }

  function getBehandlungen(note, fach) {
    const behandlungen = [];
    
    // Basierend auf Notiz und Fachrichtung realistische Behandlungen generieren
    if (note && /impf/i.test(note)) {
      behandlungen.push({
        name: 'Schutzimpfung',
        dauer: '10 Min',
        beschreibung: 'Verabreichung der Impfung gemäß Impfplan'
      });
    }
    
    if (note && /routine|check|kontrolle/i.test(note)) {
      behandlungen.push({
        name: 'Anamnese und körperliche Untersuchung',
        dauer: '15 Min',
        beschreibung: 'Ausführliche Befragung und körperliche Untersuchung'
      });
      behandlungen.push({
        name: 'Vitalparameter-Messung',
        dauer: '5 Min',
        beschreibung: 'Blutdruck, Puls, Temperatur, Sauerstoffsättigung'
      });
    }
    
    if (note && /labor/i.test(note)) {
      behandlungen.push({
        name: 'Blutentnahme',
        dauer: '5 Min',
        beschreibung: 'Venöse Blutentnahme für Labordiagnostik'
      });
      behandlungen.push({
        name: 'Laborbesprechung',
        dauer: '10 Min',
        beschreibung: 'Besprechung und Interpretation der Laborwerte'
      });
    }
    
    if (note && /physio/i.test(note)) {
      behandlungen.push({
        name: 'Physiotherapeutische Behandlung',
        dauer: '30 Min',
        beschreibung: 'Manuelle Therapie und Übungen'
      });
    }
    
    if (fach === 'Zahnmedizin') {
      behandlungen.push({
        name: 'Zahnärztliche Untersuchung',
        dauer: '15 Min',
        beschreibung: 'Inspektion der Zähne und des Zahnfleisches'
      });
      if (note && /kontrolle|check/i.test(note)) {
        behandlungen.push({
          name: 'Professionelle Zahnreinigung',
          dauer: '30 Min',
          beschreibung: 'Entfernung von Zahnstein und Politur'
        });
      }
    }
    
    // Wenn keine spezifischen Behandlungen gefunden wurden, Standard hinzufügen
    if (behandlungen.length === 0) {
      behandlungen.push({
        name: 'Erstberatung',
        dauer: '20 Min',
        beschreibung: 'Ausführliches Beratungsgespräch und Untersuchung'
      });
    }
    
    return behandlungen;
  }

  function load() {
    if (typeof window === 'undefined') return;
    loading = true;
    
    const ownerId = $session?.userId || 'sample_owner';
    const praxen = getPraxenForOwner(ownerId) || [];
    const praxisIds = new Set(praxen.map((p) => String(p._id || p.id)));
    
    const allTermine = getTermine();
    const t = allTermine.find(t => String(t.id) === String(terminId));
    
    allowed = !!(t && praxisIds.has(String(t.praxisId)));
    
    if (!allowed) {
      loading = false;
      termin = null;
      return;
    }
    
    termin = {
      ...t,
      arzt: getArzt(t.fach),
      behandlungen: getBehandlungen(t.note, t.fach)
    };
    
    isPast = isPastTermin(t.dateTime || t.time);
    loading = false;
  }

  onMount(load);
</script>

<main class="container">
  {#if !$session || $session.role !== 'praxis'}
    <div class="card">Diese Seite ist nur für Praxis-Accounts. Bitte <a href="/login">anmelden</a>.</div>
  {:else if loading}
    <p>Lade...</p>
  {:else if !allowed || !termin}
    <div class="card">Kein Zugriff auf diesen Termin. <button class="ghost" on:click={() => goto('/praxis/dashboard')}>Zum Dashboard</button></div>
  {:else}
    <div class="crumbs">
      <a href="/praxis/patienten">Patienten</a> / 
      <a href="/praxis/patienten/{termin.patientId}">Patient</a> / 
      <span>Termin Details</span>
    </div>
    
    <div class="header">
      <div>
        <h1>📅 Termindetails</h1>
        <p class="subtitle">{formatDate(termin.dateTime || termin.time)} um {formatTime(termin.dateTime || termin.time)}</p>
      </div>
      <div class="status-badge status-{termin.status.toLowerCase()}">{termin.status}</div>
    </div>

    <div class="grid-2col">
      <section class="card">
        <h3>👤 Patient</h3>
        <div class="info-group">
          <div class="info-line">
            <span class="label">Name</span>
            <span class="value">{termin.patient}</span>
          </div>
          <div class="info-line">
            <span class="label">Telefon</span>
            <span class="value">{termin.patientPhone || 'Nicht angegeben'}</span>
          </div>
          <div class="info-line">
            <span class="label">E-Mail</span>
            <span class="value">{termin.patientEmail || 'Nicht angegeben'}</span>
          </div>
          <div class="info-line">
            <span class="label">Adresse</span>
            <span class="value">{termin.patientAddress || 'Nicht angegeben'}</span>
          </div>
        </div>
        <a href="/praxis/patienten/{termin.patientId}" class="btn-link">→ Patientenakte öffnen</a>
      </section>

      <section class="card">
        <h3>🏥 Praxis & Behandlung</h3>
        <div class="info-group">
          <div class="info-line">
            <span class="label">Praxis</span>
            <span class="value">{termin.praxisName}</span>
          </div>
          <div class="info-line">
            <span class="label">Fachrichtung</span>
            <span class="value">{termin.fach}</span>
          </div>
          <div class="info-line">
            <span class="label">Behandelnder Arzt</span>
            <span class="value">{termin.arzt}</span>
          </div>
          <div class="info-line">
            <span class="label">Standort</span>
            <span class="value">{termin.city}</span>
          </div>
          <div class="info-line">
            <span class="label">Adresse</span>
            <span class="value">{termin.address}</span>
          </div>
        </div>
      </section>
    </div>

    {#if termin.note}
      <section class="card">
        <h3>📝 Terminnotiz</h3>
        <div class="note-box">{termin.note}</div>
      </section>
    {/if}

    {#if isPast}
      <section class="card">
        <h3>💉 Durchgeführte Behandlungen</h3>
        <div class="behandlungen-list">
          {#each termin.behandlungen as behandlung, idx}
            <div class="behandlung-item">
              <div class="behandlung-header">
                <div class="behandlung-number">{idx + 1}</div>
                <div class="behandlung-info">
                  <div class="behandlung-name">{behandlung.name}</div>
                  <div class="behandlung-dauer">⏱️ Dauer: {behandlung.dauer}</div>
                </div>
              </div>
              <div class="behandlung-beschreibung">{behandlung.beschreibung}</div>
            </div>
          {/each}
        </div>
      </section>
    {:else}
      <section class="card">
        <h3>📋 Künftiger Termin</h3>
        <p class="note-box">Dieser Termin liegt in der Zukunft. Behandlungsdetails werden nach Terminabschluss dokumentiert.</p>
      </section>
    {/if}

    <section class="card">
      <h3>💳 Versicherungsinformationen</h3>
      <div class="info-group">
        <div class="info-line">
          <span class="label">Krankenkasse</span>
          <span class="value">{termin.healthInsurance || 'Nicht angegeben'}</span>
        </div>
        <div class="info-line">
          <span class="label">Versicherungsnummer</span>
          <span class="value">{termin.insuranceNumber || 'Nicht angegeben'}</span>
        </div>
      </div>
    </section>

    {#if termin.medicalNote}
      <section class="card medical-note">
        <div class="section-head">
          <h3>🔒 Medizinische Notizen</h3>
          <span class="muted">Vertraulich</span>
        </div>
        <div class="note-box">{termin.medicalNote}</div>
      </section>
    {/if}

    <div class="actions">
      <button class="btn-secondary" on:click={() => goto('/praxis/patienten/' + termin.patientId)}>
        ← Zurück zur Patientenakte
      </button>
      <button class="btn-primary" on:click={() => goto('/praxis/dashboard')}>
        Zum Dashboard
      </button>
    </div>
  {/if}
</main>

<style>
  .container{max-width:1100px;margin:0 auto;padding:1.5rem}
  .crumbs{margin-bottom:0.5rem;color:var(--text-secondary);font-size:0.9375rem}
  .crumbs a{color:var(--primary);text-decoration:none}
  .crumbs a:hover{text-decoration:underline}
  
  .header{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap}
  .header h1{margin:0;font-size:2rem;font-weight:700;color:var(--text-primary)}
  .subtitle{margin:0.25rem 0 0 0;color:var(--text-secondary);font-size:1.125rem}
  
  .status-badge{padding:0.5rem 1rem;border-radius:8px;font-size:0.9375rem;font-weight:600;white-space:nowrap}
  .status-bestätigt{background:#d1fae5;color:#065f46}
  .status-abgeschlossen{background:#dbeafe;color:#1e40af}
  .status-abgesagt{background:#fee2e2;color:#991b1b}
  .status-angefragt{background:#fef3c7;color:#92400e}
  
  .grid-2col{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem;margin-bottom:1rem}
  
  .card{background:white;border:1px solid var(--border-color);border-radius:12px;padding:1.5rem;margin-bottom:1rem}
  .card h3{margin:0 0 1rem 0;font-size:1.25rem;font-weight:600;color:var(--text-primary)}
  
  .info-group{display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1rem}
  .info-line{display:flex;gap:1rem;align-items:baseline}
  .label{min-width:150px;font-weight:600;color:var(--text-secondary);font-size:0.9375rem}
  .value{flex:1;color:var(--text-primary);font-size:0.9375rem}
  
  .btn-link{display:inline-block;padding:0.5rem 1rem;background:var(--secondary);border:1.5px solid var(--border-color);border-radius:8px;color:var(--primary);text-decoration:none;font-weight:500;font-size:0.9375rem;transition:all 0.2s ease}
  .btn-link:hover{background:white;border-color:var(--primary);box-shadow:0 2px 8px rgba(31,58,95,0.1)}
  
  .note-box{padding:1rem;background:#f9fafb;border:1px solid var(--border-color);border-radius:8px;line-height:1.6;color:var(--text-primary)}
  
  .behandlungen-list{display:flex;flex-direction:column;gap:1rem}
  .behandlung-item{border:1.5px solid var(--border-color);border-radius:10px;padding:1.25rem;transition:all 0.2s ease}
  .behandlung-item:hover{border-color:var(--primary);box-shadow:0 4px 12px rgba(31,58,95,0.08)}
  .behandlung-header{display:flex;gap:1rem;align-items:flex-start;margin-bottom:0.75rem}
  .behandlung-number{width:36px;height:36px;background:var(--primary);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.125rem;flex-shrink:0}
  .behandlung-info{flex:1}
  .behandlung-name{font-weight:700;font-size:1.0625rem;color:var(--text-primary);margin-bottom:0.25rem}
  .behandlung-dauer{color:var(--text-secondary);font-size:0.9375rem}
  .behandlung-beschreibung{padding-left:52px;color:var(--text-secondary);line-height:1.5}
  
  .medical-note{background:linear-gradient(135deg,#fefce8 0%,#fef3c7 100%);border-color:#fbbf24}
  .section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
  .muted{color:var(--text-secondary)}
  
  .actions{display:flex;gap:1rem;justify-content:flex-end;margin-top:2rem;flex-wrap:wrap}
  .btn-secondary{padding:0.75rem 1.5rem;border:1.5px solid var(--border-color);border-radius:8px;background:white;color:var(--text-primary);font-weight:500;cursor:pointer;transition:all 0.2s ease}
  .btn-secondary:hover{background:var(--secondary);border-color:var(--primary)}
  .btn-primary{padding:0.75rem 1.5rem;border:none;border-radius:8px;background:var(--primary);color:white;font-weight:500;cursor:pointer;transition:all 0.2s ease}
  .btn-primary:hover{background:var(--primary-light);transform:translateY(-2px);box-shadow:var(--shadow)}
  .ghost{padding:0.5rem 0.75rem;border:1px solid var(--border-color);border-radius:8px;background:white;cursor:pointer}
  
  @media (max-width: 768px) {
    .container{padding:1rem}
    .header h1{font-size:1.5rem}
    .grid-2col{grid-template-columns:1fr}
    .actions{flex-direction:column}
    .btn-secondary,.btn-primary{width:100%}
  }
</style>
