import subprocess
import os
import sys
import time
import webbrowser

def main():
    script_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
    # Default expected location for the server exe
    exe_path = os.path.join(script_dir, 'dist', 'start-gps.exe')
    # Fallback: exe next to launcher
    if not os.path.exists(exe_path):
        alt = os.path.join(script_dir, 'start-gps.exe')
        if os.path.exists(alt):
            exe_path = alt

    if not os.path.exists(exe_path):
        # Print minimal error for debugging (silent GUIs won't show it)
        print(f"start-gps.exe not found: {exe_path}")
        return 1

    try:
        if sys.platform == 'win32':
            # Start detached on Windows so no console stays open
            DETACHED_PROCESS = 0x00000008
            subprocess.Popen([exe_path], creationflags=DETACHED_PROCESS)
        else:
            subprocess.Popen([exe_path])
    except Exception as e:
        print("Failed to start server exe:", e)
        return 1

    # Give the server a moment to start, then open the browser
    time.sleep(1.5)
    webbrowser.open('http://127.0.0.1:5000')
    return 0

if __name__ == '__main__':
    sys.exit(main())
