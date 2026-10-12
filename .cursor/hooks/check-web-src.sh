#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
if rg -n '\b(INSERT|UPDATE|DELETE|REPLACE)\b' apps/web/src -g '*.ts' -g '*.tsx'; then
  echo 'apps/web/src must be read-only for D1 (no INSERT/UPDATE/DELETE/REPLACE)' >&2
  exit 1
fi
