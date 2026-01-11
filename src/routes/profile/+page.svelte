<script>
import { onMount } from 'svelte';
import { session, getSession } from '$lib/auth/auth.js';
import { writable } from 'svelte/store';

// Local state
let name = '';
let email = '';
let address = '';
let phone = '';
let website = '';
let specialization = '';
let birthdate = '';
let healthInsurance = '';
let insuranceNumber = '';
let insuranceCardImage = null;
let insuranceCardPreview = '';
let newPassword = '';
let loading = false;
let message = '';
let error = '';

// Reactive role detection based on current session
$: isPatient = $session?.role === 'patient' || !$session?.role;

// Initial prefill from stored session if present
onMount(() => {
  const s = getSession();
  if (s?.name) name = s.name;
});

// Fetch user details whenever the session userId changes
let loadedUserId = null;
$: if ($session?.userId && $session.userId !== loadedUserId) {
  (async () => {
    loadedUserId = $session.userId;
    loading = true;
    try {
      const res = await fetch('/api/user?id=' + encodeURIComponent($session.userId));
      if (res.ok) {
        const j = await res.json();
        name = j.name || name;
        email = j.email || '';
        address = j.address || '';
        phone = j.phone || '';
        website = j.website || '';
        specialization = j.specialization || '';
        birthdate = j.birthdate || '';
        healthInsurance = j.healthInsurance || '';
        insuranceNumber = j.insuranceNumber || '';
        insuranceCardPreview = j.insuranceCardImage || '';
      }
    } catch (e) {
      // ignore network errors in prototype
    }
    loading = false;
  })();
}

