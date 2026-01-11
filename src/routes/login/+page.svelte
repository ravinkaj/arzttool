<script>
  import { goto } from '$app/navigation';
  import { login, register } from '$lib/auth/auth.js';

  let mode = 'login'; // or 'register'
  let role = 'patient';
  let name = '';
  let email = '';
  let password = '';
  let password2 = '';
  let message = '';
  let loading = false;

  function resetMsg() { message = ''; }

  async function doRegister() {
    resetMsg();
    if (!email || !password) { message = 'Bitte E‑Mail und Passwort eingeben.'; return; }
    if (password.length < 8) { message = 'Passwort muss mindestens 8 Zeichen haben.'; return; }
    if (password !== password2) { message = 'Passwörter stimmen nicht überein.'; return; }
    loading = true;
    try {
      await register(email, password, role, name);
      goto(role === 'praxis' ? '/praxis/dashboard' : '/');
    } catch (e) { message = e.message || 'Registrierung fehlgeschlagen'; }
    loading = false;
  }

  async function doLogin() {
    resetMsg();
    if (!email || !password) { message = 'Bitte E‑Mail und Passwort eingeben.'; return; }
    loading = true;
    try {
      await login(role, email, password);
      goto('/');
    } catch (e) { message = e.message || 'Anmeldung fehlgeschlagen'; }
    loading = false;
  }
</script>

<main style="display:flex;align-items:center;justify-content:center;min-height:60vh;padding:2rem">
  <div class="card" style="max-width:520px;width:100%;text-align:center">
    <h1>{mode === 'login' ? 'Anmelden' : 'Registrieren'}</h1>
    <div style="display:flex;gap:1rem;justify-content:center;margin-bottom:0.75rem">
      <button class="btn-primary" on:click={() => mode = 'login'} disabled={mode === 'login'}>Login</button>
      <button class="btn-primary" on:click={() => mode = 'register'} disabled={mode === 'register'}>Registrieren</button>
    </div>

    <div style="text-align:left">
      {#if mode === 'register'}
        <label>Name
          <input bind:value={name} placeholder="z.B. Dr. Anna Keller / Max Muster" />
        </label>
      {/if}
      <label>E‑Mail
        <input type="email" bind:value={email} placeholder="name@beispiel.ch" />
      </label>

      <label>Passwort
        <input type="password" bind:value={password} placeholder="Mindestens 8 Zeichen" />
      </label>

      {#if mode === 'register'}
        <label>Passwort wiederholen
          <input type="password" bind:value={password2} placeholder="Passwort wiederholen" />
        </label>
      {/if}

      <label>Rolle
        <select bind:value={role}>
          <option value="patient">Patient:in</option>
          <option value="praxis">Praxis</option>
        </select>
      </label>

      <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:0.75rem">
        {#if mode === 'login'}
          <button class="btn-primary" on:click={doLogin} disabled={loading}>Anmelden</button>
        {:else}
          <button class="btn-primary" on:click={doRegister} disabled={loading}>Registrieren</button>
        {/if}
      </div>

      {#if message}
        <div class="msg" style="margin-top:0.75rem;color:#b91c1c">{message}</div>
      {/if}
    </div>
  </div>
</main>

<style>
  label{display:block;margin-bottom:0.6rem}
  input,select{width:100%;padding:0.5rem;border-radius:8px;border:1px solid rgba(15,23,42,0.06)}
  .card{padding:1.25rem;border-radius:12px;background:var(--card);box-shadow:0 8px 24px rgba(16,24,40,0.06)}
</style>
