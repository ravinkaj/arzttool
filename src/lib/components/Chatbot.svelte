<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  let input = '';
  let messages = [];
  let stage = 'askComplaint';
  let suggested = null;
  let city = '';
  let results = [];
  let messagesContainer;

  // Welcome message
  messages = [
    { from: 'bot', text: '👋 Willkommen! Ich bin Ihr MedPortal-Assistent.' },
    { from: 'bot', text: '⚕️ Ich helfe Ihnen, passende Fachrichtungen und Praxen zu finden. Dies ist keine medizinische Beratung oder Diagnose.' },
    { from: 'bot', text: 'Beschreiben Sie kurz Ihre Beschwerden oder wählen Sie aus den Beispielen:' }
  ];

  const quickExamples = [
    { label: '🦷 Zahnschmerzen', value: 'Zahnschmerzen und geschwollenes Zahnfleisch' },
    { label: '🤧 Erkältung / Grippe', value: 'Husten, Schnupfen und Fieber' },
    { label: '🩺 Allgemeine Vorsorge', value: 'Allgemeine Untersuchung und Gesundheitscheck' },
    { label: '💊 Hautprobleme', value: 'Hautausschlag und Juckreiz' }
  ];

  function suggestSpecialty(text) {
    const t = String(text || '').toLowerCase();
    
    // Zahnmedizin
    if (/zahn|zähne|tooth|gebiss|karies|wurzel|zahnfleisch/.test(t)) return 'Zahnmedizin';
    
    // Kardiologie
    if (/herz|brust|stechen|kurzatm|atemnot|herzstolper|blutdruck/.test(t)) return 'Kardiologie';
    
    // Dermatologie
    if (/haut|ekzem|juck|ausschlag|pickel|akne|warze|dermat|allergie/.test(t)) return 'Dermatologie';
    
    // Pädiatrie
    if (/kind|baby|kinderarzt|säugling|kleinkind|jugendlich/.test(t)) return 'Pädiatrie';
    
    // Augenheilkunde
    if (/auge|seh|sicht|blind|optik|brille|kontaktlinse/.test(t)) return 'Augenheilkunde';
    
    // Neurologie
    if (/kopf|migräne|kopfschmerz|schwindel|nerv|lähmung|tremor/.test(t)) return 'Neurologie';
    
    // HNO
    if (/hals|ohr|nase|stimme|höre|tonsil|mandel|schwerhör/.test(t)) return 'HNO';
    
    // Orthopädie
    if (/rücken|knie|gelenk|knochen|bandscheibe|wirbel|arthro/.test(t)) return 'Orthopädie';
    
    // Innere Medizin
    if (/magen|darm|bauch|leber|niere|diabetes|zucker|blut/.test(t)) return 'Innere Medizin';
    
    // Gynäkologie
    if (/gynä|frauen|schwanger|periode|menstruation|geburt/.test(t)) return 'Gynäkologie';
    
    // Default
    return 'Allgemeinmedizin';
  }

  function addMessage(from, text) {
    messages = [...messages, { from, text }];
    setTimeout(scrollToBottom, 50);
  }

  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  async function onSubmit(){
    if(!input.trim()) return;
    const text = input.trim();
    input = '';
    
    addMessage('user', text);

    if(stage === 'askComplaint'){
      suggested = suggestSpecialty(text);
      setTimeout(() => {
        addMessage('bot', `💡 Basierend auf Ihrer Beschreibung empfehle ich: **${suggested}**`);
        addMessage('bot', 'Möchten Sie nach Praxen in Ihrer Nähe suchen?');
      }, 300);
      stage = 'confirmSpecialty';
      dispatch('suggest', { specialty: suggested });
      return;
    }

    if(stage === 'askCity'){
      city = text;
      addMessage('bot', `🔍 Suche ${suggested}-Praxen in ${city}...`);
      await findPraxen(suggested, city);
      stage = 'showResults';
      return;
    }
  }

  function quickComplaint(example){
    input = example.value;
    setTimeout(() => onSubmit(), 100);
  }

  function confirmSearch(yes){
    if(yes){
      addMessage('user', 'Ja, Praxen suchen');
      setTimeout(() => {
        addMessage('bot', '📍 In welcher Stadt suchen Sie? (z.B. Zürich, Bern, Basel)');
      }, 300);
      stage = 'askCity';
    } else {
      addMessage('user', 'Nein, genauer beschreiben');
      setTimeout(() => {
        addMessage('bot', 'Kein Problem. Beschreiben Sie bitte genauer, was Sie belastet.');
      }, 300);
      stage = 'askComplaint';
    }
  }

  async function findPraxen(fach, cityQuery){
    try{
      const res = await fetch('/api/praxen');
      const all = await res.json();
      const q = String((fach||'').toLowerCase());
      const cityq = String((cityQuery||'').toLowerCase()).trim();
      const filtered = (Array.isArray(all) ? all : []).filter(p => {
        const f = String(p.fach||'').toLowerCase();
        const c = String(p.city||'').toLowerCase();
        const inFach = f.includes(q) || q.includes(f) || (q === 'allgemeinmedizin' && f.includes('allgemein'));
        const inCity = !cityq || c.includes(cityq);
        return inFach && inCity;
      }).sort((a, b) => (a.waitMinutes || 999) - (b.waitMinutes || 999));
      
      results = filtered.slice(0, 5);
      
      setTimeout(() => {
        if(results.length){
          addMessage('bot', `✅ Ich habe **${results.length} ${results.length === 1 ? 'Praxis' : 'Praxen'}** gefunden, sortiert nach Wartezeit:`);
        } else {
          addMessage('bot', '❌ Leider keine passenden Praxen gefunden. Versuchen Sie einen anderen Ort oder eine andere Fachrichtung.');
        }
      }, 400);
    }catch(e){
      setTimeout(() => {
        addMessage('bot', '⚠️ Fehler beim Suchen. Bitte versuchen Sie es später erneut.');
      }, 400);
    }
  }

  function openPraxis(id){
    window.location.href = '/praxis/' + id;
  }

  function restartChat() {
    messages = [
      { from: 'bot', text: '🔄 Chat zurückgesetzt.' },
      { from: 'bot', text: 'Beschreiben Sie Ihre Beschwerden oder wählen Sie ein Beispiel:' }
    ];
    stage = 'askComplaint';
    suggested = null;
    city = '';
    results = [];
    input = '';
  }
