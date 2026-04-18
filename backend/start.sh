#!/bin/bash
set -e

cd "$(dirname "$0")"

# Install deps if needed
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
else
  source .venv/bin/activate
fi

echo "Starting Mémoire backend on http://localhost:8000"
echo "Docs available at http://localhost:8000/docs"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
