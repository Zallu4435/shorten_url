# Tunnel Agent

Expose your local server to the internet via a public URL in seconds.

## Installation

```bash
pip install -r requirements.txt
```

## Usage

```bash
python agent.py --alias <your-alias> --token <your-token> --port <local-port>
```

**Example:**
```bash
python agent.py --alias my-app --token tk_abc123... --port 3000
```

Your app is now accessible at: `https://yourdomain.com/t/my-app/`

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--alias` | Tunnel alias (required) | — |
| `--token` | Secret token from dashboard (required) | — |
| `--port` | Local port to forward to | `3000` |
| `--host` | Local host | `localhost` |
| `--server` | Backend WebSocket URL | `ws://localhost:8000` |
| `--save` | Save config to `~/.tunnelrc` | — |

## Save your config

Use `--save` once to avoid typing token every time:

```bash
python agent.py --alias my-app --token tk_... --port 3000 --save

# Next time, just:
python agent.py --alias my-app
```

## What you'll see

```
  ╔══════════════════════════════════════════════╗
  ║          TUNNEL AGENT  v1.0.0               ║
  ╚══════════════════════════════════════════════╝

  Alias   : my-app
  Public  : http://localhost:8000/t/my-app/
  Local   : http://localhost:3000

  ✅ Connected! Tunnel is live.

  Timestamp      Method   Path                           Status   Latency
  ─────────────────────────────────────────────────────────────────────
  20:15:32       GET      /                              200      12ms
  20:15:41       POST     /api/form                      201      45ms
```

## Reconnection

The agent reconnects automatically if the connection drops, using exponential backoff (up to 10 retries, capped at 30 seconds).

## Get your token

Log in to the dashboard → **Tunnels** → **New Tunnel**. The token is shown once and never stored — save it immediately.
