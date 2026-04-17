# Realtime Frontend Container

Static Leaflet dashboard served by Nginx that renders live earthquake and flight markers on a world map.

## Overview

This image serves the frontend from `/usr/share/nginx/html` and expects API calls under `/api/` to be proxied to a backend service named `backend` on port `3000`.

The application:

* renders a full-screen map using Leaflet
* loads earthquake data from `/api/earthquakes`
* loads flight data from `/api/flights`
* refreshes both datasets every 20 seconds

## Build

From the repository root:

```bash
docker build -t local/realtime-frontend ./containers/realtime-frontend
```

## Run With Backend

Because the bundled Nginx config proxies `/api/` to `http://backend:3000/`, this container is easiest to run on the same Docker network as a backend container using the hostname `backend`.

## Compose Example

```yaml
services:
  backend:
    image: ghcr.io/thunderlight411/dockers/realtime-backend:latest
    container_name: backend
    restart: unless-stopped

  frontend:
    image: ghcr.io/thunderlight411/dockers/realtime-frontend:latest
    ports:
      - "8080:80"
    depends_on:
      - backend
    restart: unless-stopped
```

With that setup, open `http://localhost:8080`.

## Published Image

When built by CI, the image is published as:

```text
ghcr.io/thunderlight411/dockers/realtime-frontend:latest
```

## License

MIT