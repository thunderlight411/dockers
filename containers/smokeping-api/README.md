# SmokePing API

Read-only JSON API for existing SmokePing RRD files, using Python and `rrdtool`.
No credentials or monitoring data are included in the image.

## Run

From this directory:

```sh
cp .env.example .env
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
