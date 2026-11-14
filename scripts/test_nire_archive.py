"""Exercise the actual local archive API and durable SQLite collection."""
import base64
import copy
import importlib.util
import http.client
import json
import sqlite3
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
import uuid
from functools import partial
from pathlib import Path

spec = importlib.util.spec_from_file_location('serve_archive', Path(__file__).with_name('serve-nire.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
IMAGE = 'data:image/jpeg;base64,' + base64.b64encode((module.ROOT / 'community-api/fixtures/archive-stamp.jpg').read_bytes()).decode()


def entry():
    return dict(version=1, id=str(uuid.uuid4()), title='Una piedra de papel', text='Una forma que encuentro.\n\nUna imagen que conservo.', author='Elisa', sourceId='piedra', image=IMAGE)


class Quiet(module.Handler):
    def log_message(self, *args):
        pass


class ArchiveTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.database = Path(self.temp.name) / 'archive.sqlite3'
        with sqlite3.connect(self.database) as db:
            db.executescript((module.ROOT / 'community-api/schema.sql').read_text())
            db.execute("INSERT INTO elements(id,created_at,actor,payload) VALUES('legacy','2026-10-28','actor','{}')")
        self.start()

    def start(self):
        self.server = module.PreviewServer(('127.0.0.1', 0), partial(Quiet, directory=str(module.ROOT)))
        self.server.database = self.database
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.origin = 'http://127.0.0.1:' + str(self.server.server_port)

    def stop(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def tearDown(self):
        self.stop()
        self.temp.cleanup()

    def request(self, item=None, path='/api/nire/archive', headers=None):
        request = urllib.request.Request(self.origin + path, json.dumps(item).encode() if item is not None else None, headers or ({'Content-Type': 'application/json'} if item is not None else {}))
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

    def test_save_read_reload_restart_and_legacy_preservation(self):
        item = entry()
        self.assertEqual(self.request(item)[0], 201)
        saved = self.request()[1]['entries'][0]
        self.assertEqual(saved['image'], IMAGE)
        self.assertEqual(saved['text'], item['text'])
        self.assertEqual(self.request(item)[0], 200)
        self.assertEqual(self.request({**item, 'title': 'Otro título'})[0], 409)
        self.assertEqual(self.request(path='/api/nire/archive?after=' + str(saved['seq']))[1]['entries'], [])
        self.stop()
        self.start()
        self.assertEqual(self.request()[1]['entries'][0]['id'], item['id'])
        self.assertEqual(self.request(path='/api/nire/elements')[1]['elements'][0]['seq'], 1)

    def test_validate_text_images_and_limits(self):
        good = entry()
        for changes in [dict(title=''), dict(text=' '), dict(title='a' * 81), dict(text='a' * 2401), dict(author='🌿' * 41), dict(sourceId='../file'), dict(image='data:image/svg+xml;base64,PHN2Zz4='), dict(image=IMAGE[:-10]), dict(text='x\x00y')]:
            self.assertEqual(self.request({**good, **changes})[0], 400)
        raw = {**good, 'title': ' <b>Una pieza</b> ', 'text': '<script>Texto literal</script>\r\nOtra línea.'}
        status, saved = self.request(raw)
        self.assertEqual(status, 201)
        self.assertEqual(saved['entry']['title'], '<b>Una pieza</b>')
        self.assertEqual(saved['entry']['text'], '<script>Texto literal</script>\nOtra línea.')
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port)
        connection.putrequest('POST', '/api/nire/archive')
        connection.putheader('Content-Type', 'application/json')
        connection.putheader('Content-Length', '1200001')
        connection.endheaders()
        self.assertEqual(connection.getresponse().status, 413)
        connection.close()
        self.assertEqual(self.request(path='/api/nire/archive?after=bad')[0], 400)

    def test_daily_limit_is_idempotent_and_cors_blocks_foreign_writes(self):
        item = entry()
        self.assertEqual(self.request(item, headers={'Content-Type': 'application/json', 'Origin': 'https://unrelated.example'})[0], 403)
        self.assertEqual(self.request(item)[0], 201)
        for _ in range(29):
            self.assertEqual(self.request(entry())[0], 201)
        self.assertEqual(self.request(entry())[0], 429)
        self.assertEqual(self.request(item)[0], 200)
        self.assertEqual(len(self.request()[1]['entries']), 30)


if __name__ == '__main__':
    unittest.main()
