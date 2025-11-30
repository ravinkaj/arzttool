<script>
  import { page } from '$app/stores';
  import { session, logout } from '$lib/auth/auth.js';
  // Use Svelte's auto-subscription feature by referencing `$session` in markup.
  // Do not declare `let $session` or manually name variables starting with `$`.
</script>

<header class="nav">
  <div class="brand"><a href="/">ArztTool</a></div>
  <nav>
    <a href="/" class:active={$page.url.pathname === '/'}>Praxen</a>
    <a href="/termine" class:active={$page.url.pathname.startsWith('/termine')}>Termine</a>
    {#if $session}
      {#if $session.role === 'arzt'}
        <a href="/arzt/dashboard">Dashboard</a>
      {/if}
      <span class="who">{ $session.role } ({ $session.userId })</span>
      <button class="logout" on:click={() => { logout(); }}>Abmelden</button>
    {:else}
      <a href="/login">Anmelden</a>
    {/if}
  </nav>
</header>

<style>
  .nav { display:flex; justify-content:space-between; align-items:center; padding:0.75rem 1rem; background:var(--primary); color:#fff }
  .brand a { color:inherit; text-decoration:none; font-weight:700 }
  nav a { color:rgba(255,255,255,0.9); margin-left:1rem; text-decoration:none }
  .who { margin-left:1rem; color:rgba(255,255,255,0.85) }
  .logout{ margin-left:0.5rem; background:transparent;border:1px solid rgba(255,255,255,0.15);color:#fff;padding:0.25rem 0.5rem;border-radius:6px }
  nav a.active { text-decoration:underline }
</style>
