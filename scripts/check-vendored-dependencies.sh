#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
PDF="$ROOT/extension/vendor/pdf.mjs"
WORKER="$ROOT/extension/vendor/pdf.worker.mjs"

test "$(shasum -a 256 "$PDF" | awk '{print $1}')" = "0d29c4871eff0b72f3896825f2673ddf7dfbccf815a7095a5d14f5aa68fab0e5"
test "$(shasum -a 256 "$WORKER" | awk '{print $1}')" = "7fc442c268d107d656755252cf38c422a88e825b7f0caaac6a5f58364dff4179"
grep -q 'pdfjsVersion = 5.6.205' "$PDF"
grep -q 'pdfjsVersion = 5.6.205' "$WORKER"

printf 'vendored dependencies: ok\n'
