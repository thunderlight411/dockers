const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/earthquakes", async (req, res) => {
  try {
    const response = await axios.get(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson"
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch earthquake data" });
  }
});

app.get("/flights", async (req, res) => {
  try {
    const response = await axios.get(
      "https://opensky-network.org/api/states/all",
      { timeout: 5000 }
    );

    if (response.data.states && response.data.states.length > 0) {
      return res.json(response.data);
    }

    throw new Error("No data");

  } catch (err) {
    console.warn("Using fallback flight data");

    // ✈️ fake flights
    const fakeStates = Array.from({ length: 50 }).map((_, i) => [
      "fake" + i,
      "FL" + (100 + i),
      "DemoLand",
      null,
      null,
      -180 + Math.random() * 360, // lon
      -90 + Math.random() * 180,  // lat
      10000,
      false,
      250,
      Math.random() * 360 // heading
    ]);

    res.json({ states: fakeStates });
  }
});


app.get("/weather/:z/:x/:y.png", async (req, res) => {
  try {
    const { z, x, y } = req.params;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    const url = `https://tile.openweathermap.org/map/precipitation_new/${z}/${x}/${y}.png?appid=${apiKey}`;

    const response = await axios.get(url, {
      responseType: "arraybuffer"
    });

    res.set("Content-Type", "image/png");
    res.send(response.data);

  } catch (err) {
    console.error("Weather tile error:", err.message);
    res.status(500).send();
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("Backend running on port 3000");
});