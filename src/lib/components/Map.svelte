<script>
  import { onMount, onDestroy } from 'svelte';
  // Props: Array von Praxen mit name, latitude, longitude, wartezeit
  export let praxen = [];
  // Ältere Props für Rückwärtskompatibilität
  export let coords = [];
  export let userLocation = null;
  export let radiusKm = 0;
  
  let mapEl;
  let map = null;
  let markers = [];
  let radiusCircle = null;

  // helper to dynamically inject leaflet if missing
  function loadLeafletAssets() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject('no-window');
      if (window.L) return resolve(window.L);

      const cssHref = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      const jsSrc = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

      // add CSS if not present
      if (![...document.styleSheets].some(s => s.href && s.href.includes('unpkg.com/leaflet'))) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssHref;
        document.head.appendChild(link);
      }

      // add script
      const existing = [...document.scripts].find(s => s.src && s.src.includes('unpkg.com/leaflet'));
      if (existing) {
        if (window.L) return resolve(window.L);
        existing.addEventListener('load', () => resolve(window.L));
        existing.addEventListener('error', () => reject('load-error'));
        return;
      }

      const script = document.createElement('script');
      script.src = jsSrc;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.L);
      script.onerror = () => reject('load-error');
      document.body.appendChild(script);
    });
  }

  function clearMarkers() {
    if (!map || !markers) return;
    markers.forEach(m => map.removeLayer(m));
    markers = [];
  }

  function addMarkers(L) {
    clearMarkers();
    
    // Konvertiere praxen in coords-Format, falls praxen übergeben wird
    let markerData = praxen && praxen.length > 0 ? praxen : coords;
    
    (markerData || []).forEach(item => {
      // Unterstütze beide Formate: (lat/lng) und (latitude/longitude)
      const lat = item.lat || item.latitude;
      const lng = item.lng || item.longitude;
      
      if (!item || lat == null || lng == null) return;
      
      // Farbe basierend auf Wartezeit
      let markerColor = '#22c55e'; // grün
      const waitTime = item.wartezeit || item.waitMinutes || 0;
      if (waitTime > 20) markerColor = '#ef4444'; // rot
      else if (waitTime > 10) markerColor = '#f59e0b'; // orange
      
      // HTML für Marker mit Farbindikator
      const html = `<div style="font-family:system-ui,Arial,sans-serif;max-width:240px">
        <strong>${item.name || item.label || ''}</strong><br/>
        ${item.fach ? `<span style="color:#6b7280">${item.fach} — ${item.city || ''}</span><br/>` : ''}
        <small style="display:block;margin-top:6px">Aktuelle Wartezeit: <strong>${waitTime} min</strong></small>
        <div style="margin-top:8px"><a href="/praxis/${item.id || item._id}" style="background:#3b82f6;color:#fff;padding:6px 8px;border-radius:6px;text-decoration:none">Details</a></div>
      </div>`;
      
      // Custom Icon mit Farbe basierend auf Wartezeit
      const markerIcon = L.divIcon({
        html: `<div style="background-color:${markerColor};width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
        className: 'custom-marker',
        iconSize: [24, 24],
        popupAnchor: [0, -12]
      });
      
      const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map).bindPopup(html);
      marker.on('click', () => marker.openPopup());
      markers.push(marker);
    });
  }

  async function initMap() {
    if (typeof window === 'undefined') return;
    try {
      const L = await loadLeafletAssets();
      if (!L) throw new Error('Leaflet failed to load');

      if (!map) {
        const start = coords && coords.length ? [coords[0].lat, coords[0].lng] : [47.3769, 8.5417];
        map = L.map(mapEl, { scrollWheelZoom: false }).setView(start, 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);
        // make sure map sizing is correct
        setTimeout(() => map.invalidateSize(), 300);
      }

      if (userLocation && userLocation.lat && userLocation.lng) {
        L.circleMarker([userLocation.lat, userLocation.lng], { radius: 8, color: '#0ea5a4', fillColor: '#0ea5a4', fillOpacity: 0.9 }).addTo(map).bindPopup('<strong>Du bist hier</strong>');
        // draw radius circle if provided
        if (radiusCircle) { try { map.removeLayer(radiusCircle); } catch(e){} radiusCircle = null; }
        if (radiusKm && !isNaN(radiusKm) && radiusKm > 0) {
          radiusCircle = L.circle([userLocation.lat, userLocation.lng], { radius: radiusKm * 1000, color: '#0ea5a4', fillColor: '#0ea5a4', fillOpacity: 0.06 }).addTo(map);
        }
        map.setView([userLocation.lat, userLocation.lng], radiusKm && radiusKm > 0 ? 12 : 11);
      }

      addMarkers(L);
    } catch (err) {
      console.warn('Map init failed', err);
    }
  }

  onMount(() => {
    initMap();
  });

  // Reaktiv: Marker aktualisieren, wenn praxen oder coords sich ändern
  $: if (map) {
    const L = typeof window !== 'undefined' ? window.L : null;
    if (L) {
      addMarkers(L);
      // Update radius circle wenn userLocation / radiusKm ändern
      try {
        if (radiusCircle) { map.removeLayer(radiusCircle); radiusCircle = null; }
        if (userLocation && userLocation.lat && userLocation.lng && radiusKm && !isNaN(radiusKm) && radiusKm > 0) {
          radiusCircle = L.circle([userLocation.lat, userLocation.lng], { radius: radiusKm * 1000, color: '#0ea5a4', fillColor: '#0ea5a4', fillOpacity: 0.06 }).addTo(map);
        }
      } catch(e){}
      setTimeout(() => map.invalidateSize(), 150);
    }
  }

  onDestroy(() => {
    if (map) {
      try { map.remove(); } catch (e) {}
      map = null;
    }
  });
</script>

<div bind:this={mapEl} style="width:100%;height:100%;border-radius:8px;overflow:hidden"></div>
