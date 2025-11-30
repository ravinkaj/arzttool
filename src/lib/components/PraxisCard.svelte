<script>
  export let praxis;
</script>

<article class="card">
  <a href={'/praxis/' + (praxis._id || praxis._id)}>
    <h3>{praxis.name}</h3>
  </a>
  <p class="meta muted">{praxis.fach} — {praxis.city}</p>
  <p class="addr">{praxis.address}</p>
  <div class="foot">
    <span class="wait">Wartezeit: <strong>{praxis.waitMinutes ?? 0} min</strong></span>
    <a class="details" href={'/praxis/' + (praxis._id || praxis._id)}>Details →</a>
  </div>
</article>

<style>
  .card { padding: 0.75rem; border: 1px solid #ddd; border-radius:8px }
  .meta { color:#666; font-size:0.95rem }
  .addr { font-size:0.9rem }
  .foot { margin-top:0.75rem; display:flex; justify-content:space-between }
</style>
