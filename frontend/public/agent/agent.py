#!/usr/bin/env python3
"""
Tunnel Agent — connects your local server to a public URL.

Usage:
    python agent.py --alias my-app --token tk_... --port 3000

Config file (~/.tunnelrc):
    The agent can save your settings so you don't need to type them every time.
    On first run with --save, it writes to ~/.tunnelrc:
      [my-app]
      token = tk_...
      port = 3000

    --save      Save alias/token/port to ~/.tunnelrc for future use
"""

import argparse
import asyncio
import base64
import configparser
import json
import os
import signal
import sys
import time
import uuid
from datetime import datetime
from pathlib import Path

# ─── Config ────────────────────────────────────────────────────────────────

VERSION = "1.1.0"
CONFIG_PATH = Path.home() / ".tunnelrc"

# Reconnect strategy
MAX_RETRIES = 10
BACKOFF_BASE = 1      # seconds
BACKOFF_MAX = 30      # seconds cap

# ─── Colors ────────────────────────────────────────────────────────────────

GREEN  = "\033[38;5;82m"    # Emerald/Green
RED    = "\033[38;5;196m"   # Bright Red
YELLOW = "\033[38;5;214m"   # Orange/Amber
CYAN   = "\033[38;5;39m"    # Sky Blue
GRAY   = "\033[38;5;244m"   # Medium Gray
WHITE  = "\033[38;5;255m"   # Pure White
BOLD   = "\033[1m"
RESET  = "\033[0m"

STATUS_200 = GREEN
STATUS_4XX = YELLOW
STATUS_5XX = RED


def color_status(status: int) -> str:
    if 200 <= status < 300:
        return GREEN + str(status) + RESET
    elif 400 <= status < 500:
        return YELLOW + str(status) + RESET
    else:
        return RED + str(status) + RESET

