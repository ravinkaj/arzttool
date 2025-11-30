<script>
  import { login } from '$lib/auth/auth.js';
  import { goto } from '$app/navigation';

  let role = 'patient';
  let userId = '';
  let message = '';

  async function submit() {
    // call client login which sets session store + localStorage
    const s = login(role, userId || null);
    // optionally inform server (mock)
    await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'login', role: s.role, userId: s.userId }) });
    goto('/');
  }
</script>

<main>
  <h1>Anmelden</h1>
  <div class="card">
    <label>Rolle
      <select bind:value={role}>
        <option value="patient">Patient</option>
        <option value="arzt">Arzt</option>
      </select>
    </label>

    <label>User-Id (optional)
      <input bind:value={userId} placeholder="z.B. arzt1 oder user_123" />
    </label>

    <button class="btn-primary" on:click={submit}>Anmelden</button>
    {#if message}<div class="msg">{message}</div>{/if}
  </div>
</main>

<style>
  .card{padding:1rem;border-radius:10px;background:var(--card);max-width:420px}
  label{display:flex;flex-direction:column;margin-bottom:0.75rem}
</style>
