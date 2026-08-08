#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
OUTPUT=${1:-"$ROOT/dist/kupleno-extension.zip"}
case "$OUTPUT" in
  /*) ;;
  *) OUTPUT="$ROOT/$OUTPUT" ;;
esac

runtime_list=$(mktemp "${TMPDIR:-/tmp}/kupleno-runtime.XXXXXX")
trap 'rm -f "$runtime_list"' EXIT HUP INT TERM

sh -n "$ROOT/scripts/package-extension.sh"
sh -n "$ROOT/scripts/verify.sh"
sh -n "$ROOT/scripts/check-reproducible.sh"
sh -n "$ROOT/scripts/check-vendored-dependencies.sh"
sh -n "$ROOT/scripts/verify-release-candidate.sh"
sh -n "$ROOT/scripts/verify-packaged-extension.sh"

"$ROOT/scripts/check-vendored-dependencies.sh"
node "$ROOT/scripts/check-doc-links.js"

npm --prefix "$ROOT" run verify:categories
npm --prefix "$ROOT" run verify:performance

# Several legacy test files share an IndexedDB fixture, so keep all tests in
# the Node test runner but execute files serially for a stable release gate.
node --test --test-concurrency=1 "$ROOT"/extension/*.test.js

"$ROOT/scripts/package-extension.sh" --list > "$runtime_list"
while IFS= read -r relative; do
  case "$relative" in
    *.js|*.mjs) node --check "$ROOT/extension/$relative" ;;
  esac
done < "$runtime_list"

git -C "$ROOT" diff --check
git -C "$ROOT" diff --cached --check

"$ROOT/scripts/package-extension.sh" "$OUTPUT"
(
  cd "$(dirname -- "$OUTPUT")"
  shasum -a 256 -c SHA256SUMS
)
node "$ROOT/scripts/release-evidence.js" verify "$(dirname -- "$OUTPUT")/release-evidence.json" "$OUTPUT"
"$ROOT/scripts/verify-packaged-extension.sh" "$OUTPUT"

printf 'verify: ok\n'
