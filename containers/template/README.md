# Template Container

Minimal starter image for shell-based containers.

## What It Includes

This image is intentionally small and provides:

* `alpine:3.20` as the base image
* a non-root `app` user
* `/entrypoint.sh` as the entrypoint
* OCI metadata build arguments for CI builds

The entrypoint script prints a startup message and then executes the command passed to the container.

## Build

From the repository root:

```bash
docker build -t local/template ./containers/template
```

## Run

```bash
docker run --rm local/template echo hello
```

Expected behavior:

* the container starts through `/entrypoint.sh`
* the script prints `Container started`
* your command is executed afterward

## Image Metadata

The Dockerfile accepts these build arguments:

* `BUILD_DATE`
* `VERSION`
* `VCS_REF`

Example:

```bash
docker build \
	--build-arg BUILD_DATE="2026-04-17T00:00:00Z" \
	--build-arg VERSION="dev" \
	--build-arg VCS_REF="local" \
	-t local/template \
	./containers/template
```

## Published Image

When built by CI, the image is published as:

```text
ghcr.io/thunderlight411/dockers/template:latest
```

## License

MIT
