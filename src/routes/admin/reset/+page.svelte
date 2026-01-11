<script>
  import { browser } from '$app/environment';
  
  let message = '';
  
  function clearAllData() {
    if (!browser) return;
    
    try {
      // Alle relevanten LocalStorage-Keys löschen
      localStorage.removeItem('arzttool_praxen_owner');
      localStorage.removeItem('arzttool_termine');
      localStorage.removeItem('favoritenPraxis');
      localStorage.removeItem('session');
      
      message = '✅ Alle Daten wurden gelöscht. Bitte Seite neu laden (F5).';
      
      // Nach 2 Sekunden automatisch neu laden
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (e) {
      message = '❌ Fehler beim Löschen: ' + e.message;
    }
  }
</script>

<main class="page">
  <div class="container">
    <h1>🔧 Daten zurücksetzen</h1>
    <p class="info">Diese Seite setzt alle lokalen Demo-Daten zurück.</p>
    
    {#if message}
      <div class="message">{message}</div>
    {/if}
    
    <div class="card">
      <h2>LocalStorage bereinigen</h2>
      <p>Klicke hier, um alle alten "Demo Praxis" Daten zu löschen und frische Daten zu laden:</p>
      <button class="btn-danger" on:click={clearAllData}>
        Alle Daten zurücksetzen
      </button>
    </div>
    
    <div class="card">
      <h2>Was wird gelöscht?</h2>
      <ul>
        <li>Alle Praxis-Daten (arzttool_praxen_owner)</li>
        <li>Alle Termine (arzttool_termine)</li>
        <li>Favoriten (favoritenPraxis)</li>
        <li>Session-Daten</li>
      </ul>
    </div>
  </div>
</main>

<style>
  .page {
    padding: 24px;
    background: #f6f8fb;
    min-height: 100vh;
  }
  
  .container {
    max-width: 700px;
    margin: 0 auto;
  }
  
  h1 {
    font-size: 2rem;
    margin: 0 0 12px 0;
    color: #0f172a;
  }
  
  .info {
    color: #64748b;
    margin-bottom: 24px;
  }
  
  .card {
    background: #fff;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid rgba(15,23,42,0.06);
    margin-bottom: 16px;
  }
  
  h2 {
    margin: 0 0 12px 0;
    font-size: 1.2rem;
    color: #334155;
  }
  
  .btn-danger {
    background: #ef4444;
    color: #fff;
    padding: 12px 24px;
    border-radius: 8px;
    border: 0;
    font-weight: 600;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.2s;
  }
  
  .btn-danger:hover {
    background: #dc2626;
  }
  
  .message {
    background: #dcfce7;
    color: #166534;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-weight: 500;
    border: 1px solid #bbf7d0;
  }
  
  ul {
    margin: 12px 0 0 0;
    padding-left: 24px;
    color: #475569;
  }
  
  li {
    margin-bottom: 8px;
  }
</style>
