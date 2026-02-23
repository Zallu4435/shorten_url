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

Options:
    --alias     Tunnel alias (required)
    --token     Secret tunnel token (required if not in config)
    --port      Local port to forward to (default: 3000)
    --host      Local host (default: localhost)
    --server    Backend WebSocket URL (default: ws://localhost:8000)
    --save      Save alias/token/port to ~/.tunnelrc for future use
    --force     Not implemented yet (reserved for future use)
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

try:
    import requests
    import websockets
    from websockets.exceptions import ConnectionClosedError, InvalidURI, WebSocketException
except ImportError:
    print("\n" + "!" * 50)
    print("❌ ERROR: Missing dependencies!")
    print("Please run: pip install websockets requests")
    print("!" * 50 + "\n")
    sys.exit(1)

# ─── Config ────────────────────────────────────────────────────────────────

CONFIG_PATH = Path.home() / ".tunnelrc"

# Reconnect strategy
MAX_RETRIES = 10
BACKOFF_BASE = 1      # seconds
BACKOFF_MAX = 30      # seconds cap

# ─── Colors ────────────────────────────────────────────────────────────────

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
GRAY   = "\033[90m"
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


# ─── Banner ────────────────────────────────────────────────────────────────

def print_banner(alias: str, public_url: str, local_url: str):
    print()
    print(f"{BOLD}{CYAN}  ╔══════════════════════════════════════════════╗{RESET}")
    print(f"{BOLD}{CYAN}  ║          TUNNEL AGENT  v1.0.0               ║{RESET}")
    print(f"{BOLD}{CYAN}  ╚══════════════════════════════════════════════╝{RESET}")
    print()
    print(f"  {BOLD}Alias   {RESET}: {CYAN}{alias}{RESET}")
    print(f"  {BOLD}Public  {RESET}: {GREEN}{public_url}{RESET}")
    print(f"  {BOLD}Local   {RESET}: {GRAY}{local_url}{RESET}")
    print()
    print(f"  {GRAY}Connecting to server...{RESET}")


def print_connected():
    print(f"  {GREEN}✅ Connected! Tunnel is live.{RESET}")
    print()
    print(f"  {GRAY}{'Timestamp':<14} {'Method':<8} {'Path':<30} {'Status':<8} {'Latency'}{RESET}")
    print(f"  {GRAY}{'─'*14} {'─'*8} {'─'*30} {'─'*8} {'─'*8}{RESET}")


def print_request_log(method: str, path: str, status: int, latency_ms: float):
    ts = datetime.now().strftime("%H:%M:%S")
    path_display = path[:29] if len(path) > 29 else path
    print(f"  {GRAY}{ts:<14}{RESET} {CYAN}{method:<8}{RESET} {path_display:<30} {color_status(status):<24} {GRAY}{latency_ms:.0f}ms{RESET}")


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
        error_msg = f"Local server at {local_url} is not responding. Is your app running?"
        return {
            "status": 503,
            "headers": {"Content-Type": "text/plain"},
            "body": base64.b64encode(error_msg.encode()).decode(),
            "latency_ms": 0,
        }
    except requests.exceptions.Timeout:
        error_msg = "Local server timed out (25s)."
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

async def run_agent(alias: str, token: str, local_url: str, ws_url: str):
    """
    Main agent loop: connect, handle requests, auto-reconnect on drop.
    """
    retry_count = 0

    while True:
        try:
            async with websockets.connect(
                ws_url,
                additional_headers={"Authorization": f"Bearer {token}"},
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
                        print(f"\n  {RED}❌ {reason}{RESET}")
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
                        print_request_log(method, path, result["status"], result["latency_ms"])

                        # Send response back to server
                        await ws.send(json.dumps({
                            "type": "response",
                            "request_id": request_id,
                            "status": result["status"],
                            "headers": result["headers"],
                            "body": result["body"],
                        }))

        except ConnectionClosedError as e:
            print(f"\n  {YELLOW}⚠️  Connection dropped (code {e.code}).{RESET}")

        except (OSError, WebSocketException) as e:
            print(f"\n  {YELLOW}⚠️  Connection error: {e}{RESET}")

        except KeyboardInterrupt:
            print(f"\n\n  {CYAN}👋 Gracefully disconnecting...{RESET}\n")
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
    parser.add_argument("--server", type=str, default="ws://localhost:8000", help="Backend WS URL")
    parser.add_argument("--save",   action="store_true", help="Save config to ~/.tunnelrc")
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
        asyncio.run(run_agent(alias, token, local_url, ws_url))
    except KeyboardInterrupt:
        print(f"\n  {CYAN}👋 Goodbye!{RESET}\n")


if __name__ == "__main__":
    main()
