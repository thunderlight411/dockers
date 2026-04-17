const map = L.map('map').setView([20, 0], 2);

// 🌙 Dark mode kaart (rustiger)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

let quakeMarkers = [];
let flightMarkers = [];

async function loadEarthquakes() {
  const res = await fetch("http://backend:3000/earthquakes");
  const data = await res.json();

  quakeMarkers.forEach(m => map.removeLayer(m));
  quakeMarkers = [];

  data.features.forEach(eq => {
    const [lng, lat] = eq.geometry.coordinates;

    const marker = L.circleMarker([lat, lng], {
      radius: eq.properties.mag * 2,
      color: "orange"
    }).addTo(map);

    marker.bindPopup(`🌍 ${eq.properties.place}<br>Mag: ${eq.properties.mag}`);

    quakeMarkers.push(marker);
  });
}

async function loadFlights() {
  const res = await fetch("http://backend:3000/flights");
  const data = await res.json();

  flightMarkers.forEach(m => map.removeLayer(m));
  flightMarkers = [];

  data.states.forEach(f => {
    if (!f[5] || !f[6]) return; // lat/lon check

    const lat = f[6];
    const lng = f[5];

    const marker = L.circleMarker([lat, lng], {
      radius: 3,
      color: "cyan"
    }).addTo(map);

    marker.bindPopup(`✈️ ${f[1] || "Unknown"}`);

    flightMarkers.push(marker);
  });
}

async function refresh() {
  await loadEarthquakes();
  await loadFlights();
}

refresh();
setInterval(refresh, 20000);