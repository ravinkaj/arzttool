<script>
  import { page } from '$app/stores';
  import { session, logout } from '$lib/auth/auth.js';
  // Use Svelte's auto-subscription feature by referencing `$session` in markup.
  // Do not declare `let $session` or manually name variables starting with `$`.
</script>

<header class="nav">
  <div class="nav-left brand"><a href="/">MedPortal</a></div>
  <nav class="nav-center">
    {#if !$session}
      <a href="/" class:active={$page.url.pathname === '/'}>Praxen</a>
      <a href="/termine" class:active={$page.url.pathname.startsWith('/termine')}>Termine</a>
      <a href="/chat" class:active={$page.url.pathname === '/chat'}>Chatbot</a>
    {:else if $session.role === 'patient'}
      <a href="/" class:active={$page.url.pathname === '/'}>Praxen</a>
      <a href="/termine" class:active={$page.url.pathname.startsWith('/termine')}>Termine</a>
      <a href="/chat" class:active={$page.url.pathname === '/chat'}>Chatbot</a>
    {:else if $session.role === 'praxis'}
      <a href="/praxis/dashboard" class:active={$page.url.pathname.startsWith('/praxis/dashboard')}>Dashboard</a>
      <a href="/praxis/calendar" class:active={$page.url.pathname.startsWith('/praxis/calendar')}>Kalender</a>
      <a href="/praxis/patienten" class:active={$page.url.pathname.startsWith('/praxis/patienten')}>Patienten</a>
      <a href="/praxis/manage" class:active={$page.url.pathname.startsWith('/praxis/manage')}>Meine Praxen</a>
    {/if}
  </nav>
  <div class="nav-actions">
    {#if !$session}
      <a href="/login" class="btn-action neutral">Anmelden</a>
    {:else}
      <div class="role-badge" title={$session.role === 'patient' ? 'Angemeldet als Patient' : 'Angemeldet als Praxis'}>
        <span class="role-label">Angemeldet als:</span>
        {#if $session.role === 'patient'}
          <span class="role-icon">👤</span>
          <span class="role-text">Patient</span>
        {:else if $session.role === 'praxis'}
          <span class="role-icon">🏥</span>
          <span class="role-text">Praxis</span>
        {/if}
      </div>
      <a href="/profile" class="btn-action neutral"><span class="icon-user">👤</span> Profil</a>
      <button class="btn-action logout" on:click={() => { logout(); }}>Abmelden</button>
    {/if}
  </div>
</header>
<div style="position:fixed;right:12px;bottom:12px;z-index:60">
  <div class="badge" style="background:rgba(51,65,85,0.06);padding:6px 10px;border-radius:8px;font-size:0.85rem">Demo-Modus</div>
</div>

<style>
  .nav{
    display:grid;
    grid-template-columns:1fr auto 1fr;
    align-items:center;
    padding:0.875rem 2rem;
    background:var(--primary);
    color:#fff;
    box-shadow:0 2px 8px rgba(31,58,95,0.15);
  }
  .brand a{
    color:#fff;
    text-decoration:none;
    font-weight:700;
    font-size:1.35rem;
    letter-spacing:-0.01em;
  }
  .nav-center{
    justify-self:center;
    display:flex;
    align-items:center;
    gap:1rem;
  }
  .nav-center > a{
    color:rgba(255,255,255,0.85);
    text-decoration:none;
    padding:0.45rem 0.75rem;
    font-weight:500;
    font-size:0.95rem;
    transition:all 0.2s ease;
    border-bottom:2px solid transparent;
  }
  .nav-center > a:hover{
    color:#fff;
    border-bottom-color:rgba(255,255,255,0.35);
  }
  .nav-center > a.active{
    color:#fff;
    border-bottom-color:#fff;
  }
  .nav-actions{
    justify-self:end;
    display:flex;
    align-items:center;
    gap:0.5rem;
  }
  .btn-action{
    display:flex;
    align-items:center;
    gap:0.4rem;
    text-decoration:none;
    padding:0.45rem 0.75rem;
    border-radius:8px;
    font-size:0.95rem;
    font-weight:500;
    transition:all 0.2s ease;
    border:1px solid rgba(255,255,255,0.2);
    background:transparent;
    color:rgba(255,255,255,0.92);
  }
  .btn-action.neutral:hover{
    background:rgba(255,255,255,0.12);
    border-color:rgba(255,255,255,0.35);
  }
  .btn-action.logout{
    color:#f59e0b; /* warm amber */
    border-color:rgba(245,158,11,0.35);
    background:rgba(245,158,11,0.08);
  }
  .btn-action.logout:hover{
    color:#d97706;
    border-color:rgba(217,119,6,0.5);
    background:rgba(245,158,11,0.15);
  }
  .icon-user{font-size:1rem}
  .role-badge{
    display:flex;
    align-items:center;
    gap:0.4rem;
    padding:0.35rem 0.7rem;
    border-radius:20px;
    background:rgba(255,255,255,0.2);
    color:#fff;
    font-size:0.85rem;
    font-weight:600;
    border:none;
    margin-right:0.75rem;
    box-shadow:0 1px 3px rgba(0,0,0,0.1);
    backdrop-filter:blur(4px);
  }label{
    font-size:0.8rem;
    font-weight:400;
    opacity:0.85;
    letter-spacing:0.2px;
  }
  .role-
  .role-icon{
    font-size:1rem;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,0.1));
  }
  .role-text{
    font-size:0.82rem;
    letter-spacing:0.5px;
    text-transform:uppercase;
    font-weight:600;
  }
</style>
