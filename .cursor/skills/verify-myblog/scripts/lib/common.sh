#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../.." && pwd)"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPTS_DIR="${SKILL_DIR}/scripts"

export MYBLOG_WEB_PORT="${MYBLOG_WEB_PORT:-5173}"
export MYBLOG_ADMIN_PORT="${MYBLOG_ADMIN_PORT:-5174}"
export MYBLOG_WEB_URL="http://localhost:${MYBLOG_WEB_PORT}"
export MYBLOG_ADMIN_URL="http://localhost:${MYBLOG_ADMIN_PORT}"

myblog_node_path() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # shellcheck disable=SC1090
    . "$NVM_DIR/nvm.sh"
    local want
    want="$(cat "$REPO_ROOT/.nvmrc" 2>/dev/null || echo "22.19.0")"
    nvm install "$want" >/dev/null 2>&1 || true
    nvm use "$want" >/dev/null
    echo "$NVM_DIR/versions/node/v${want#v}/bin"
  else
    echo "$(dirname "$(command -v node)")"
  fi
}

myblog_export_node() {
  local node_bin
  node_bin="$(myblog_node_path)"
  export PATH="${node_bin}:${PATH}"
  local min="22.18.0"
  local cur
  cur="$(node -p "process.versions.node.split('.').map((n,i)=>i<2?n.padStart(2,'0'):n.padStart(4,'0')).join('.')")"
  if [[ "$(printf '%s\n' "$cur" "$min" | sort -V | head -1)" != "$min" ]]; then
    echo "Node $(node -v) is below 22.18 (required for cf). Install nvm and .nvmrc." >&2
    exit 1
  fi
}

myblog_run_dir() {
  if [[ -z "${MYBLOG_VERIFY_RUN_ID:-}" ]]; then
    MYBLOG_VERIFY_RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)-$(printf '%04x' "$$")"
    export MYBLOG_VERIFY_RUN_ID
  fi
  echo "${REPO_ROOT}/artifacts/verify-myblog/${MYBLOG_VERIFY_RUN_ID}"
}

myblog_state_file() {
  echo "$(myblog_run_dir)/state.env"
}

myblog_artifacts_dir() {
  echo "$(myblog_run_dir)/evidence"
}

myblog_persist_dir() {
  echo "$(myblog_run_dir)/persist"
}

myblog_load_state() {
  local f
  f="$(myblog_state_file)"
  if [[ ! -f "$f" ]]; then
    echo "No verification state at $f (run launch first)." >&2
    return 1
  fi
  # shellcheck disable=SC1090
  source "$f"
}

myblog_save_state() {
  local f
  f="$(myblog_state_file)"
  mkdir -p "$(dirname "$f")"
  cat >"$f" <<EOF
MYBLOG_VERIFY_RUN_ID=${MYBLOG_VERIFY_RUN_ID}
MYBLOG_PERSIST_STATE=${MYBLOG_PERSIST_STATE}
MYBLOG_WEB_PORT=${MYBLOG_WEB_PORT}
MYBLOG_ADMIN_PORT=${MYBLOG_ADMIN_PORT}
MYBLOG_WEB_TMUX=${MYBLOG_WEB_TMUX}
MYBLOG_ADMIN_TMUX=${MYBLOG_ADMIN_TMUX}
MYBLOG_ADMIN_DEV_VARS_BACKUP=${MYBLOG_ADMIN_DEV_VARS_BACKUP:-}
EOF
}

myblog_wait_http() {
  local url="$1"
  local want="${2:-200}"
  local tries="${3:-30}"
  local i code
  for i in $(seq 1 "$tries"); do
    code="$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo 000)"
    if [[ "$code" == "$want" ]]; then
      return 0
    fi
    sleep 1
  done
  echo "Timed out waiting for $url (last status $code, want $want)." >&2
  return 1
}

myblog_access_jwt() {
  cat "${SKILL_DIR}/fixtures/local-access-jwt.txt"
}
