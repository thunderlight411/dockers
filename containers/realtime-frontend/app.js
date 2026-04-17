const map = L.map('map').setView([20, 0], 2);

// 🌙 Dark map
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

// ===== STATE =====
let flightMarkers = {};
let previousFlights = {};
let flightTrails = {};
let quakeMarkers = [];

let showFlights = true;
let showQuakes = true;

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

  if (marker._anim) clearInterval(marker._anim);

  let i = 0;

  const latStep = (to.lat - from.lat) / steps;
  const lonStep = (to.lon - from.lon) / steps;

  marker._anim = setInterval(() => {
    i++;

    const lat = from.lat + latStep * i;
    const lon = from.lon + lonStep * i;

    marker.setLatLng([lat, lon]);
    marker.setIcon(createPlaneIcon(to.heading));

    if (i >= steps) clearInterval(marker._anim);
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
    if (!res.ok) return;

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

    if (!res.ok) {
      console.warn("Flights API error:", res.status);
      return;
    }

    const data = await res.json();

    if (!data.states || !Array.isArray(data.states)) return;

    const states = data.states.slice(0, 1000);
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

      // trails
      if (!flightTrails[id]) {
        flightTrails[id] = [];
      }

      flightTrails[id].push([flight.lat, flight.lon]);

      if (flightTrails[id].length > 15) {
        flightTrails[id].shift();
      }

      if (flightTrails[id].line) {
        map.removeLayer(flightTrails[id].line);
      }

      const line = L.polyline(flightTrails[id], {
        color: "#00d4ff",
        weight: 1,
        opacity: 0.3
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

// ===== REFRESH =====
async function refresh() {
  await loadEarthquakes();
  await loadFlights();
}

refresh();
setInterval(refresh, 20000);

// ===== SAFE UI EVENTS =====
document.addEventListener("DOMContentLoaded", () => {
  const flights = document.getElementById("toggleFlights");
  const quakes = document.getElementById("toggleQuakes");

  if (flights) {
    flights.addEventListener("change", e => {
      showFlights = e.target.checked;
    });
  }

  if (quakes) {
    quakes.addEventListener("change", e => {
      showQuakes = e.target.checked;
    });
  }
});