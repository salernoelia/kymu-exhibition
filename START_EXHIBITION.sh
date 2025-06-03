#!/bin/zsh

# Store the Node process ID
node .output/server/index.mjs &
NODE_PID=$!

sleep 2

cleanup() {
    echo "Cleaning up..."
    kill $NODE_PID
    exit 0
}

trap cleanup SIGINT SIGTERM

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --kiosk \
  --disable-web-security \
  --disable-features=VizDisplayCompositor \
  --start-fullscreen \
  --start-maximized \
  --window-size=1920,1080 \
  --window-position=0,0 \
  --disable-restore-session-state \
  --noerrdialogs \
  --app=http://localhost:3000

cleanup