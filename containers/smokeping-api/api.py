"""Read-only SmokePing RRD API with private, configurable alert thresholds."""
import json
import math
import os
import re
import statistics
import subprocess
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

ROOT = Path(os.environ.get("RRD_ROOT", "/data")).resolve()
PORT = int(os.environ.get("API_PORT", "8085"))
LOSS_WARN = float(os.environ.get("LOSS_WARN_PERCENT", "5"))
LATENCY_WARN = float(os.environ.get("LATENCY_WARN_MS", "100"))
THRESHOLDS_FILE = Path(os.environ.get("THRESHOLDS_FILE", "/config/thresholds.json"))


def get_thresholds(target):
    """Load private group thresholds; fall back to environment defaults."""
    defaults = (LATENCY_WARN, LOSS_WARN)
    if not THRESHOLDS_FILE.is_file():
        return defaults
    with THRESHOLDS_FILE.open("r", encoding="utf-8") as handle:
        config = json.load(handle)
    group = target.split("/", 1)[0]
    values = config.get("groups", {}).get(group)
    if values is None:
        return defaults
    return (float(values["latency_ms"]), float(values["packet_loss_percent"]))


def targets():
    if not ROOT.is_dir():
        return {}
    return {
        str(p.relative_to(ROOT).with_suffix("")).replace("\\", "/"): p
        for p in ROOT.rglob("*.rrd") if p.is_file()
    }


def fetch(path, hours=1):
    hours = max(1, min(int(hours), 720))
    end = int(time.time())
    start = end - hours * 3600
    result = subprocess.run(
        ["rrdtool", "fetch", str(path), "AVERAGE", "--start", str(start), "--end", str(end)],
        capture_output=True, text=True, timeout=15, check=False,
    )
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or "rrdtool fetch failed")

    lines = result.stdout.splitlines()
    header = next(
        (line.split() for line in lines if line.strip() and not re.match(r"^\s*\d+:", line)),
        [],
    )
    rows = []
    for line in lines:
        match = re.match(r"^\s*(\d+):\s*(.*)$", line)
        if not match:
            continue
        values = []
        for item in match.group(2).split():
            try:
                number = float(item)
                values.append(number if math.isfinite(number) else None)
            except ValueError:
                values.append(None)
        ds = dict(zip(header, values))
        if not any(value is not None for value in ds.values()):
            continue
        median = ds.get("median")
        pings = [
            value for key, value in ds.items()
            if re.fullmatch(r"ping\d+", key, re.I) and value is not None
        ]
        loss = ds.get("loss")
        count = sum(bool(re.fullmatch(r"ping\d+", key, re.I)) for key in ds)
        loss_pct = (100 * loss / count) if loss is not None and count else None
        if loss_pct is not None:
            loss_pct = max(0, min(100, loss_pct))
        rows.append({
            "timestamp": int(match.group(1)),
            "median_ms": round(median * 1000, 3) if median is not None else None,
            "packet_loss_percent": round(loss_pct, 2) if loss_pct is not None else None,
            "loss_count": loss,
            "jitter_proxy_ms": round(statistics.pstdev(pings) * 1000, 3) if len(pings) >= 2 else None,
        })
    return rows


def latest(name, path):
    series = fetch(path, 2)
    if not series:
        return {"target": name, "status": "no_data", "latest": None}
    row = series[-1]
    age = int(time.time()) - row["timestamp"]
    latency_warn, loss_warn = get_thresholds(name)
    loss = row["packet_loss_percent"]
    latency = row["median_ms"]
    if age > 600:
        status = "stale"
    elif loss is not None and loss >= 100:
        status = "down"
    elif ((loss is not None and loss >= loss_warn)
          or (latency is not None and latency >= latency_warn)):
        status = "warning"
    else:
        status = "ok"
    # Threshold values remain private; only calculated status is returned.
    return {"target": name, "status": status, "age_seconds": age, "latest": row}


class Handler(BaseHTTPRequestHandler):
    def reply(self, status, data):
        payload = json.dumps(data, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        url = urlsplit(self.path)
        path = url.path.rstrip("/") or "/"
        query = parse_qs(url.query)
        try:
            if path == "/health":
                return self.reply(200, {
                    "status": "ok", "rrd_root_exists": ROOT.is_dir(),
                    "targets": len(targets()),
                })
            if path == "/api/targets":
                return self.reply(200, {"targets": sorted(targets())})
            if path in ("/api/status", "/api/issues"):
                results = []
                for name, file_path in sorted(targets().items()):
                    try:
                        results.append(latest(name, file_path))
                    except Exception as exc:
                        results.append({"target": name, "status": "error", "error": str(exc)})
                if path == "/api/issues":
                    results = [item for item in results if item["status"] != "ok"]
                return self.reply(200, {"count": len(results), "results": results})
            for prefix in ("/api/target/", "/api/history/"):
                if path.startswith(prefix):
                    name = unquote(path[len(prefix):])
                    entries = targets()
                    if name not in entries:
                        return self.reply(404, {
                            "error": "Target not found",
                            "hint": "See /api/targets for exact names",
                        })
                    if prefix == "/api/target/":
                        return self.reply(200, latest(name, entries[name]))
                    try:
                        hours = int(query.get("hours", ["24"])[0])
                    except ValueError:
                        return self.reply(400, {"error": "hours must be an integer"})
                    hours = max(1, min(hours, 720))
                    return self.reply(200, {
                        "target": name, "hours": hours,
                        "points": fetch(entries[name], hours),
                    })
            return self.reply(404, {"error": "Unknown endpoint"})
        except Exception as exc:
            return self.reply(500, {"error": str(exc)})


if __name__ == "__main__":
    print(f"SmokePing API listening on 0.0.0.0:{PORT}, RRD root={ROOT}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
