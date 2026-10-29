"""Integration checks for durable writes, retries, validation and shared reads."""
import copy
import importlib.util
import json
import sqlite3
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
import uuid
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path

spec = importlib.util.spec_from_file_location("serve_nire", Path(__file__).with_name("serve-nire.py"))
server_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server_module)


def element():
    return dict(version=1, id=str(uuid.uuid4()), strokes=[[[.2, .3], [.4, .5], [.6, .3]]],
                material="glass", color="#ed75ac",
                placement=dict(anchor=dict(x=800, y=1100, z=20), basis=[1, 0, 0, 0, 1, 0, 0, 0, 1], scale=.09))


class Quiet(server_module.Handler):
    def log_message(self, *args):
        pass


class CommunityTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.database = Path(self.directory.name) / "elements.sqlite3"
        with sqlite3.connect(self.database) as db:
            db.executescript((server_module.ROOT / "community-api" / "schema.sql").read_text())
        self.start()

    def start(self):
        self.server = server_module.PreviewServer(("127.0.0.1", 0), partial(Quiet, directory=str(server_module.ROOT)))
        self.server.database = self.database
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.origin = "http://127.0.0.1:" + str(self.server.server_port)
        self.url = self.origin + server_module.API

    def stop(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def tearDown(self):
        self.stop()
        self.directory.cleanup()

    def request(self, data=None, headers=None, url=None, method=None):
        raw = json.dumps(data).encode() if data is not None else None
        request = urllib.request.Request(url or self.url, raw, headers or ({"Content-Type": "application/json"} if raw else {}), method=method)
        try:
            response = urllib.request.urlopen(request)
        except urllib.error.HTTPError as error:
            response = error
        body = response.read()
        try:
            body = json.loads(body)
        except ValueError:
            pass
        return response.code, body

    def test_write_retry_reload_restart_and_independent_reader(self):
        item = element()
        status, saved = self.request(item)
        self.assertEqual(status, 201)
        self.assertEqual(saved["element"]["id"], item["id"])
        self.assertEqual(self.request(item)[0], 200)
        self.assertEqual(len(self.request()[1]["elements"]), 1)
        modified = copy.deepcopy(item)
        modified["color"] = "#ffffff"
        self.assertEqual(self.request(modified)[0], 409)
        self.stop()
        self.start()
        status, data = self.request()
        self.assertEqual(status, 200)
        self.assertEqual(data["elements"][0]["placement"], item["placement"])
        self.assertEqual(self.request(url=self.url + "?after=" + str(data["cursor"]))[1]["elements"], [])

    def test_rejects_invalid_shape_material_transform_and_origin(self):
        for change in [
            {"version": True}, {"material": "script"}, {"color": "<script>"},
            {"strokes": [[[0, 0], [2, 1]]]}, {"strokes": [[["text", 0], [1, 1]]]},
            {"strokes": [[[.1, .2], [.2, .3]]] * 13},
            {"placement": {"anchor": {"x": 800, "y": 1100, "z": 0}, "basis": [0]*9, "scale": .09}},
        ]:
            bad = {**element(), **change}
            self.assertEqual(self.request(bad)[0], 400)
        self.assertEqual(self.request(element(), {"Content-Type": "application/json", "Origin": "https://unrelated.example"})[0], 403)
        self.assertEqual(self.request(element(), {"Content-Type": "text/plain"})[0], 415)
        self.assertEqual(self.request(url=self.url + "?after=-1")[0], 400)
        self.assertEqual(self.request(url=self.origin + "/.nire-data/elements.sqlite3")[0], 404)
        self.assertEqual(self.request(url=self.origin + "/%2enire-data/elements.sqlite3", method="HEAD")[0], 404)

    def test_payload_and_daily_limits_preserve_previous_elements(self):
        self.assertEqual(self.request({**element(), "padding": "x"*65000})[0], 413)
        for _ in range(30):
            self.assertEqual(self.request(element())[0], 201)
        self.assertEqual(self.request(element())[0], 429)
        self.assertEqual(len(self.request()[1]["elements"]), 30)

    def test_message_and_size_survive_restart(self):
        item = element()
        item["message"] = "  Una semilla 🌿\r\n<b>que crece</b>.  "
        item["placement"]["scale"] = .18
        status, data = self.request(item)
        self.assertEqual(status, 201)
        self.assertEqual(data["element"]["message"], "Una semilla 🌿\n<b>que crece</b>.")
        self.assertEqual(data["element"]["placement"]["scale"], .18)
        self.assertEqual(self.request(item)[0], 200)
        self.stop()
        self.start()
        saved = self.request()[1]["elements"][0]
        self.assertEqual(saved["message"], data["element"]["message"])
        self.assertEqual(saved["placement"]["scale"], .18)
        small = element()
        small["placement"]["scale"] = .0225
        self.assertEqual(self.request(small)[0], 201)

    def test_message_and_size_limits(self):
        for text in [None, 17, "a" * 241, "🌿" * 121, "bad\x00message"]:
            self.assertEqual(self.request({**element(), "message": text})[0], 400)
        for scale in [.019, .201]:
            item = element()
            item["placement"]["scale"] = scale
            self.assertEqual(self.request(item)[0], 400)

    def test_concurrent_retry_saves_one_element(self):
        item = element()
        statuses = []
        threads = [threading.Thread(target=lambda: statuses.append(self.request(item)[0])) for _ in range(6)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()
        self.assertEqual(len(statuses), 6)
        self.assertTrue(all(status in (200, 201) for status in statuses))
        self.assertEqual(len(self.request()[1]["elements"]), 1)


if __name__ == "__main__":
    unittest.main()
