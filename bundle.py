import threading
import time
import webbrowser
import sys

# Import the Flask app instance from app.py
from app import app


def run_server():
    # Important: disable reloader when running inside a frozen bundle
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)


def main():
    # Run server in a daemon thread so the main process can continue
    t = threading.Thread(target=run_server, daemon=True)
    t.start()

    # Give the server a moment to start
    time.sleep(1.0)

    # Open default browser to the app
    try:
        webbrowser.open('http://127.0.0.1:5000')
    except Exception:
        pass

    # Keep the main process alive while the server runs. On Windows
    # this process will be terminated by the user (Task-Manager) or
    # by a stop command.
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        # graceful exit on Ctrl+C if run from a console
        pass


if __name__ == '__main__':
    main()
