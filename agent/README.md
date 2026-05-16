<h1 align="center">🌐 Tunnel Agent</h1>

<h3 align="center">
Secure Local Tunneling via WebSocket Reverse Proxy
</h3>

<p align="center">
Expose local applications to the internet through secure public URLs with automatic reconnection, lightweight forwarding, and persistent tunnel configuration.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="WebSocket" />
  <img src="https://img.shields.io/badge/AsyncIO-000000?style=for-the-badge&logo=python&logoColor=white" alt="AsyncIO" />
  <img src="https://img.shields.io/badge/Tunneling-2CA5E0?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Tunnel" />
</p>

---

# 📌 Overview

Tunnel Agent is a lightweight reverse tunneling client that securely exposes local development servers through a public URL.

The agent establishes a persistent WebSocket connection to the tunnel server and forwards incoming HTTP requests to your local application in real time.

Core capabilities include:

- Secure token-based authentication
- Public URL forwarding
- Automatic reconnection handling
- Config persistence
- Request logging & latency tracking
- Lightweight CLI workflow

---

# 🚀 Features

## 🔗 Tunneling

- Expose localhost applications instantly
- Public URL generation
- Alias-based routing
- HTTP request forwarding
- WebSocket-based communication

---

## 🔐 Security

- Token-authenticated connections
- Secure tunnel validation
- Isolated alias routing
- No credential persistence by default

---

## ⚡ Reliability

- Automatic reconnection
- Exponential backoff retry logic
- Persistent WebSocket sessions
- Connection recovery handling

---

## 🖥️ Developer Experience

- Simple CLI interface
- Saved configuration support
- Real-time request logs
- Latency monitoring
- Minimal setup process

---

# 🛠️ Installation

## Prerequisites

- Python 3.10+
- Active tunnel token

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

# 🏁 Quick Start

## Basic Usage

```bash
python agent.py \
  --alias my-app \
  --token tk_abc123 \
  --port 3000
```

---

## Public URL

Your local application becomes accessible at:

```text
https://yourdomain.com/t/my-app/
```

---

# ⚙️ CLI Options

| Flag | Description | Default |
|---|---|---|
| `--alias` | Unique tunnel alias | Required |
| `--token` | Tunnel authentication token | Required |
| `--port` | Local port to forward traffic to | `3000` |
| `--host` | Local host address | `localhost` |
| `--server` | Tunnel WebSocket server | `ws://localhost:8000` |
| `--save` | Persist configuration to `~/.tunnelrc` | Disabled |

---

# 💾 Save Configuration

Use `--save` to persist your configuration locally.

## First Run

```bash
python agent.py \
  --alias my-app \
  --token tk_abc123 \
  --port 3000 \
  --save
```

---

## Future Runs

```bash
python agent.py --alias my-app
```

---

# 📊 Live Terminal Output

```text
╔══════════════════════════════════════════════╗
║             TUNNEL AGENT v1.0.0             ║
╚══════════════════════════════════════════════╝

Alias   : my-app
Public  : https://yourdomain.com/t/my-app/
Local   : http://localhost:3000

✅ Connected! Tunnel is live.

Timestamp      Method   Path                Status   Latency
────────────────────────────────────────────────────────────
20:15:32       GET      /                   200      12ms
20:15:41       POST     /api/form           201      45ms
```

---

# 🔄 Reconnection Strategy

The agent automatically reconnects if the WebSocket connection drops.

### Retry Strategy

- Exponential backoff
- Maximum 10 retries
- Retry delay capped at 30 seconds

This ensures stable tunnel recovery during temporary network interruptions.

---

# 🔒 Authentication

Tunnel access requires a valid authentication token.

## Get Your Token

1. Log in to the dashboard
2. Navigate to **Tunnels**
3. Create a new tunnel
4. Copy the generated token immediately

> Tokens are shown only once and are never stored server-side in plaintext.

---

# 🏗️ Architecture

```text
Public Request
       │
       ▼
Tunnel Server
       │
 WebSocket Connection
       │
       ▼
Tunnel Agent
       │
       ▼
Local Application
```

---

# 📂 Project Structure

```bash
tunnel-agent/
│
├── agent.py
├── requirements.txt
├── config.py
├── websocket_client.py
├── request_handler.py
└── README.md
```

---

# ⚡ Engineering Highlights

- Persistent bidirectional WebSocket communication
- Lightweight reverse proxy architecture
- Async request forwarding pipeline
- Config persistence via local rc file
- Structured terminal logging
- Automatic retry handling

---

# 📈 Future Improvements

- HTTPS local forwarding
- Multiple concurrent tunnels
- Tunnel metrics dashboard
- Custom domains
- End-to-end encrypted tunnels
- Dockerized agent distribution

---

# 📝 License

Released under the MIT License.