</script>

<div class="chatbot-container">
  <div class="chatbot-header">
    <div class="header-content">
      <span class="header-icon">💬</span>
      <div>
        <h3 class="header-title">MedPortal Assistent</h3>
        <p class="header-subtitle">Finden Sie die passende Praxis</p>
      </div>
    </div>
    <button class="btn-restart" on:click={restartChat} title="Chat zurücksetzen">🔄</button>
  </div>

  <div class="messages-wrapper" bind:this={messagesContainer}>
    {#each messages as m}
      <div class="message-row" class:user-row={m.from === 'user'}>
        <div class="message" class:user-msg={m.from === 'user'} class:bot-msg={m.from === 'bot'}>
          {#if m.from === 'bot'}
            <span class="bot-avatar">🤖</span>
          {/if}
          <div class="message-content">
            {@html m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          </div>
        </div>
      </div>
    {/each}

    {#if stage === 'askComplaint' && messages.length <= 3}
      <div class="quick-actions">
        {#each quickExamples as example}
          <button class="quick-btn" on:click={() => quickComplaint(example)}>
            {example.label}
          </button>
        {/each}
      </div>
    {/if}

    {#if stage === 'confirmSpecialty' && suggested}
      <div class="action-buttons">
        <button on:click={() => confirmSearch(true)} class="btn-action primary">✓ Ja, Praxen suchen</button>
        <button on:click={() => confirmSearch(false)} class="btn-action secondary">✗ Nein, genauer beschreiben</button>
      </div>
    {/if}

    {#if stage === 'showResults' && results && results.length}
      <div class="results-container">
        {#each results as p}
          <button class="result-card" type="button" on:click={() => openPraxis(p._id)}>
            <div class="result-header">
              <div class="result-info">
                <div class="result-name">{p.name}</div>
                <div class="result-meta">{p.fach} • {p.city}</div>
              </div>
              <div class="result-wait">
                <div class="wait-badge">
                  <span class="wait-icon">⏱️</span>
                  {p.waitMinutes || 0} min
                </div>
              </div>
            </div>
            <div class="result-address">{p.address || ''}</div>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <div class="input-container">
    <input 
      class="chat-input"
      bind:value={input} 
      placeholder="Ihre Nachricht..." 
      on:keydown={(e)=> e.key === 'Enter' && onSubmit()} 
    />
    <button class="btn-send" on:click={onSubmit} disabled={!input.trim()}>
      <span class="send-icon">➤</span>
    </button>
  </div>
</div>

<style>
  .chatbot-container {
    display: flex;
    flex-direction: column;
    height: 600px;
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .chatbot-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, #4b7ec4 0%, #5a8fd1 100%);
    color: white;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .header-icon {
    font-size: 1.75rem;
  }

  .header-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .header-subtitle {
    margin: 0;
    font-size: 0.875rem;
    opacity: 0.9;
  }

  .btn-restart {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.125rem;
    transition: all 0.2s ease;
  }

  .btn-restart:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .messages-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem;
    background: #f9fafb;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .message-row {
    display: flex;
    justify-content: flex-start;
  }

  .message-row.user-row {
    justify-content: flex-end;
  }

  .message {
    display: flex;
    gap: 0.625rem;
    max-width: 75%;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .bot-avatar {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .message-content {
    padding: 0.75rem 1rem;
    border-radius: 12px;
    line-height: 1.5;
    font-size: 0.9375rem;
  }

  .bot-msg .message-content {
    background: white;
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .user-msg .message-content {
    background: var(--primary);
    color: white;
    border: none;
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .quick-btn {
    padding: 0.75rem 1rem;
    background: white;
    border: 1.5px solid var(--border-color);
    border-radius: 8px;
    text-align: left;
    cursor: pointer;
    font-size: 0.9375rem;
    transition: all 0.2s ease;
    font-weight: 500;
  }

  .quick-btn:hover {
    background: var(--secondary);
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  .action-buttons {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.75rem;
    flex-wrap: wrap;
  }

  .btn-action {
    flex: 1;
    min-width: 180px;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .btn-action.primary {
    background: var(--primary);
    color: white;
  }

  .btn-action.primary:hover {
    background: var(--primary-light);
    transform: translateY(-2px);
    box-shadow: var(--shadow);
  }

  .btn-action.secondary {
    background: white;
    color: var(--text-primary);
    border: 1.5px solid var(--border-color);
  }

  .btn-action.secondary:hover {
    background: var(--secondary);
    border-color: var(--primary);
  }

  .results-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  .result-card {
    padding: 1rem;
    background: white;
    border: 1.5px solid var(--border-color);
    border-radius: 10px;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .result-card:hover {
    border-color: var(--primary);
    box-shadow: 0 4px 12px rgba(31, 58, 95, 0.12);
    transform: translateX(4px);
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .result-info {
    flex: 1;
  }

  .result-name {
    font-weight: 600;
    font-size: 1rem;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .result-meta {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .result-wait {
    flex-shrink: 0;
  }

  .wait-badge {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background: var(--accent-light);
    color: #1e7e34;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .wait-icon {
    font-size: 1rem;
  }

  .result-address {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .input-container {
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: white;
    border-top: 1px solid var(--border-color);
  }

  .chat-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1.5px solid var(--border-color);
    border-radius: 8px;
    font-size: 0.9375rem;
    transition: all 0.2s ease;
    background: #f9fafb;
  }

  .chat-input:focus {
    outline: none;
    border-color: var(--primary);
    background: white;
    box-shadow: 0 0 0 3px rgba(31, 58, 95, 0.1);
  }

  .btn-send {
    padding: 0.75rem 1.25rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.125rem;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-send:hover:not(:disabled) {
    background: var(--primary-light);
    transform: translateY(-2px);
    box-shadow: var(--shadow);
  }

  .btn-send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .send-icon {
    display: block;
  }

  @media (max-width: 768px) {
    .chatbot-container {
      height: 500px;
    }

    .quick-actions {
      grid-template-columns: 1fr;
    }

    .action-buttons {
      flex-direction: column;
    }

    .btn-action {
      min-width: 100%;
    }

    .message {
      max-width: 85%;
    }
  }
</style>
