# Realtime Backend Container

Express-based API container that exposes live earthquake and flight data through a small JSON API.

## Overview

This image runs a Node.js service on port `3000` and provides these routes:

* `GET /earthquakes` proxies the USGS all-hour GeoJSON earthquake feed
* `GET /flights` proxies the OpenSky Network states API
* `GET /health` returns a simple health payload

The service enables CORS and is intended to be consumed directly by a browser app or through a reverse proxy.

## Build

From the repository root:

```bash
docker build -t local/realtime-backend ./containers/realtime-backend
```

## Run

```bash
docker run --rm -p 3000:3000 local/realtime-backend
```

After startup, the API is available at `http://localhost:3000`.

## Example Requests

```bash
curl http://localhost:3000/health
curl http://localhost:3000/earthquakes
curl http://localhost:3000/flights
```

## Compose Example

```yaml
services:
  backend:
    image: ghcr.io/thunderlight411/dockers/realtime-backend:latest
    ports:
      - "3000:3000"
    restart: unless-stopped
```

## Published Image

When built by CI, the image is published as:

```text
ghcr.io/thunderlight411/dockers/realtime-backend:latest
```

## License

MIT