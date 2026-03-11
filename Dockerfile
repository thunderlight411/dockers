# Base Image
FROM alpine:3.20

# Build Arguments (filled by CI or docker build)
ARG BUILD_DATE
ARG VERSION
ARG VCS_REF

# OCI Image Metadata
LABEL org.opencontainers.image.title="Template Container" \
      org.opencontainers.image.description="Reusable Docker container template" \
      org.opencontainers.image.source="https://github.com/thunderlight411/dockers" \
      org.opencontainers.image.authors="thunderlight411" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.version=$VERSION \
      org.opencontainers.image.revision=$VCS_REF

# Install Packages
RUN apk add --no-cache \
    bash \
    curl \
    ca-certificates

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Working directory
WORKDIR /app

# Copy scripts
COPY scripts/ /app/

# Permissions
RUN chmod +x /app/*.sh && \
    chown -R app:app /app

# Switch to non-root
USER app

# Entrypoint
ENTRYPOINT ["/app/start.sh"]
CMD []
