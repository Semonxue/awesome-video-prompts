#!/bin/bash

PORT=3000

echo "Checking if port $PORT is in use..."
PID=$(lsof -t -i:$PORT)

if [ ! -z "$PID" ]; then
    echo "Killing existing process on port $PORT (PID: $PID)..."
    kill -9 $PID
    sleep 1
fi

echo "Starting Markdown Editor Server on http://localhost:$PORT..."
cd "$(dirname "$0")/md-editor"
python3 server.py $PORT
