<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getSession } from '$lib/auth/auth.js';

  onMount(() => {
    const s = getSession();
    // redirect legacy /arzt/dashboard to /praxis/dashboard
    if (s && s.role === 'praxis') goto('/praxis/dashboard');
  });
</script>

<main>
  <h1>Praxis Dashboard (umgeleitet)</h1>
  <p>Sie werden weitergeleitet. Falls nicht, gehen Sie bitte zum <a href="/praxis/dashboard">Praxis Dashboard</a>.</p>
</main>
