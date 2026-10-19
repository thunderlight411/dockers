# SmokePing API

Read-only JSON API for existing SmokePing RRD files, using Python and `rrdtool`.
No credentials or monitoring data are included in the image.

## Run

From this directory:

```sh
cp .env.example .env
cp thresholds.example.json thresholds.json
# Edit .env: set SMOKEPING_DATA_DIR to an existing data directory.
docker compose up -d --build
curl --fail http://127.0.0.1:8085/health
curl --fail http://127.0.0.1:8085/api/targets
```

The container runs as UID/GID 1000 by default. Set `PUID=1000` and `PGID=1000`
in `.env` (or change them to match the data owner). Compose applies these values
through `user:`; environment variables alone do not change a process's identity.
The image also defaults to `USER 1000:1000` when run without Compose.
Allow that user read access to RRD files
and traversal of their directories. Data is mounted read-only; the host path
must already exist. Stop with `docker compose down`.

Endpoints: `/health`, `/api/targets`, `/api/status`, `/api/issues`,
`/api/target/<target>` and `/api/history/<target>?hours=24` (1–720 hours).
Target names are relative RRD paths without the `.rrd` suffix.

## Security

### Private thresholds

Edit the local `thresholds.json` with your private group settings. Only
`thresholds.example.json`, containing fictional groups and values, belongs in Git.
Compose mounts the private file read-only at `/config/thresholds.json` and sets
`THRESHOLDS_FILE` to that path. To keep the file outside this directory, set
`SMOKEPING_THRESHOLDS_FILE` in your local `.env` to an absolute host file path.
The file must exist and be readable by the configured UID/GID.

Group keys match the first segment of a target name: `ExampleGroup/router`
uses `groups.ExampleGroup.latency_ms` and `packet_loss_percent`. Unconfigured
groups use `LATENCY_WARN_MS` and `LOSS_WARN_PERCENT`. The file is read for each
status calculation, so edits do not require rebuilding the image. Missing files
fall back to environment defaults when running the API directly; Compose
requires its bind-mounted file to exist. Invalid JSON or invalid group settings
produce API errors. Threshold values are not included in successful responses.

Private threshold files are ignored by Git and excluded from the Docker build
context. Do not force-add them to Git or copy them into the image.

### Access

The API has no authentication and exposes target names and monitoring results.
The default host binding is localhost. For remote access, use an authenticated
TLS reverse proxy or a restricted trusted network with firewall rules. Changing
API_BIND_ADDRESS can expose the API; do not publish it directly to the Internet.

Keep `.env`, credentials and real RRD files outside Git. The Docker build context
only includes the Dockerfile and API source, so local settings and data cannot
be copied into the image. Never put tokens in Docker build arguments or source.
GitHub Actions uses the platform GITHUB_TOKEN to publish the image; no additional
registry credentials belong in this directory. Review repository and GHCR package
visibility separately before publishing; a private repository alone does not
establish the visibility of a container package.

The existing workflow discovers this directory automatically and publishes
`ghcr.io/thunderlight411/dockers/smokeping-api:latest` on pushes to main.
