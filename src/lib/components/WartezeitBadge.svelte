<script>
  export let minutes = 0;
  // derive friendly text + color (traffic light)
  let level = 'low'; // low, med, high
  if (minutes > 30) level = 'high';
  else if (minutes > 10) level = 'med';

  $: text = level === 'low'
    ? `🟢 Kurze Wartezeit (ca. ${minutes} Minuten) – geschätzter Durchschnitt`
    : level === 'med'
      ? `🟡 Mittlere Wartezeit (ca. ${minutes} Minuten)`
      : `🔴 Lange Wartezeit (ca. ${minutes} Minuten)`;
</script>

<div class="badge" data-level={level} aria-live="polite">{text}</div>

<style>
  .badge { color:#fff; padding:0.5rem; border-radius:10px; font-weight:600; display:inline-block }
  .badge[data-level="low"] { background:#2ecc71 }
  .badge[data-level="med"] { background:#f59e0b }
  .badge[data-level="high"] { background:#ef4444 }
</style>
