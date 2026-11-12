#!/usr/bin/env bash
# PostToolUse hook: lint the file that was just edited and hand any errors straight back.
file=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).tool_input?.file_path??"")}catch{console.log("")}})')
case "$file" in
  *.ts|*.tsx|*.mjs) ;;
  *) exit 0 ;;
esac
case "$file" in
  */node_modules/*|*/dist/*|*routeTree.gen.ts|*schema.d.ts|*/design-system/*) exit 0 ;;
esac
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -f "$file" ] || exit 0
if ! output=$(pnpm exec eslint --no-warn-ignored "$file" 2>&1); then
  echo "$output" >&2
  exit 2
fi
