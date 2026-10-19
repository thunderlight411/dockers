"""Read-only SmokePing RRD API, using rrdtool CLI (no SmokePing modifications)."""
import json
import math
import os
import re
import statistics
import subprocess
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

ROOT = Path(os.environ.get('RRD_ROOT', '/data')).resolve()
PORT = int(os.environ.get('API_PORT', '8085'))
LOSS_WARN = float(os.environ.get('LOSS_WARN_PERCENT', '5'))
LATENCY_WARN = float(os.environ.get('LATENCY_WARN_MS', '100'))

def targets():
    return {str(p.relative_to(ROOT).with_suffix('')).replace('\\', '/'): p for p in ROOT.rglob('*.rrd') if p.is_file()}

def fetch(p, hours=1):
    hours = max(1, min(int(hours), 24 * 30))
    end = int(time.time())
    start = end - hours * 3600
    result = subprocess.run(['rrdtool', 'fetch', str(p), 'AVERAGE', '--start', str(start), '--end', str(end)], capture_output=True, text=True, timeout=15)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or 'rrdtool fetch failed')
    lines = result.stdout.splitlines()
    header = next((line.split() for line in lines if line.strip() and not re.match(r'^\s*\d+:', line)), [])
    out = []
    for line in lines:
        match = re.match(r'^\s*(\d+):\s*(.*)$', line)
        if not match:
            continue
        values = []
        for s in match.group(2).split():
            try:
                v = float(s)
                values.append(v if math.isfinite(v) else None)
            except ValueError:
                values.append(None)
        ds = dict(zip(header, values))
        if not any(v is not None for v in ds.values()):
            continue
        # SmokePing FPing DS usually: median (seconds), loss (count), ping1...pingN (seconds).
        med = ds.get('median')
        ping_values = [v for k, v in ds.items() if re.fullmatch(r'ping\d+', k, re.I) and v is not None]
        loss = ds.get('loss')
        count = len([k for k in ds if re.fullmatch(r'ping\d+', k, re.I)])
        # RRD missing ping values represent lost probes; loss DS is count per round.
        loss_pct = (100 * loss / count) if loss is not None and count else None
        if loss_pct is not None:
            loss_pct = max(0, min(100, loss_pct))
        out.append({
            'timestamp': int(match.group(1)),
            'median_ms': round(med * 1000, 3) if med is not None else None,
            'packet_loss_percent': round(loss_pct, 2) if loss_pct is not None else None,
            'loss_count': loss,
            'jitter_proxy_ms': round(statistics.pstdev(ping_values) * 1000, 3) if len(ping_values) >= 2 else None,
        })
    return out

def latest(name, p):
    series = fetch(p, 2)
    if not series:
        return {'target': name, 'status': 'no_data', 'latest': None}
    row = series[-1]
    age = int(time.time()) - row['timestamp']
    if age > 600:
        status = 'stale'
    elif row['packet_loss_percent'] is not None and row['packet_loss_percent'] >= 100:
        status = 'down'
    elif (row['packet_loss_percent'] is not None and row['packet_loss_percent'] >= LOSS_WARN) or (row['median_ms'] is not None and row['median_ms'] >= LATENCY_WARN):
        status = 'warning'
    else:
        status = 'ok'
    return {'target': name, 'status': status, 'age_seconds': age, 'latest': row}

class Handler(BaseHTTPRequestHandler):
    def reply(self, status, data):
        payload = json.dumps(data, ensure_ascii=False, allow_nan=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        url = urlsplit(self.path)
        path = url.path.rstrip('/') or '/'
        query = parse_qs(url.query)
        try:
            if path == '/health':
                return self.reply(200, {'status': 'ok', 'rrd_root_exists': ROOT.is_dir(), 'targets': len(targets())})
            if path == '/api/targets':
                return self.reply(200, {'targets': sorted(targets())})
            if path in ('/api/status', '/api/issues'):
                results = []
                for name, p in sorted(targets().items()):
                    try:
                        results.append(latest(name, p))
                    except Exception as e:
                        results.append({'target': name, 'status': 'error', 'error': str(e)})
                if path == '/api/issues':
                    results = [r for r in results if r['status'] != 'ok']
                return self.reply(200, {'count': len(results), 'results': results})
            for prefix in ('/api/target/', '/api/history/'):
                if path.startswith(prefix):
                    name = unquote(path[len(prefix):])
                    entries = targets()
                    if name not in entries:
                        return self.reply(404, {'error': 'Target not found', 'hint': 'See /api/targets for exact names'})
                    if prefix == '/api/target/':
                        return self.reply(200, latest(name, entries[name]))
                    try:
                        hours = int(query.get('hours', ['24'])[0])
                    except ValueError:
                        return self.reply(400, {'error': 'hours must be an integer'})
                    return self.reply(200, {'target': name, 'hours': max(1, min(hours, 720)), 'points': fetch(entries[name], hours)})
            return self.reply(404, {'error': 'Unknown endpoint'})
        except Exception as e:
            return self.reply(500, {'error': str(e)})

if __name__ == '__main__':
    print(f'SmokePing API listening on 0.0.0.0:{PORT}, RRD root={ROOT}', flush=True)
    ThreadingHTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