def ensure_dependencies():
    """Check for missing dependencies and offer to install them."""
    missing = []
    try: import requests
    except ImportError: missing.append("requests")
    try: import websockets
    except ImportError: missing.append("websockets")

    if not missing:
        return

    print(f"\n{BOLD}{YELLOW}  ⚠ Missing required dependencies: {', '.join(missing)}{RESET}")
    print(f"  {GRAY}The agent needs these to establish a secure tunnel.{RESET}")
    
    try:
        choice = input(f"\n  {BOLD}Apply missing patches via pip? [Y/n]: {RESET}").strip().lower()
    except (KeyboardInterrupt, EOFError):
        print(f"\n  {RED}❌ Aborted.{RESET}")
        sys.exit(1)

    if choice in ["", "y", "yes"]:
        print(f"  {CYAN}# Downloading patches...{RESET}")
        import subprocess
        
        # Check if pip is even available
        try:
            subprocess.run([sys.executable, "-m", "pip", "--version"], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print(f"\n{BOLD}{RED}  ❌ Critical Failure: pip is not installed for this Python version.{RESET}")
            print(f"  {GRAY}Arch Linux: sudo pacman -S python-pip{RESET}")
            print(f"  {GRAY}Or use the Node.js version of this agent (node agent.js).{RESET}")
            sys.exit(1)

        try:
            # Capture both stdout and stderr to catch all error messages
            result = subprocess.run(
                [sys.executable, "-m", "pip", "install", *missing],
                check=True,
                capture_output=True,
                text=True
            )
            print(f"  {GREEN}✓ Patches applied successfully.{RESET}")
            # Re-import globally
            global requests, websockets, ConnectionClosedError, WebSocketException
            import requests # type: ignore
            import websockets # type: ignore
            from websockets.exceptions import ConnectionClosedError, WebSocketException # type: ignore
        except subprocess.CalledProcessError as e:
            print(f"\n{BOLD}{RED}  ❌ Critical Failure: Could not install dependencies.{RESET}")
            # Check both stdout and stderr as some pip versions vary
            combined_output = (e.stdout or "") + (e.stderr or "")
            if "externally-managed-environment" in combined_output:
                print(f"  {YELLOW}⚠ Your system Python is protecting itself from system-wide pip installs.{RESET}")
                print(f"  {GRAY}Recommendation: Use a virtual environment (venv) or pipx.{RESET}")
                print(f"  {GRAY}Override (unsafe): pip install {' '.join(missing)} --break-system-packages{RESET}")
            else:
                print(f"  {GRAY}{combined_output.strip() or e}{RESET}")
            
            print(f"\n  {BOLD}Please run manually:{RESET}")
            print(f"  {WHITE}pip install {' '.join(missing)}{RESET}\n")
            sys.exit(1)
        except Exception as e:
            print(f"\n{BOLD}{RED}  ❌ Unexpected Failure: {e}{RESET}")
            sys.exit(1)
    else:
        print(f"\n  {RED}❌ Agent cannot proceed without dependencies.{RESET}\n")
        sys.exit(1)

# Run dependency check before anything else
ensure_dependencies()


# ─── Banner ────────────────────────────────────────────────────────────────

def print_banner(alias: str, public_url: str, local_url: str):
    print(f"\n{BOLD}{CYAN}  ┌────────────────────────────────────────────────────────────┐{RESET}")
    print(f"{BOLD}{CYAN}  │{RESET}  {BOLD}MATRIX TUNNEL AGENT  v{VERSION}{RESET}                          {BOLD}{CYAN}│{RESET}")
    print(f"{BOLD}{CYAN}  └────────────────────────────────────────────────────────────┘{RESET}\n")

    print(f"  {BOLD}{GRAY}NODE ALIAS{RESET}   : {BOLD}{WHITE}{alias}{RESET}")
    print(f"  {BOLD}{GRAY}PUBLIC ENDPT{RESET} : {CYAN}{public_url}{RESET}")
    print(f"  {BOLD}{GRAY}LOCAL BRIDGE{RESET} : {GRAY}{local_url}{RESET}")
    print(f"\n  {GRAY}# Initializing secure uplink...{RESET}")


def print_connected():
    print(f"  {GREEN}✓ Connection Established. Node is live.{RESET}\n")
    # Table header
    cols = [
        (GRAY + "TIMESTAMP" + RESET, 14),
        (GRAY + "METHOD" + RESET, 10),
        (GRAY + "PATH" + RESET, 32),
        (GRAY + "STATUS" + RESET, 12),
        (GRAY + "LATENCY" + RESET, 10)
    ]
    header = "  " + "".join([f"{col[0]:<{col[1]}}" for col in cols])
    divider = "  " + "".join([f"{'─' * (col[1]-2):<{col[1]}}" for col in cols])
    print(header)
    print(divider)


def should_log(path: str, verbose: bool) -> bool:
    """Determine if a request should be logged in the console."""
    if verbose:
        return True
    
    # Aggressive Noise filters
    noise_prefixes = ["/_next/", "/static/", "/media/", "/favicon.ico", "/__nextjs_launcher"]
    noise_extensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".css", ".map", ".ico", ".js", ".json"]
    
    if any(path.startswith(p) for p in noise_prefixes):
        return False
    if any(path.lower().endswith(e) for e in noise_extensions):
        return False
    
    return True


def print_request_log(method: str, path: str, status: int, latency_ms: float, verbose: bool = False):
    if not should_log(path, verbose):
        return
        
    ts = datetime.now().strftime("%H:%M:%S")
    path_display = (path[:29] + "…") if len(path) > 30 else path

    # Clean method color
    method_col = CYAN
    if method in ["POST", "PUT"]: method_col = YELLOW
    elif method == "DELETE": method_col = RED

    print(f"  {GRAY}{ts:<12}{RESET} {method_col}{BOLD}{method:<10}{RESET} {path_display:<32} {color_status(status):<22} {GRAY}{latency_ms:>6.0f}ms{RESET}")


# ─── Config File Helpers ────────────────────────────────────────────────────

def load_config(alias: str) -> dict:
    """Load token and port from ~/.tunnelrc for a given alias."""
    config = configparser.ConfigParser()
    if CONFIG_PATH.exists():
        config.read(CONFIG_PATH)
        if alias in config:
            return dict(config[alias])
    return {}


