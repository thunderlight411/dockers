const map = L.map('map').setView([20, 0], 2);

let flightMarkers = {};
let previousFlights = {};

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function animateMarker(marker, from, to) {
  const duration = 20000; // 20 sec (zelfde als refresh)
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

// 🌙 Dark mode kaart (rustiger)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

let quakeMarkers = [];
let flightMarkers = [];

async function loadEarthquakes() {
  const res = await fetch("/api/earthquakes");
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
  try {
    const res = await fetch("/api/flights");
    const data = await res.json();

    if (!data.states) return;

    const newFlights = {};

    data.states.forEach(f => {
      const id = f[0]; // uniek (icao24)
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

    // update / create markers
    Object.keys(newFlights).forEach(id => {
      const flight = newFlights[id];
      const prev = previousFlights[id];

      // nieuw vliegtuig
      if (!flightMarkers[id]) {
        const marker = L.circleMarker([flight.lat, flight.lon], {
          radius: 3,
          color: "#00d4ff"
        }).addTo(map);

        marker.bindPopup(`✈️ ${flight.callsign || "Unknown"}<br>${flight.country}`);

        flightMarkers[id] = marker;
        return;
      }

      // bestaande → smooth bewegen
      if (prev) {
        animateMarker(flightMarkers[id], prev, flight);
      }
    });

    // verwijder verdwenen flights
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

async function refresh() {
  await loadEarthquakes();
  await loadFlights();
}

refresh();
setInterval(refresh, 20000);