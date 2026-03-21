FROM debian:bookworm-slim

LABEL org.opencontainers.image.title="backup-runner"
LABEL org.opencontainers.image.licenses="MIT"

ENV DEBIAN_FRONTEND=noninteractive

# Base tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    openssh-client \
    sshpass \
    default-mysql-client \
    unzip \
    zip \
    findutils \
    coreutils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

CMD ["bash"]