def save_config(alias: str, token: str, port: int):
    """Save alias config to ~/.tunnelrc."""
    config = configparser.ConfigParser()
    if CONFIG_PATH.exists():
        config.read(CONFIG_PATH)
    if alias not in config:
        config[alias] = {}
    config[alias]["token"] = token
    config[alias]["port"] = str(port)
    with open(CONFIG_PATH, "w") as f:
        config.write(f)
    print(f"  {GREEN}✅ Config saved to {CONFIG_PATH}{RESET}")


# ─── Request Forwarding ────────────────────────────────────────────────────

def forward_to_local(method: str, path: str, headers: dict, body: bytes, local_url: str) -> dict:
    """
    Forward an HTTP request to the local server and return a response dict.
    """
    # Build clean headers for local request
    forward_headers = {}
    for key, val in headers.items():
        # Strip Django META prefix
        if key.startswith("HTTP_"):
            clean = key[5:].replace("_", "-").title()
            forward_headers[clean] = val
        elif key == "CONTENT_TYPE":
            forward_headers["Content-Type"] = val
        elif key == "CONTENT_LENGTH" and val:
            forward_headers["Content-Length"] = val

    # Remove headers that shouldn't be forwarded
    forward_headers.pop("Host", None)

    url = local_url.rstrip("/") + path.split("?")[0]
    params = path.split("?")[1] if "?" in path else None

    try:
        start = time.time()
        resp = requests.request(
            method=method,
            url=url,
            headers=forward_headers,
            data=body,
            params=params,
            timeout=25,
            allow_redirects=True,
        )
        latency_ms = (time.time() - start) * 1000

        # Strip headers that we shouldn't pass back (compression, chunks, etc)
        # The agent de-chunks and de-compresses automatically via 'requests'
        response_headers = dict(resp.headers)
        response_headers.pop("Content-Encoding", None)
        response_headers.pop("Transfer-Encoding", None)
        response_headers.pop("Content-Length", None)

        return {
            "status": resp.status_code,
            "headers": response_headers,
            "body": base64.b64encode(resp.content).decode("utf-8"),
            "latency_ms": latency_ms,
        }

    except requests.exceptions.ConnectionError:
        error_msg = f"LOCAL_EVICTION: Target {local_url} severed. Is the bridge service running?"
        return {
            "status": 503,
            "headers": {"Content-Type": "text/plain"},
            "body": base64.b64encode(error_msg.encode()).decode(),
            "latency_ms": 0,
        }
    except requests.exceptions.Timeout:
        error_msg = "UPSTREAM_TIMEOUT: Local service failed to respond within 25s boundary."
        return {
            "status": 504,
            "headers": {"Content-Type": "text/plain"},
            "body": base64.b64encode(error_msg.encode()).decode(),
            "latency_ms": 25000,
        }
    except Exception as e:
        error_msg = f"Agent error: {e}"
        return {
            "status": 502,
            "headers": {"Content-Type": "text/plain"},
            "body": base64.b64encode(error_msg.encode()).decode(),
            "latency_ms": 0,
        }


# ─── WebSocket Connection ───────────────────────────────────────────────────

