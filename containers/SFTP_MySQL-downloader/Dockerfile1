FROM alpine:3.20

LABEL org.opencontainers.image.title="backup-runner-minimal"
LABEL org.opencontainers.image.licenses="MIT"

RUN apk add --no-cache \
    bash \
    openssh-client \
    sshpass \
    mysql-client \
    unzip \
    zip \
    coreutils \
    findutils

WORKDIR /app

CMD ["bash"]
