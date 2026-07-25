"""Local authoring server for Monty's Robo-Racer board editor."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import os
import tempfile
import argparse
import threading
import webbrowser


ROOT = Path(__file__).resolve().parent
BOARDS_FILE = ROOT / "data" / "boards.json"


class EditorHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path.rstrip("/") == "/api/boards":
            return self.send_boards()
        return super().do_GET()

    def do_PUT(self):
        if self.path.rstrip("/") != "/api/boards":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            boards = json.loads(self.rfile.read(length))
            if not isinstance(boards, list):
                raise ValueError("boards.json must contain a JSON array.")
            ids = [board.get("id") for board in boards if isinstance(board, dict)]
            if len(ids) != len(boards) or any(not board_id for board_id in ids):
                raise ValueError("Every board must be an object with an ID.")
            if len(ids) != len(set(ids)):
                raise ValueError("Board IDs must be unique.")
            BOARDS_FILE.parent.mkdir(parents=True, exist_ok=True)
            handle, temp_name = tempfile.mkstemp(prefix="boards-", suffix=".json", dir=BOARDS_FILE.parent)
            try:
                with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as output:
                    json.dump(boards, output, indent=2, ensure_ascii=False)
                    output.write("\n")
                os.replace(temp_name, BOARDS_FILE)
            finally:
                if os.path.exists(temp_name):
                    os.unlink(temp_name)
            self.send_response(204)
            self.end_headers()
        except (ValueError, json.JSONDecodeError) as error:
            message = str(error).encode("utf-8")
            self.send_response(400)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(message)))
            self.end_headers()
            self.wfile.write(message)

    def send_boards(self):
        try:
            content = BOARDS_FILE.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404, "data/boards.json was not found")


class EditorServer(ThreadingHTTPServer):
    allow_reuse_address = False
    allow_reuse_port = False


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8766)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    address = ("127.0.0.1", args.port)
    editor_url = f"http://{address[0]}:{address[1]}/board-editor.html"
    server = EditorServer(address, EditorHandler)
    print(f"Board editor: {editor_url}")
    if not args.no_browser:
        threading.Timer(0.4, lambda: webbrowser.open(editor_url)).start()
    server.serve_forever()
