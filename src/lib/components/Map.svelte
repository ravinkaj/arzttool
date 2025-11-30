<script>
  import { onMount } from 'svelte';
  export let coords = []; // array of {lat,lng,label,id,fach,city,waitMinutes}
  let mapEl;

  onMount(() => {
    // Leaflet loaded via CDN in layout; use it only on client
    if (typeof window === 'undefined') return;
    const L = window.L;
    if (!L) return;
    const map = L.map(mapEl, { scrollWheelZoom: false }).setView(coords.length ? [coords[0].lat, coords[0].lng] : [47.3769, 8.5417], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    coords.forEach(c => {
      // build a small HTML preview for the popup
      const html = `<div style="font-family:system-ui,Arial,sans-serif;max-width:240px">
        <strong>${c.label || ''}</strong><br/>
        ${c.fach ? `<span style="color:#6b7280">${c.fach} — ${c.city || ''}</span><br/>` : ''}
        <small style="display:block;margin-top:6px">Wartezeit: <strong>${c.waitMinutes ?? ''} min</strong></small>
        <div style="margin-top:8px"><a href="/praxis/${c.id}" style="background:var(--primary);color:#fff;padding:6px 8px;border-radius:6px;text-decoration:none">Details</a></div>
      </div>`;
      const marker = L.marker([c.lat, c.lng]).addTo(map).bindPopup(html);
      // also navigate when marker itself is clicked (fallback)
      marker.on('click', () => {
        // open popup first
        marker.openPopup();
      });
    });
    return () => map.remove();
  });
</script>

<div bind:this={mapEl} style="width:100%;height:300px;border-radius:8px;overflow:hidden"></div>