function handleImageUpload(event) {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      insuranceCardPreview = e.target.result;
      insuranceCardImage = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

async function save(){
  message=''; error='';
  const cur = getSession();
  if(!cur?.userId){ error='Nicht eingeloggt'; return; }
  loading = true;
  try{
    const body = { action:'update', userId: cur.userId, name, email, address };
    if(isPatient){
      body.birthdate = birthdate;
      body.healthInsurance = healthInsurance;
      body.insuranceNumber = insuranceNumber;
      if(insuranceCardImage) body.insuranceCardImage = insuranceCardImage;
    } else {
      body.phone = phone;
      body.website = website;
      body.specialization = specialization;
    }
    if(newPassword) body.password = newPassword;
    const res = await fetch('/api/user',{ method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
    const j = await res.json();
    if(j.ok){
      message = 'Profil gespeichert.';
      // update local session
      session.update(v => ({ ...(v||{}), name }));
      newPassword = '';
      insuranceCardImage = null;
    } else {
      error = j.error || 'Fehler';
    }
  }catch(e){ error='Netzwerkfehler'; }
  loading = false;
}
</script>

<main class="page">
  <div class="container">
    <h1>Mein Profil</h1>
    {#if loading}
      <p class="muted">Lade…</p>
    {/if}

    {#if error}<div class="msg error">{error}</div>{/if}
    {#if message}<div class="msg success">{message}</div>{/if}

    <div class="card">
      {#if isPatient}
        <!-- Patienten-Profil -->
        <h2 class="section-title">Persönliche Daten</h2>
        <div class="form-grid">
          <label>Name
            <input bind:value={name} placeholder="Max Mustermann" />
          </label>
          <label>Geburtsdatum
            <input type="date" bind:value={birthdate} />
          </label>
          <label>Email
            <input type="email" bind:value={email} placeholder="max@beispiel.ch" />
          </label>
          <label>Adresse
            <input bind:value={address} placeholder="Musterstrasse 123, 8000 Zürich" />
          </label>
        </div>

        <h2 class="section-title" style="margin-top:24px">Krankenkasse</h2>
        <div class="form-grid">
          <label>Krankenkasse
            <input bind:value={healthInsurance} placeholder="z.B. CSS, Helsana, Swica" />
          </label>
          <label>Versichertennummer
            <input bind:value={insuranceNumber} placeholder="80756.123.456.789" />
          </label>
        </div>

        <div class="insurance-card-section">
          <h3 class="card-title">Krankenkassenkarte</h3>
          {#if insuranceCardPreview}
            <div class="card-preview">
              <img src={insuranceCardPreview} alt="Krankenkassenkarte" />
            </div>
          {:else}
            <div class="card-placeholder">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              <p>Keine Karte hinterlegt</p>
            </div>
          {/if}
          <label class="upload-btn">
            <input type="file" accept="image/*" on:change={handleImageUpload} style="display:none" />
            <button type="button" class="btn-secondary" on:click={(e)=>e.currentTarget.previousElementSibling.click()}>
              {insuranceCardPreview ? 'Karte ändern' : 'Karte hochladen'}
            </button>
          </label>
          <p class="hint">Karte hochladen, um Wartezeiten in der Praxis zu vermeiden.</p>
        </div>
      {:else}
        <!-- Praxis-Profil -->
        <h2 class="section-title">Praxisinformationen</h2>
        <div class="form-grid">
          <label>Praxisname / Arztname
            <input bind:value={name} placeholder="Dr. med. Anna Müller" />
          </label>
          <label>Fachrichtung
            <input bind:value={specialization} placeholder="z.B. Allgemeinmedizin, Innere Medizin" />
          </label>
          <label>Email
            <input type="email" bind:value={email} placeholder="praxis@beispiel.ch" />
          </label>
          <label>Telefon
            <input type="tel" bind:value={phone} placeholder="+41 44 123 45 67" />
          </label>
          <label class="full-width">Adresse
            <input bind:value={address} placeholder="Musterstrasse 123, 8000 Zürich" />
          </label>
          <label class="full-width">Website (optional)
            <input bind:value={website} placeholder="www.ihre-praxis.ch" />
          </label>
        </div>
      {/if}

      <h2 class="section-title" style="margin-top:24px">Sicherheit</h2>
      <label>Neues Passwort (optional)
        <input type="password" bind:value={newPassword} placeholder="Mindestens 8 Zeichen" />
      </label>

      <div style="margin-top:20px">
        <button class="btn-primary" on:click={save} disabled={loading}>Profil speichern</button>
      </div>
    </div>

    <p class="info-text">{isPatient ? 'Tipp: Dein Name und deine Krankenkassendaten werden automatisch bei Termin-Anfragen verwendet.' : 'Tipp: Diese Informationen werden in Ihrer Praxisübersicht angezeigt.'}</p>
  </div>
</main>

<style>
  .page{padding:24px;background:#f6f8fb;min-height:100vh}
  .container{max-width:900px;margin:0 auto}
  
  h1{font-size:2rem;margin:0 0 20px 0;color:#0f172a}
  
  .card{background:#fff;padding:32px;border-radius:14px;border:1px solid rgba(15,23,42,0.06);box-shadow:0 1px 3px rgba(0,0,0,0.03)}
  
  .section-title{font-size:1.2rem;font-weight:600;margin:0 0 20px 0;color:#334155;border-bottom:2px solid #f1f5f9;padding-bottom:8px}
  .card-title{font-size:1rem;font-weight:600;margin:0 0 12px 0;color:#475569}
  
  .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:16px}
  .full-width{grid-column:1 / -1}
  
  label{display:flex;flex-direction:column;font-size:0.9rem;font-weight:500;color:#475569;gap:8px;min-width:0}
  
  input{width:100%;padding:12px 14px;border-radius:8px;border:1px solid rgba(15,23,42,0.12);font-size:0.95rem;transition:border-color 0.2s;box-sizing:border-box}
  input:focus{outline:none;border-color:#3b82f6}
  input::placeholder{color:#94a3b8}
  
  .insurance-card-section{margin-top:16px;padding:16px;background:#f8fafc;border-radius:10px}
  
  .card-preview{margin-bottom:12px;border-radius:8px;overflow:hidden;max-width:400px}
  .card-preview img{width:100%;height:auto;display:block}
  
  .card-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;border:2px dashed #cbd5e1;border-radius:8px;color:#94a3b8;text-align:center}
  .card-placeholder svg{margin-bottom:12px;opacity:0.5}
  .card-placeholder p{margin:0;font-size:0.9rem}
  
  .upload-btn{margin-top:12px;display:inline-block}
  
  .hint{font-size:0.85rem;color:#64748b;margin:8px 0 0 0;font-style:italic}
  .info-text{margin-top:16px;color:#64748b;font-size:0.9rem}
  
  .muted{color:#64748b}
  .msg{padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:0.95rem}
  .msg.success{background:#dcfce7;color:#166534;border:1px solid #bbf7d0}
  .msg.error{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}
  
  .btn-primary{background:#3b82f6;color:#fff;padding:10px 20px;border-radius:8px;border:0;font-weight:500;cursor:pointer;transition:background 0.2s}
  .btn-primary:hover{background:#2563eb}
  .btn-primary:disabled{background:#94a3b8;cursor:not-allowed}
  
  .btn-secondary{background:#fff;color:#475569;padding:8px 16px;border-radius:8px;border:1px solid #cbd5e1;font-weight:500;cursor:pointer;transition:all 0.2s}
  .btn-secondary:hover{background:#f8fafc;border-color:#94a3b8}
  
  @media (max-width: 768px) {
    .form-grid{grid-template-columns:1fr;gap:16px}
    .card{padding:20px}
    h1{font-size:1.5rem}
  }
  
  @media (max-width: 640px) {
    .form-grid{grid-template-columns:1fr}
    .card{padding:16px}
    h1{font-size:1.3rem}
  }
</style>
