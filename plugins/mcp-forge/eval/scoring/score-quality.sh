#!/bin/bash
# score code quality of a generated MCP server project
# usage: score-quality.sh <project-dir>
# outputs: JSON with score and checks

dir="${1:-.}"
score=0
checks=()

# strict ts compiles (+30)
if [ -f "$dir/tsconfig.json" ]; then
  if grep -q '"strict": true' "$dir/tsconfig.json"; then
    score=$((score + 30))
    checks+=("{\"check\":\"strict typescript\",\"pass\":true}")
  else
    checks+=("{\"check\":\"strict typescript\",\"pass\":false}")
  fi
else
  checks+=("{\"check\":\"strict typescript\",\"pass\":false,\"reason\":\"no tsconfig.json\"}")
fi

# has README (+10)
if [ -f "$dir/README.md" ]; then
  score=$((score + 10))
  checks+=("{\"check\":\"readme\",\"pass\":true}")
else
  checks+=("{\"check\":\"readme\",\"pass\":false}")
fi

# has .gitignore (+5)
if [ -f "$dir/.gitignore" ]; then
  score=$((score + 5))
  checks+=("{\"check\":\"gitignore\",\"pass\":true}")
else
  checks+=("{\"check\":\"gitignore\",\"pass\":false}")
fi

# has dockerfile (+10)
if [ -f "$dir/Dockerfile" ]; then
  score=$((score + 10))
  checks+=("{\"check\":\"dockerfile\",\"pass\":true}")
else
  checks+=("{\"check\":\"dockerfile\",\"pass\":false}")
fi

# error handling (+15)
error_handling=$(grep -rn 'catch\|isError' "$dir/src" --include='*.ts' | grep -v 'node_modules' | grep -v '__tests__' | wc -l)
if [ "$error_handling" -gt 0 ]; then
  score=$((score + 15))
  checks+=("{\"check\":\"error handling\",\"pass\":true}")
else
  checks+=("{\"check\":\"error handling\",\"pass\":false}")
fi

# graceful shutdown (+10)
if grep -rq 'SIGINT\|SIGTERM' "$dir/src" --include='*.ts'; then
  score=$((score + 10))
  checks+=("{\"check\":\"graceful shutdown\",\"pass\":true}")
else
  checks+=("{\"check\":\"graceful shutdown\",\"pass\":false}")
fi

# correct structure (+20)
has_structure=true
[ ! -d "$dir/src/tools" ] && has_structure=false
[ ! -d "$dir/src/lib" ] && has_structure=false
[ ! -f "$dir/src/index.ts" ] && has_structure=false
if $has_structure; then
  score=$((score + 20))
  checks+=("{\"check\":\"project structure\",\"pass\":true}")
else
  checks+=("{\"check\":\"project structure\",\"pass\":false}")
fi

checks_json=$(printf '%s,' "${checks[@]}" | sed 's/,$//')
echo "{\"score\":$score,\"checks\":[${checks_json}]}"
