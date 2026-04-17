const map = L.map('map').setView([20, 0], 2);

// 🌙 Dark mode kaart
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

// State
let flightMarkers = {};
let previousFlights = {};
let quakeMarkers = [];

// ✈️ Plane icon
function createPlaneIcon(rotation = 0) {
  return L.divIcon({
    className: "plane-icon",
    html: `
      <div style="
        transform: rotate(${rotation}deg);
        color: #00d4ff;
        font-size: 14px;
      ">
        ✈
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

// ✈️ Smooth animation
function animateMarker(marker, from, to) {
  const duration = 20000;
  const steps = 60;
  const interval = duration / steps;

  let i = 0;

  const latStep = (to.lat - from.lat) / steps;
  const lonStep = (to.lon - from.lon) / steps;

  const anim = setInterval(() => {
    i++;

    const currentLat = from.lat + latStep * i;
    const currentLon = from.lon + lonStep * i;

    marker.setLatLng([currentLat, currentLon]);

    if (i >= steps) clearInterval(anim);
  }, interval);
}

// 🌍 Earthquakes
async function loadEarthquakes() {
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

// ✈️ Flights (clean + smooth)
async function loadFlights() {
  try {
    const res = await fetch("/api/flights");
    const data = await res.json();

    if (!data.states) return;

    // 🔥 performance limit
    let states = data.states.slice(0, 1500);

    const newFlights = {};

    states.forEach(f => {
      const id = f[0];
      const lon = f[5];
      const lat = f[6];

      if (lat === null || lon === null) return;

      newFlights[id] = {
        lat,
        lon,
        callsign: (f[1] || "").trim(),
        country: f[2] || "Unknown"
      };
    });

    // create / update
    Object.keys(newFlights).forEach(id => {
      const flight = newFlights[id];
      const prev = previousFlights[id];

      // nieuw
      if (!flightMarkers[id]) {
        const marker = L.marker(
          [flight.lat, flight.lon],
          { icon: createPlaneIcon() }
        ).addTo(map);

        marker.bindPopup(`
          ✈️ ${flight.callsign || "Unknown"}<br>
          🌍 ${flight.country}
        `);

        flightMarkers[id] = marker;
        return;
      }

      // bestaand → smooth move
      if (prev) {
        animateMarker(flightMarkers[id], prev, flight);
      }
    });

    // verwijder oude flights
    Object.keys(flightMarkers).forEach(id => {
      if (!newFlights[id]) {
        map.removeLayer(flightMarkers[id]);
        delete flightMarkers[id];
      }
    });

    previousFlights = newFlights;

  } catch (err) {
    console.error("Flights error:", err);
  }
}

// 🔄 refresh loop
async function refresh() {
  await loadEarthquakes();
  await loadFlights();
}

refresh();
setInterval(refresh, 20000);