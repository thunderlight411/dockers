# SFTP MySQL Downloader

Utility image for running custom backup or import scripts that need SFTP and MySQL client tooling.

## Overview

This image is intentionally generic. It does not include a built-in backup script or scheduler. Instead, it provides a working toolset that you can use from your own script mounted into the container.

Base image:

* `debian:bookworm-slim`

Included packages:

* `bash`
* `ca-certificates`
* `openssh-client`
* `sshpass`
* `default-mysql-client`
* `unzip`
* `zip`
* `findutils`
* `coreutils`

Default behavior:

* working directory is `/app`
* default command is `bash`

## Build

From the repository root:

```bash
docker build -t local/sftp_mysql-downloader ./containers/sftp_mysql-downloader
```

## Run a Script

```bash
docker run --rm \
  -v /opt/backups:/var/backups \
  -v "$(pwd)/backup.sh:/app/backup.sh" \
  local/sftp_mysql-downloader \
  bash /app/backup.sh
```

## Compose Example

```yaml
services:
  backup:
    image: ghcr.io/thunderlight411/dockers/sftp_mysql-downloader:latest
    volumes:
      - /opt/backups:/var/backups
      - ./backup.sh:/app/backup.sh
    command: ["bash", "/app/backup.sh"]
```

## Typical Use Cases

This image is a reasonable fit when your script needs some combination of:

* `sftp` or `scp` access via `openssh-client`
* password-based automation via `sshpass`
* `mysqldump` and other MySQL client commands
* archive extraction or creation with `unzip` and `zip`
* standard shell utilities for file processing

## Published Image

When built by CI, the image is published as:

```text
ghcr.io/thunderlight411/dockers/sftp_mysql-downloader:latest
```

## License

MIT
