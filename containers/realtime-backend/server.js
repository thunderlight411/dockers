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

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("Backend running on port 3000");
});