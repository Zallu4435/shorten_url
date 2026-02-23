#!/bin/bash

# Navigate to the script's directory (backend/)
cd "$(dirname "$0")"

# Activate virtual environment and run the ASGI server (supports HTTP + WebSocket)
source venv/bin/activate && daphne -b 0.0.0.0 -p 8000 config.asgi:application
