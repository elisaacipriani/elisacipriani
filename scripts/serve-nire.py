#!/usr/bin/env python3
"""Portfolio preview with durable, shared community elements. Standard library only."""
import argparse
import functools
import hashlib
import json
import math
import re
import sqlite3
from datetime import datetime, timedelta, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parents[1]
API = "/api/nire/elements"


def validate(raw):
    def number(n):
        return type(n) in (int, float) and math.isfinite(n)

    def need(ok):
        if not ok:
            raise ValueError("Invalid element")

    need(isinstance(raw, dict) and type(raw.get("version")) is int and raw.get("version") == 1)
    need(isinstance(raw.get("id"), str) and re.fullmatch(r"[a-fA-F0-9-]{36}", raw["id"]))
    need(raw.get("material") in ("mineral", "porcelain", "glass"))
    need(isinstance(raw.get("color"), str) and re.fullmatch(r"#[a-fA-F0-9]{6}", raw["color"]))
    paths = raw.get("strokes")
    need(isinstance(paths, list) and 1 <= len(paths) <= 12)
    strokes, count = [], 0
    for stroke in paths:
        need(isinstance(stroke, list) and 2 <= len(stroke) <= 160)
        result = []
        for p in stroke:
            need(isinstance(p, list) and len(p) == 2 and all(number(n) and 0 <= n <= 1 for n in p))
            result.append([round(n, 5) for n in p])
        count += len(result)
        strokes.append(result)
    need(count <= 1440)
    message = raw.get("message", "")
    need(isinstance(message, str) and len(message.encode("utf-16-le")) // 2 <= 240)
    need(not re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", message))
    message = message.replace("\r\n", "\n").replace("\r", "\n").strip()
    p = raw.get("placement", {})
    a, b, scale = p.get("anchor", {}), p.get("basis"), p.get("scale")
    need(all(number(a.get(k)) for k in ("x", "y", "z")))
    need(-300 <= a["x"] <= 1900 and -400 <= a["y"] <= 3100 and abs(a["z"]) <= 1200)
    need(number(scale) and .02 <= scale <= .2)
    need(isinstance(b, list) and len(b) == 9 and all(number(n) and abs(n) <= 1.001 for n in b))
    dot = lambda a, c: sum(x * y for x, y in zip(a, c))
    cols = [b[:3], b[3:6], b[6:]]
    need(all(abs(dot(c, c) - 1) <= .02 for c in cols))
    need(all(abs(dot(cols[i], cols[j])) <= .02 for i, j in ((0, 1), (0, 2), (1, 2))))
    det = b[0] * (b[4] * b[8] - b[5] * b[7]) - b[3] * (b[1] * b[8] - b[2] * b[7]) + b[6] * (b[1] * b[5] - b[2] * b[4])
    need(det >= .98)
    result = dict(version=1, id=raw["id"].lower(), material=raw["material"], color=raw["color"].lower(), strokes=strokes)
    if message:
        result["message"] = message
    result["placement"] = dict(anchor={k: a[k] for k in ("x", "y", "z")}, basis=b, scale=scale)
    return result


def unpack(row):
    return {**json.loads(row["payload"]), "seq": row["seq"], "createdAt": row["created_at"]}


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        result = Path(super().translate_path(path))
        if any(part in (".git", ".nire-data", ".wrangler") for part in result.parts):
            return str(ROOT / ".missing-private-file")
        return str(result)

    def db(self):
        connection = sqlite3.connect(self.server.database, timeout=15)
        connection.row_factory = sqlite3.Row
        return connection

    def json_response(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = urlsplit(self.path)
        if any(x in (".git", ".nire-data", ".wrangler") for x in url.path.split("/")):
            return self.send_error(404)
        if url.path != API:
            return super().do_GET()
        try:
            after = int(parse_qs(url.query).get("after", ["0"])[0])
            if not 0 <= after <= 2**53 - 1:
                raise ValueError()
            with self.db() as db:
                rows = db.execute("SELECT seq,created_at,payload FROM elements WHERE seq>? ORDER BY seq LIMIT 200", (after,)).fetchall()
            self.json_response(dict(elements=[unpack(r) for r in rows], cursor=rows[-1]["seq"] if rows else after, hasMore=len(rows) == 200))
        except ValueError:
            self.json_response(dict(error="Invalid cursor"), 400)
        except sqlite3.Error:
            self.json_response(dict(error="Storage unavailable"), 503)

    def do_POST(self):
        if urlsplit(self.path).path != API:
            return self.json_response(dict(error="Not found"), 404)
        origin = self.headers.get("Origin")
        if origin and urlsplit(origin).netloc != self.headers.get("Host"):
            return self.json_response(dict(error="Origin not allowed"), 403)
        if not self.headers.get("Content-Type", "").startswith("application/json"):
            return self.json_response(dict(error="JSON required"), 415)
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size < 1 or size > 60000:
                return self.json_response(dict(error="Element too large"), 413)
            element = validate(json.loads(self.rfile.read(size)))
            payload = json.dumps(element, separators=(",", ":"), ensure_ascii=False)
        except (ValueError, TypeError, AttributeError, KeyError):
            return self.json_response(dict(error="Invalid element"), 400)
        try:
            with self.db() as db:
                row = db.execute("SELECT seq,created_at,payload FROM elements WHERE id=?", (element["id"],)).fetchone()
                if row:
                    if row["payload"] != payload:
                        return self.json_response(dict(error="Element already exists"), 409)
                    return self.json_response(dict(element=unpack(row)))
                now = datetime.now(timezone.utc)
                actor = hashlib.sha256(("nire:" + self.client_address[0]).encode()).hexdigest()
                db.execute("INSERT OR IGNORE INTO elements(id,created_at,actor,payload) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM elements WHERE actor=? AND created_at>?)<30",
                           (element["id"], now.isoformat(), actor, payload, actor, (now - timedelta(days=1)).isoformat()))
                row = db.execute("SELECT seq,created_at,payload FROM elements WHERE id=?", (element["id"],)).fetchone()
            if not row:
                return self.json_response(dict(error="Daily limit reached"), 429)
            if row["payload"] != payload:
                return self.json_response(dict(error="Element already exists"), 409)
            self.json_response(dict(element=unpack(row)), 201)
        except sqlite3.Error:
            self.json_response(dict(error="Storage unavailable"), 503)


class PreviewServer(ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True


def main():
    args = argparse.ArgumentParser()
    args.add_argument("--port", type=int, default=8765)
    args.add_argument("--database", type=Path, default=ROOT / ".nire-data" / "elements.sqlite3")
    options = args.parse_args()
    options.database.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(options.database) as db:
        db.execute("PRAGMA journal_mode=WAL")
        db.executescript((ROOT / "community-api" / "schema.sql").read_text())
    server = PreviewServer(("127.0.0.1", options.port), functools.partial(Handler, directory=str(ROOT)))
    server.database = options.database
    print(f"Ñire preview: http://127.0.0.1:{options.port}/nire.html?lang=es", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
