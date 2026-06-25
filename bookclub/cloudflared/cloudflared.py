import os
import re
import sys
import time
import signal
import platform
import subprocess
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLOUDFLARED = "cloudflared.exe" if os.name == "nt" else "cloudflared"
BACKEND_PORT = 8000


def download_cloudflared():
    if os.path.exists(CLOUDFLARED):
        return

    system = platform.system().lower()
    machine = platform.machine().lower()

    if system == "windows":
        url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    elif system == "linux":
        url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
    elif system == "darwin":
        url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz"
    else:
        raise RuntimeError(f"Unsupported OS: {system}")

    print("Downloading cloudflared...")
    urllib.request.urlretrieve(url, CLOUDFLARED)
    if os.name != "nt":
        os.chmod(CLOUDFLARED, 0o755)


def build_frontend():
    frontend_dir = os.path.join(ROOT, "frontend")
    dist_dir = os.path.join(frontend_dir, "dist")

    if os.path.exists(dist_dir):
        print("Frontend already built. Delete 'frontend/dist' to rebuild.")
        return

    print("Building frontend...")
    npm = "cmd /c npm" if os.name == "nt" else "npm"
    result = subprocess.run(f"{npm} install", cwd=frontend_dir, capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        print("npm install failed:", result.stderr)
        sys.exit(1)

    result = subprocess.run(f"{npm} run build", cwd=frontend_dir, capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        print("Frontend build failed:", result.stderr)
        sys.exit(1)

    print("Frontend built successfully.")


def find_node():
    candidates = [r"C:\Program Files\nodejs\node.exe", r"C:\Program Files (x86)\nodejs\node.exe"]
    for c in candidates:
        if os.path.exists(c):
            return c
    try:
        cmd = "where node.exe" if os.name == "nt" else "which node"
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            return result.stdout.strip().split("\n")[0].strip()
    except:
        pass
    return None


def start_backend():
    backend_dir = os.path.join(ROOT, "backend")
    node = find_node()
    if not node:
        print("Node.js not found in PATH.")
        sys.exit(1)

    tsx_path = os.path.join(backend_dir, "node_modules", "tsx", "dist", "cli.mjs")
    if not os.path.exists(tsx_path):
        print(f"tsx not found at {tsx_path}. Run 'npm install' in backend/")
        sys.exit(1)

    command = f'"{node}" "{tsx_path}" "src/index.ts"'

    process = subprocess.Popen(
        command,
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        shell=True,
    )

    started = False
    timeout = 30
    start_time = time.time()

    while time.time() - start_time < timeout:
        line = process.stdout.readline()
        if not line:
            time.sleep(0.1)
            if process.poll() is not None:
                break
            continue

        line = line.rstrip()
        print(f"  [backend] {line}")

        if "Running on" in line:
            started = True
            break

    if not started:
        print("Backend failed to start within 30s.")
        process.terminate()
        sys.exit(1)

    return process


def start_tunnel(port):
    process = subprocess.Popen(
        f'"{os.path.abspath(CLOUDFLARED)}" tunnel --url http://localhost:{port}',
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        shell=True,
    )

    tunnel_url = None
    timeout = 60
    start_time = time.time()

    while time.time() - start_time < timeout:
        line = process.stdout.readline()
        if not line:
            time.sleep(0.1)
            if process.poll() is not None:
                break
            continue

        line = line.rstrip()
        print(f"  [tunnel] {line}")

        match = re.search(r"https://[a-zA-Z0-9\-]+\.trycloudflare\.com", line)
        if match:
            tunnel_url = match.group(0)
            break

    if not tunnel_url:
        print("Tunnel URL not found within 60s.")
        process.terminate()
        return None

    return tunnel_url, process


def cleanup(*args):
    print("\nShutting down...")
    for p in processes:
        try:
            p.terminate()
        except:
            pass
    sys.exit(0)


if __name__ == "__main__":
    download_cloudflared()
    build_frontend()

    print("\nStarting backend...")
    backend = start_backend()

    print("\nStarting Cloudflare tunnel...")
    result = start_tunnel(BACKEND_PORT)
    if result is None:
        backend.terminate()
        sys.exit(1)

    tunnel_url, tunnel = result
    processes = [backend, tunnel]

    if os.name != "nt":
        signal.signal(signal.SIGINT, cleanup)
        signal.signal(signal.SIGTERM, cleanup)

    print("\n" + "=" * 60)
    print("  PUBLIC URL (для клиентов):")
    print(f"  {tunnel_url}")
    print("=" * 60)
    print("\nНажми Ctrl+C чтобы остановить.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()
