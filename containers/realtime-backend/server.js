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

    res.json(response.data);
  } catch (err) {
    console.error("OpenSky error:", err.message);

    // 👇 BELANGRIJK: stuur lege dataset i.p.v. 500
    res.json({ states: [] });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("Backend running on port 3000");
});