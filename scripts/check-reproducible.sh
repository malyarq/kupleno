#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
stage=$(mktemp -d "${TMPDIR:-/tmp}/markettrat-reproducible.XXXXXX")
trap 'rm -rf "$stage"' EXIT HUP INT TERM
first="$stage/first/markettrat-extension.zip"
second="$stage/second/markettrat-extension.zip"

"$ROOT/scripts/package-extension.sh" "$first" >/dev/null
"$ROOT/scripts/package-extension.sh" "$second" >/dev/null

first_sha=$(shasum -a 256 "$first" | awk '{print $1}')
second_sha=$(shasum -a 256 "$second" | awk '{print $1}')
if [ "$first_sha" != "$second_sha" ] || ! cmp -s "$first" "$second"; then
  printf 'Reproducibility check failed: %s != %s\n' "$first_sha" "$second_sha" >&2
  exit 1
fi

printf 'reproducible: %s\n' "$first_sha"
