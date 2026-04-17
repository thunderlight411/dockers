# Docker Containers

This repository contains a small collection of Docker images built from a single source tree and published through GitHub Actions.

## Available Containers

| Container | Purpose | Base Image |
| --------- | ------- | ---------- |
| `template` | Minimal starter image with an entrypoint wrapper and non-root user | `alpine:3.20` |
| `ftp-downloader` | Scheduled FTP mirroring container using `lftp` and `cron` | `alpine:latest` |
| `realtime-backend` | Express API that proxies live earthquake and flight data feeds | `node:18-alpine` |
| `realtime-frontend` | Nginx-served Leaflet dashboard that visualizes data from the backend API | `nginx:alpine` |
| `sftp_mysql-downloader` | Utility container for running custom backup scripts with SFTP and MySQL tooling | `debian:bookworm-slim` |

## Repository Layout

```text
containers/
	ftp-downloader/
	realtime-backend/
	realtime-frontend/
	sftp_mysql-downloader/
	template/
scripts/
	build-local.sh
```

Each container directory includes its own `Dockerfile` and container-specific documentation.

## Container Documentation

Use the per-container guides for environment variables, runtime behavior, and compose examples:

* [containers/template/README.md](containers/template/README.md)
* [containers/ftp-downloader/README.md](containers/ftp-downloader/README.md)
* [containers/realtime-backend/README.md](containers/realtime-backend/README.md)
* [containers/realtime-frontend/README.md](containers/realtime-frontend/README.md)
* [containers/sftp_mysql-downloader/README.md](containers/sftp_mysql-downloader/README.md)

## Build Locally

Build a specific container with the helper script:

```bash
./scripts/build-local.sh template
./scripts/build-local.sh ftp-downloader
./scripts/build-local.sh realtime-backend
./scripts/build-local.sh realtime-frontend
./scripts/build-local.sh sftp_mysql-downloader
```

The script builds images using the tag format:

```text
local/<container>
```

Example:

```bash
docker run --rm local/template echo hello
```

### Realtime Pair Quick Start

Build and run the realtime API plus dashboard locally:

```bash
./scripts/build-local.sh realtime-backend
./scripts/build-local.sh realtime-frontend

docker network create realtime-net

docker run -d --name backend --network realtime-net -p 3000:3000 local/realtime-backend
docker run -d --name frontend --network realtime-net -p 8080:80 local/realtime-frontend
```

Then open:

* dashboard: `http://localhost:8080`
* API health: `http://localhost:3000/health`

Clean up:

```bash
docker rm -f frontend backend
docker network rm realtime-net
```

## Published Images

The GitHub Actions workflow builds each directory under `containers/` and publishes images to GitHub Container Registry using this naming pattern:

```text
ghcr.io/thunderlight411/dockers/<container>:latest
```

Examples:

```bash
docker pull ghcr.io/thunderlight411/dockers/template:latest
docker pull ghcr.io/thunderlight411/dockers/ftp-downloader:latest
docker pull ghcr.io/thunderlight411/dockers/realtime-backend:latest
docker pull ghcr.io/thunderlight411/dockers/realtime-frontend:latest
docker pull ghcr.io/thunderlight411/dockers/sftp_mysql-downloader:latest
```

## CI Workflow

The workflow in `.github/workflows/docker-build.yml` currently:

* discovers container directories automatically
* builds multi-architecture images for `linux/amd64` and `linux/arm64`
* pushes images to GHCR on workflow runs
* scans published images with Trivy

## Container Notes

### template

Starter image for simple shell-based containers. It creates a non-root `app` user, copies `entrypoint.sh` to `/entrypoint.sh`, and runs the provided command through that entrypoint.

### ftp-downloader

Runs `crond` in the foreground and executes `/scripts/download.sh` on the configured schedule. The bundled crontab runs the download job daily at `06:00`.

### realtime-backend

Provides an Express service on port `3000` with `/earthquakes`, `/flights`, and `/health` endpoints. It proxies data from the USGS earthquake feed and the OpenSky flight states API.

### realtime-frontend

Serves a Leaflet-based world map through Nginx on port `80`. Requests under `/api/` are proxied to a backend service named `backend` on port `3000`, which makes it a natural fit for Docker Compose.

### sftp_mysql-downloader

Provides common tools for scripted backup workflows, including `bash`, `openssh-client`, `sshpass`, `default-mysql-client`, `zip`, and `unzip`. The image does not include application logic beyond the toolchain.

## Supported Architectures

* `linux/amd64`
* `linux/arm64`

## License

MIT
