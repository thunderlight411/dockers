# FTP Downloader Container

Scheduled FTP mirroring container built on Alpine and powered by `lftp` plus `cron`.

## Overview

This image is designed to pull files from an FTP server into a mounted local directory on a fixed schedule.

The container:

* installs `lftp`, `bash`, `tzdata`, and `ca-certificates`
* stores the download script at `/scripts/download.sh`
* starts `crond` in the foreground
* runs the download job daily at `06:00`

## Runtime Behavior

The bundled crontab contains:

```cron
0 6 * * * /scripts/download.sh >> /var/log/ftp-download.log 2>&1
```

The download script connects with:

```text
lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST"
```

and mirrors:

```text
${REMOTE_DIR:-/} -> /downloads
```

## Required Environment Variables

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `FTP_HOST` | Yes | FTP server hostname or IP address |
| `FTP_USER` | Yes | FTP username |
| `FTP_PASS` | Yes | FTP password |
| `REMOTE_DIR` | No | Remote directory to mirror. Defaults to `/` |

Notes:

* the download destination inside the container is always `/downloads`
* `LOCAL_DIR` is not used by the current Dockerfile or script

## Build

From the repository root:

```bash
docker build -t local/ftp-downloader ./containers/ftp-downloader
```

## Run

```bash
docker run -d \
  --name ftp-downloader \
  -e FTP_HOST=ftp.example.com \
  -e FTP_USER=backup-user \
  -e FTP_PASS=secretpassword \
  -e REMOTE_DIR=/backups \
  -v /data/ftp:/downloads \
  --restart unless-stopped \
  local/ftp-downloader
```

## Compose Example

```yaml
services:
  ftp-downloader:
    image: ghcr.io/thunderlight411/dockers/ftp-downloader:latest
    container_name: ftp-downloader
    environment:
      FTP_HOST: ftp.example.com
      FTP_USER: backup-user
      FTP_PASS: secretpassword
      REMOTE_DIR: /backups
    volumes:
      - /data/ftp:/downloads
    restart: unless-stopped
```

## Logs

Cron job output is written to `/var/log/ftp-download.log` inside the container. Runtime logs are also visible with:

```bash
docker logs ftp-downloader
```

## Published Image

When built by CI, the image is published as:

```text
ghcr.io/thunderlight411/dockers/ftp-downloader:latest
```

## License

MIT
