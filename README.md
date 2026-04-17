# Docker Containers

This repository contains a small collection of Docker images built from a single source tree and published through GitHub Actions.

## Available Containers

| Container | Purpose | Base Image |
| --------- | ------- | ---------- |
| `template` | Minimal starter image with an entrypoint wrapper and non-root user | `alpine:3.20` |
| `ftp-downloader` | Scheduled FTP mirroring container using `lftp` and `cron` | `alpine:latest` |
| `sftp_mysql-downloader` | Utility container for running custom backup scripts with SFTP and MySQL tooling | `debian:bookworm-slim` |

## Repository Layout

```text
containers/
	ftp-downloader/
	sftp_mysql-downloader/
	template/
scripts/
	build-local.sh
```

Each container directory includes its own `Dockerfile` and container-specific documentation.

## Build Locally

Build a specific container with the helper script:

```bash
./scripts/build-local.sh template
./scripts/build-local.sh ftp-downloader
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

## Published Images

The GitHub Actions workflow builds each directory under `containers/` and publishes images to GitHub Container Registry using this naming pattern:

```text
ghcr.io/thunderlight411/dockers/<container>:latest
```

Examples:

```bash
docker pull ghcr.io/thunderlight411/dockers/template:latest
docker pull ghcr.io/thunderlight411/dockers/ftp-downloader:latest
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

### sftp_mysql-downloader

Provides common tools for scripted backup workflows, including `bash`, `openssh-client`, `sshpass`, `default-mysql-client`, `zip`, and `unzip`. The image does not include application logic beyond the toolchain.

## Supported Architectures

* `linux/amd64`
* `linux/arm64`

## License

MIT
