#!/usr/bin/env python3
"""Local HTTP server for Token Usage Tracker with a realtime Hermes usage endpoint.

Run:
    python local_server.py            # defaults to 127.0.0.1:8787
    python local_server.py --port 9000
    python local_server.py --db C:/path/to/state.db

Endpoints:
    /                 -> index.html (served from this directory)
    /<static file>    -> app.js, styles.css, usage-parser.js, ...
    /api/hermes-usage -> JSON list of Hermes session token usage read from state.db

This server only READS Hermes state.db (read-only SQLite) and never sends
API keys or system prompts out of this machine. Run it on the same machine
that owns the Hermes state.db so the browser can sync realtime usage.
"""
import argparse
import json
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

# hermes_usage.py lives next to this file.
_HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(_HERE))

from hermes_usage import read_sessions  # noqa: E402


class TrackerHandler(SimpleHTTPRequestHandler):
    """Serve the static site, plus /api/hermes-usage backed by read_sessions()."""

    db_path = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(_HERE), **kwargs)

    def log_message(self, fmt, *args):  # quieter logs
        print(f"[{self.address_string()}] {fmt % args}", file=sys.stderr)

    def do_GET(self):
        if self.path.split('?', 1)[0] == '/api/hermes-usage':
            self._serve_hermes_usage()
        else:
            super().do_GET()

    def _send_json(self, payload, status=200):
        data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(data)

    def _serve_hermes_usage(self):
        try:
            sessions = read_sessions(self.__class__.db_path)
            self._send_json({'ok': True, 'sessions': sessions, 'count': len(sessions)})
        except Exception as exc:  # surface a useful error instead of a broken pipe
            self._send_json({'ok': False, 'error': f'{type(exc).__name__}: {exc}'}, status=500)


def main():
    parser = argparse.ArgumentParser(description='Serve Token Usage Tracker + local Hermes usage endpoint')
    parser.add_argument('--host', default='127.0.0.1', help='bind address (default 127.0.0.1)')
    parser.add_argument('--port', type=int, default=8787, help='port (default 8787)')
    parser.add_argument('--db', type=Path, default=None, help='path to Hermes state.db (default: auto-detect)')
    args = parser.parse_args()

    TrackerHandler.db_path = args.db
    httpd = ThreadingHTTPServer((args.host, args.port), TrackerHandler)
    where = f'http://{args.host}:{args.port}'
    print(f'Token Usage Tracker (local) => {where}')
    print(f'API: {where}/api/hermes-usage')
    print('Press Ctrl+C to stop.')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped.')
    finally:
        httpd.server_close()


if __name__ == '__main__':
    main()