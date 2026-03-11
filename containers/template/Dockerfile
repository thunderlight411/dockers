FROM alpine:3.20

ARG BUILD_DATE
ARG VERSION
ARG VCS_REF

LABEL org.opencontainers.image.created=$BUILD_DATE \
org.opencontainers.image.version=$VERSION \
org.opencontainers.image.revision=$VCS_REF \
org.opencontainers.image.title="Template Container" \
org.opencontainers.image.description="Minimal container template" \
org.opencontainers.image.licenses="MIT"

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

USER app

ENTRYPOINT ["/entrypoint.sh"]
