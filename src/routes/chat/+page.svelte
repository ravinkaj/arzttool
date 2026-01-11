<script>
  import Chatbot from '$lib/components/Chatbot.svelte';
  import { onMount } from 'svelte';
  let praxen = [];
  let coords = [];

  async function fetchPraxen(fach) {
    const q = fach ? `?fach=${encodeURIComponent(fach)}` : '';
    const res = await fetch('/api/praxen' + q);
    praxen = await res.json();
    coords = praxen.map(p => ({ lat: p.coords?.lat || 47.3769, lng: p.coords?.lng || 8.5417, label: p.name, id: p._id, fach: p.fach, city: p.city, waitMinutes: p.waitMinutes }));
  }

  onMount(() => { fetchPraxen(); });

  function handleSuggest(e) { fetchPraxen(e.detail.specialty); }
</script>

<main class="container">
  <div class="page-header">
    <h1>💬 Chatbot & Praxen finden</h1>
    <p class="page-subtitle">Beschreiben Sie Ihre Beschwerden und finden Sie passende Praxen in Ihrer Nähe</p>
  </div>
  
  <div class="chat-layout">
    <Chatbot on:suggest={handleSuggest} />
  </div>
</main>

<style>
  main.container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    background: #f8fafc;
    min-height: 100vh;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
  }

  .page-subtitle {
    color: var(--text-secondary);
    font-size: 1rem;
    margin: 0;
  }

  .chat-layout {
    display: flex;
    justify-content: center;
  }

  @media (max-width: 768px) {
    main.container {
      padding: 1.5rem 1rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
    }
  }
</style>
