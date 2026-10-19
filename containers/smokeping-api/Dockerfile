FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 rrdtool ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --chmod=0444 api.py /app/api.py
USER 1000:1000
EXPOSE 8085
CMD ["python3", "-u", "/app/api.py"]
