const map = L.map('map').setView([20, 0], 2);

// 🌙 Dark map
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

// ===== STATE =====
let flightMarkers = {};
let previousFlights = {};
let flightTrails = {};
let quakeMarkers = [];
let lightningMarkers = [];

let showFlights = true;
let showQuakes = true;
let showLightning = true;

// ===== ICON =====
function createPlaneIcon(rotation = 0) {
  return L.divIcon({
    className: "plane-icon",
    html: `
      <div style="
        transform: rotate(${rotation}deg);
        color: #00d4ff;
        font-size: 14px;
      ">✈</div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

// ===== ANIMATION =====
function animateMarker(marker, from, to) {
  const steps = 60;
  const interval = 20000 / steps;

  let i = 0;

  const latStep = (to.lat - from.lat) / steps;
  const lonStep = (to.lon - from.lon) / steps;

  const anim = setInterval(() => {
    i++;

    const lat = from.lat + latStep * i;
    const lon = from.lon + lonStep * i;

    marker.setLatLng([lat, lon]);
    marker.setIcon(createPlaneIcon(to.heading));

    if (i >= steps) clearInterval(anim);
  }, interval);
}

// ===== EARTHQUAKES =====
async function loadEarthquakes() {
  if (!showQuakes) {
    quakeMarkers.forEach(m => map.removeLayer(m));
    quakeMarkers = [];
    return;
  }

  try {
    const res = await fetch("/api/earthquakes");
    const data = await res.json();

    quakeMarkers.forEach(m => map.removeLayer(m));
    quakeMarkers = [];

    data.features.forEach(eq => {
      const [lng, lat] = eq.geometry.coordinates;

      const marker = L.circleMarker([lat, lng], {
        radius: eq.properties.mag * 2,
        color: "orange",
        fillOpacity: 0.7
      }).addTo(map);

      marker.bindPopup(`
        🌍 ${eq.properties.place}<br>
        Magnitude: ${eq.properties.mag}
      `);

      quakeMarkers.push(marker);
    });

  } catch (err) {
    console.error("Earthquake error:", err);
  }
}

// ===== FLIGHTS =====
async function loadFlights() {
  if (!showFlights) {
    Object.values(flightMarkers).forEach(m => map.removeLayer(m));
    Object.values(flightTrails).forEach(t => {
      if (t.line) map.removeLayer(t.line);
    });

    flightMarkers = {};
    flightTrails = {};
    previousFlights = {};
    return;
  }

  try {
    const res = await fetch("/api/flights");
    const data = await res.json();

    if (!data.states) return;

    const states = data.states.slice(0, 1500);
    const newFlights = {};

    states.forEach(f => {
      const id = f[0];
      const lon = f[5];
      const lat = f[6];

      if (lat === null || lon === null) return;

      newFlights[id] = {
        lat,
        lon,
        heading: f[10] || 0,
        callsign: (f[1] || "").trim(),
        country: f[2] || "Unknown"
      };
    });

    Object.keys(newFlights).forEach(id => {
      const flight = newFlights[id];
      const prev = previousFlights[id];

      // marker
      if (!flightMarkers[id]) {
        const marker = L.marker(
          [flight.lat, flight.lon],
          { icon: createPlaneIcon(flight.heading) }
        ).addTo(map);

        marker.bindPopup(`
          ✈️ ${flight.callsign || "Unknown"}<br>
          🌍 ${flight.country}
        `);

        flightMarkers[id] = marker;
      } else if (prev) {
        animateMarker(flightMarkers[id], prev, flight);
      }

      // trail
      if (!flightTrails[id]) {
        flightTrails[id] = [];
      }

      flightTrails[id].push([flight.lat, flight.lon]);

      if (flightTrails[id].length > 20) {
        flightTrails[id].shift();
      }

      if (flightTrails[id].line) {
        map.removeLayer(flightTrails[id].line);
      }

      const line = L.polyline(flightTrails[id], {
        color: "#00d4ff",
        weight: 1,
        opacity: 0.4
      }).addTo(map);

      flightTrails[id].line = line;
    });

    // cleanup
    Object.keys(flightMarkers).forEach(id => {
      if (!newFlights[id]) {
        map.removeLayer(flightMarkers[id]);
        delete flightMarkers[id];

        if (flightTrails[id]) {
          if (flightTrails[id].line) {
            map.removeLayer(flightTrails[id].line);
          }
          delete flightTrails[id];
        }
      }
    });

    previousFlights = newFlights;

  } catch (err) {
    console.error("Flights error:", err);
  }
}

// ===== LIGHTNING =====
async function loadLightning() {
  if (!showLightning) {
    lightningMarkers.forEach(m => map.removeLayer(m));
    lightningMarkers = [];
    return;
  }

  try {
    const res = await fetch("https://data.lightningmaps.org/json/strikes.json");
    const data = await res.json();

    lightningMarkers.forEach(m => map.removeLayer(m));
    lightningMarkers = [];

    data.slice(0, 500).forEach(s => {
      if (!s.lat || !s.lon) return;

      const marker = L.circleMarker([s.lat, s.lon], {
        radius: 2,
        color: "#ffff00",
        fillOpacity: 0.8
      }).addTo(map);

      lightningMarkers.push(marker);
    });

  } catch (err) {
    console.error("Lightning error:", err);
  }
}

// ===== REFRESH =====
async function refresh() {
  await loadEarthquakes();
  await loadFlights();
  await loadLightning();
}

refresh();
setInterval(refresh, 20000);
setInterval(loadLightning, 10000);

// ===== UI EVENTS =====
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("toggleFlights").addEventListener("change", e => {
    showFlights = e.target.checked;
  });

  document.getElementById("toggleQuakes").addEventListener("change", e => {
    showQuakes = e.target.checked;
  });

  document.getElementById("toggleLightning").addEventListener("change", e => {
    showLightning = e.target.checked;
  });
});