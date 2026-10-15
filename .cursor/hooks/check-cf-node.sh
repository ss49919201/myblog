#!/usr/bin/env bash
set -euo pipefail
major="${NODE_VERSION_MAJOR:-$(node -p "process.versions.node.split('.')[0]")}"
minor="${NODE_VERSION_MINOR:-$(node -p "process.versions.node.split('.')[1]")}"
if [ "$major" -lt 22 ] || { [ "$major" -eq 22 ] && [ "$minor" -lt 18 ]; }; then
  echo 'Node.js 22.18+ is required for cf (cloudflare.config.ts). See .nvmrc.' >&2
  exit 1
fi
