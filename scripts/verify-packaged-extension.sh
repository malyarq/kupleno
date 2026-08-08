#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
ARCHIVE=${1:-"$ROOT/dist/kupleno-extension.zip"}
case "$ARCHIVE" in
  /*) ;;
  *) ARCHIVE="$ROOT/$ARCHIVE" ;;
esac

if [ ! -f "$ARCHIVE" ]; then
  printf 'Packaged extension not found: %s\n' "$ARCHIVE" >&2
  exit 1
fi

stage=$(mktemp -d "${TMPDIR:-/tmp}/kupleno-packaged-smoke.XXXXXX")
trap 'rm -rf "$stage"' EXIT HUP INT TERM

mkdir -p "$stage/extension"
unzip -q "$ARCHIVE" -d "$stage/extension"
npm --prefix "$ROOT" run verify:browser -- "$stage/extension"
