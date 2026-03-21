FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        wget \
        gnupg \
        lsb-release \
        ca-certificates \
        openssh-client \
        sshpass \
        unzip \
        zip \
        bash && \
    rm -rf /var/lib/apt/lists/*

# MySQL officiële repo toevoegen
RUN wget https://dev.mysql.com/get/mysql-apt-config_0.8.29-1_all.deb && \
    dpkg -i mysql-apt-config_0.8.29-1_all.deb && \
    apt-get update && \
    apt-get install -y --no-install-recommends mysql-client && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

CMD ["bash"]
