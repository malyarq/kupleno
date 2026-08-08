#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TAG=${1:-}

if [ -z "$TAG" ]; then
  printf 'Usage: npm run verify:release -- vX.Y.Z\n' >&2
  exit 2
fi

version=$(node -e 'const fs=require("fs"); process.stdout.write(JSON.parse(fs.readFileSync(process.argv[1], "utf8")).version)' "$ROOT/extension/manifest.json")
package_version=$(node -e 'const fs=require("fs"); process.stdout.write(JSON.parse(fs.readFileSync(process.argv[1], "utf8")).version)' "$ROOT/package.json")

test "$TAG" = "v$version"
test "$package_version" = "$version"
node -e 'if (!/^v\d+\.\d+\.\d+$/.test(process.argv[1])) process.exit(1)' "$TAG"
test -z "$(git -C "$ROOT" status --porcelain --untracked-files=all)"
git -C "$ROOT" rev-parse --verify --quiet "refs/tags/$TAG^{commit}" >/dev/null
test "$(git -C "$ROOT" cat-file -t "refs/tags/$TAG")" = tag
test "$(git -C "$ROOT" rev-parse "refs/tags/$TAG^{commit}")" = "$(git -C "$ROOT" rev-parse HEAD)"
grep -Fq "## $version" "$ROOT/CHANGELOG.md"

npm --prefix "$ROOT" run verify
npm --prefix "$ROOT" run verify:reproducible

grep -Fq "git_dirty=false" "$ROOT/dist/provenance.txt"
grep -Fq "expected_tag=$TAG" "$ROOT/dist/provenance.txt"
grep -Fq "tag_matches_head=true" "$ROOT/dist/provenance.txt"
node "$ROOT/scripts/release-evidence.js" verify "$ROOT/dist/release-evidence.json" "$ROOT/dist/kupleno-extension.zip"

printf 'release candidate %s: ok\n' "$TAG"
