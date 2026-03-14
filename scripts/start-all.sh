#!/usr/bin/env sh
set -eu

cleanup() {
  [ -n "${LANDING_PID:-}" ] && kill "$LANDING_PID" 2>/dev/null || true
  [ -n "${GAME_PID:-}" ] && kill "$GAME_PID" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

npm run start:landing &
LANDING_PID=$!

npm run start:game &
GAME_PID=$!

wait "$LANDING_PID" "$GAME_PID"