async def run_agent(alias: str, token: str, local_url: str, ws_url: str, args_verbose: bool = False):
    """
    Main agent loop: connect, handle requests, auto-reconnect on drop.
    """
    retry_count = 0

    while True:
        try:
            async with websockets.connect(
                ws_url,
                additional_headers={
                    "Authorization": f"Bearer {token}",
                    "X-Agent-Version": VERSION
                },
                ping_interval=20,
                ping_timeout=30,
            ) as ws:
                retry_count = 0
                print_connected()

                async for raw_message in ws:
                    try:
                        msg = json.loads(raw_message)
                    except json.JSONDecodeError:
                        continue

                    msg_type = msg.get("type")

                    # Server sent a disconnect reason (e.g. bad token, alias taken)
                    if msg_type == "disconnect":
                        reason = msg.get("reason", "Unknown reason.")
                        print(f"\n  {RED}❌ {reason}{RESET}\n\n")
                        sys.exit(1)

                    # Server is forwarding an HTTP request to us
                    elif msg_type == "request":
                        request_id = msg.get("request_id")
                        method = msg.get("method", "GET")
                        path = msg.get("path", "/")
                        headers = msg.get("headers", {})
                        body = msg.get("body", "")

                        # Decode incoming base64 body from server
                        try:
                            decoded_body = base64.b64decode(body)
                        except Exception:
                            decoded_body = b""

                        # Forward to local server
                        result = forward_to_local(method, path, headers, decoded_body, local_url)

                        # Log it
                        verbose_logging = headers.get("AGENT_VERBOSE", "0") == "1" # Internal hack if needed
                        print_request_log(method, path, result["status"], result["latency_ms"], verbose=args_verbose)

                        # Send response back to server
                        await ws.send(json.dumps({
                            "type": "response",
                            "request_id": request_id,
                            "status": result["status"],
                            "headers": result["headers"],
                            "body": result["body"],
                        }))

        except ConnectionClosedError as e:
            print(f"\n  {YELLOW}⚠ Warning: Uplink interrupted (code {e.code}).{RESET}")

        except (OSError, WebSocketException) as e:
            print(f"\n  {YELLOW}⚠ Warning: Network error detected: {e}{RESET}")

        except KeyboardInterrupt:
            print(f"\n\n  {CYAN}⠿ Gracefully severing neural uplink...{RESET}\n")
            sys.exit(0)

        # Reconnect logic
        retry_count += 1
        if retry_count > MAX_RETRIES:
            print(f"\n  {RED}❌ Could not reconnect after {MAX_RETRIES} attempts. Run the agent again manually.{RESET}\n")
            sys.exit(1)

        wait = min(BACKOFF_BASE * (2 ** (retry_count - 1)), BACKOFF_MAX)
        print(f"  {YELLOW}↻  Retrying in {wait:.0f}s... (attempt {retry_count}/{MAX_RETRIES}){RESET}")
        await asyncio.sleep(wait)


# ─── Entry Point ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Tunnel Agent — expose your local server via a public URL."
    )
    parser.add_argument("--alias",  type=str, help="Tunnel alias (e.g. my-app)")
    parser.add_argument("--token",  type=str, help="Secret tunnel token")
    parser.add_argument("--port",   type=int, help="Local port to forward to (default: 3000)")
    parser.add_argument("--host",   type=str, default="localhost", help="Local host (default: localhost)")
    parser.add_argument("--save",   action="store_true", help="Save config to ~/.tunnelrc")
    parser.add_argument("--verbose", action="store_true", help="Show all logs (including static assets)")
    args = parser.parse_args()

    alias = args.alias
    token = args.token
    port  = args.port

    # Try to load from config file if alias given but no token
    if alias and not token:
        saved = load_config(alias)
        token = saved.get("token")
        if not port:
            port = int(saved.get("port", 3000))

    port = port or 3000

    # Validate required args
    if not alias:
        print(f"{RED}❌ --alias is required.{RESET}")
        parser.print_help()
        sys.exit(1)
    if not token:
        print(f"{RED}❌ --token is required (or save it in ~/.tunnelrc with --save).{RESET}")
        parser.print_help()
        sys.exit(1)

    # Optionally save to config
    if args.save:
        save_config(alias, token, port)

    local_url = f"http://{args.host}:{port}"
    ws_url    = f"{args.server.rstrip('/')}/ws/tunnel/{alias}/"
    # Build a rough public URL for display purposes
    public_url = args.server.replace("ws://", "http://").replace("wss://", "https://") + f"/t/{alias}/"

    print_banner(alias, public_url, local_url)

    # Run
    try:
        asyncio.run(run_agent(alias, token, local_url, ws_url, args_verbose=args.verbose))
    except KeyboardInterrupt:
        print(f"\n  {CYAN}👋 Goodbye!{RESET}\n")


if __name__ == "__main__":
    main()
