const map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
}).addTo(map);

let markers = [];

async function loadData() {
  const res = await fetch("/api/earthquakes");
  const data = await res.json();

  markers.forEach(m => map.removeLayer(m));
  markers = [];

  data.features.forEach(eq => {
    const [lng, lat] = eq.geometry.coordinates;

    const marker = L.circleMarker([lat, lng], {
      radius: Math.max(eq.properties.mag * 2, 4),
    }).addTo(map);

    marker.bindPopup(
      `<b>${eq.properties.place}</b><br>Magnitude: ${eq.properties.mag}`
    );

    markers.push(marker);
  });
}

loadData();
setInterval(loadData, 30000);