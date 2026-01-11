<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  onMount(()=>{
    // default landing for /praxis redirects to dashboard
    goto('/praxis/dashboard');
  });
</script>

<main>
  <p>Weiterleitung…</p>
</main>
