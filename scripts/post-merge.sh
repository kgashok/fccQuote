#!/bin/bash
set -euo pipefail
pnpm install --frozen-lockfile
# Quote history uses the existing JSON store. No PostgreSQL schema migration
# is needed for this app; do not push the unused template schema on merges.
