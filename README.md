# Docker Containers

Collection of container images built and maintained in a single repository.

## Containers

| Container | Description            |
| --------- | ---------------------- |
| template  | minimal base container |
| nginx     | nginx web server       |

## Build locally

```
./scripts/build-local.sh nginx
```

## Registry

Images are published to:

```
ghcr.io/<github-user>/<container>
```

Example:

```
docker pull ghcr.io/YOURUSER/nginx:latest
```

## Supported architectures

* linux/amd64
* linux/arm64

## Security

Images are automatically scanned using **Trivy**.

## License

MIT
