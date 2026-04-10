#!/bin/sh
set -eu

if [ ! -d node_modules/jest ]; then
  echo "[backend_test] Installing backend dependencies (including dev)..."
  npm install --include=dev
fi

if [ "$#" -eq 0 ]; then
  npm test -- --runInBand
else
  exec "$@"
fi
