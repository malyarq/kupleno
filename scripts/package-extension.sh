#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
SOURCE="$ROOT/extension"

runtime_files() {
  cat <<'EOF'
README.md
app.css
app.html
app.js
fonts/golos-regular.ttf
fonts/golos-bold.ttf
fonts/OFL.txt
analytics-core.js
analytics-utils.js
background.js
categories.js
category-rules.json
collect-job-store.js
collect-result-store.js
content.js
csv.js
icons/icon-16.png
icons/icon-32.png
icons/icon-48.png
icons/icon-128.png
intelligence.js
lifecycle.js
manifest.json
preferences.js
privacy.js
report-quality.js
source-health.js
storage.js
update.js
vendor/pdf.mjs
vendor/pdf.worker.mjs
EOF
}

case "${1:-}" in
  --list)
    runtime_files
    exit 0
    ;;
esac

if [ "$#" -gt 1 ]; then
  printf 'Usage: %s [output.zip]\n' "$0" >&2
  exit 2
fi

OUTPUT=${1:-"$ROOT/dist/kupleno-extension.zip"}
case "$OUTPUT" in
  [A-Za-z]:[\\/]*) OUTPUT=$(cygpath -u "$OUTPUT") ;;
  /*) ;;
  *) OUTPUT="$ROOT/$OUTPUT" ;;
esac
if [ "$OUTPUT" = "$ROOT/kupleno-extension.zip" ]; then
  printf 'Refusing ambiguous root archive. Use dist/kupleno-extension.zip or another explicit path.\n' >&2
  exit 2
fi

OUTPUT_DIR=$(dirname -- "$OUTPUT")
ARCHIVE_NAME=$(basename -- "$OUTPUT")
SUMS="$OUTPUT_DIR/SHA256SUMS"
PROVENANCE="$OUTPUT_DIR/provenance.txt"
EVIDENCE="$OUTPUT_DIR/release-evidence.json"
stage=$(mktemp -d "${TMPDIR:-/tmp}/kupleno-package.XXXXXX")
trap 'rm -rf "$stage"' EXIT HUP INT TERM
package="$stage/package"
archive="$stage/$ARCHIVE_NAME"
file_list="$stage/files.txt"

mkdir -p "$package" "$OUTPUT_DIR"

runtime_files | while IFS= read -r relative; do
  if [ ! -f "$SOURCE/$relative" ]; then
    printf 'Missing runtime file: %s\n' "$relative" >&2
    exit 1
  fi
  mkdir -p "$(dirname -- "$package/$relative")"
  cp "$SOURCE/$relative" "$package/$relative"
done

for relative in CHANGELOG.md LICENSE PRIVACY.md SECURITY.md SUPPORT.md THIRD_PARTY_NOTICES.md LICENSES/Apache-2.0.txt; do
  if [ ! -f "$ROOT/$relative" ]; then
    printf 'Missing release file: %s\n' "$relative" >&2
    exit 1
  fi
  mkdir -p "$(dirname -- "$package/$relative")"
  cp "$ROOT/$relative" "$package/$relative"
done

# ZIP stores mtimes and permissions. Normalize both so two builds from the
# same source tree produce byte-identical archives.
find "$package" -type d -exec chmod 0755 {} \;
find "$package" -type f -exec chmod 0644 {} \;
find "$package" -exec touch -t 198001010000 {} \;

{
  runtime_files
  printf '%s\n' CHANGELOG.md LICENSE PRIVACY.md SECURITY.md SUPPORT.md THIRD_PARTY_NOTICES.md LICENSES/Apache-2.0.txt
} > "$file_list"

(
  cd "$package"
  zip -q -X "$archive" -@ < "$file_list"
)

unzip -tq "$archive"
if unzip -Z1 "$archive" | grep -Eq '(^|/).*\.test\.js$'; then
  printf 'Package unexpectedly contains tests.\n' >&2
  exit 1
fi
if [ "$(unzip -Z1 "$archive" | grep -c '^manifest.json$')" -ne 1 ]; then
  printf 'Package must contain one manifest.json at its root.\n' >&2
  exit 1
fi

checksum=$(shasum -a 256 "$archive" | awk '{print $1}')
version=$(node -e 'const fs = require("fs"); process.stdout.write(JSON.parse(fs.readFileSync(process.argv[1], "utf8")).version)' "$SOURCE/manifest.json")
commit=$(git -C "$ROOT" rev-parse HEAD)
dirty=false
if [ -n "$(git -C "$ROOT" status --porcelain --untracked-files=all)" ]; then
  dirty=true
fi
expected_tag="v$version"
tag_matches_head=false
if git -C "$ROOT" rev-parse --verify --quiet "refs/tags/$expected_tag^{commit}" >/dev/null; then
  if [ "$(git -C "$ROOT" rev-parse "refs/tags/$expected_tag^{commit}")" = "$commit" ]; then
    tag_matches_head=true
  fi
fi

mv -f "$archive" "$OUTPUT"
printf '%s  %s\n' "$checksum" "$ARCHIVE_NAME" > "$SUMS"
{
  printf 'archive=%s\n' "$ARCHIVE_NAME"
  printf 'sha256=%s\n' "$checksum"
  printf 'version=%s\n' "$version"
  printf 'git_commit=%s\n' "$commit"
  printf 'git_dirty=%s\n' "$dirty"
  printf 'expected_tag=%s\n' "$expected_tag"
  printf 'tag_matches_head=%s\n' "$tag_matches_head"
} > "$PROVENANCE"
node "$ROOT/scripts/release-evidence.js" write "$EVIDENCE" "$OUTPUT" "$version" "$commit" "$dirty" "$expected_tag" "$tag_matches_head"

printf 'Created %s\n' "$OUTPUT"
printf 'SHA-256: %s\n' "$checksum"
printf 'Checksums: %s\n' "$SUMS"
printf 'Provenance: %s\n' "$PROVENANCE"
printf 'Evidence: %s\n' "$EVIDENCE"
