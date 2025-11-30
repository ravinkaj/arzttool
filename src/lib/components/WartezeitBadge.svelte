<script>
  export let minutes = 0;
  let color = 'green';
  if (minutes > 60) color = 'red';
  else if (minutes > 20) color = 'orange';
</script>

<span class="badge" style="background:{color};--bg: {color};">{minutes} min</span>

<style>
  .badge { color: #fff; padding: 0.25rem 0.5rem; border-radius: 6px; font-weight:600 }
  .badge[style*="green"] { background: #2ecc71 }
  .badge[style*="orange"] { background: #f39c12 }
  .badge[style*="red"] { background: #e74c3c }
</style>
