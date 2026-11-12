#!/usr/bin/env python3
"""Loopback-only static development server; webroot is this package's web/ directory."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
ROOT = Path(__file__).resolve().parents[2] / 'web'
HOST = os.environ.get('WEB_HOST', '127.0.0.1')
PORT = int(os.environ.get('WEB_PORT', '8402'))
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs): super().__init__(*args, directory=str(ROOT), **kwargs)
if __name__ == '__main__':
    if not ROOT.is_dir(): raise SystemExit(f'Missing web root: {ROOT}')
    print(f'Serving {ROOT} at http://{HOST}:{PORT}', flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
