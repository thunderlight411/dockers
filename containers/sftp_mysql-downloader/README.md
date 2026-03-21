Backup Runner

A lightweight Docker container designed to execute backup scripts that rely on:

* SFTP (via `sshpass`)
* MySQL dumps (`mysqldump`)
* ZIP extraction

## 📦 Features

* ✅ Lightweight (Alpine-based, ~60–90MB)
* ✅ Supports SFTP downloads
* ✅ Supports MySQL backups
* ✅ Includes unzip/zip tools
* ✅ No opinionated runtime behavior

---

## 🧰 Included Tools

| Tool                  | Purpose                  |
| --------------------- | ------------------------ |
| bash                  | Script execution         |
| openssh-client        | SSH / SFTP / ssh-keyscan |
| sshpass               | Password-based SFTP      |
| mysql-client          | mysqldump                |
| unzip / zip           | Archive handling         |
| coreutils / findutils | File operations          |

---

## 🚀 Usage

### Run with a local script

```bash
docker run --rm \
  -v /opt/backups:/var/just/server_backups \
  -v $(pwd)/backup.sh:/app/backup.sh \
  backup-runner-minimal \
  bash /app/backup.sh
```

---

### Docker Compose

```yaml
version: "3.8"

services:
  backup:
    image: backup-runner-minimal
    volumes:
      - /opt/backups:/var/just/server_backups
      - ./backup.sh:/app/backup.sh
    command: ["bash", "/app/backup.sh"]
```

---

## 📄 License

MIT License

---

## 👤 Author

GitHub: https://github.com/thunderlight411

---
