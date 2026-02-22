#!/bin/bash

# Navigate to the script's directory (backend/)
cd "$(dirname "$0")"

# Activate virtual environment and run the server
source venv/bin/activate && python manage.py runserver
