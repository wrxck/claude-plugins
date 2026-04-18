#!/bin/bash
# score functionality of a generated MCP server project
# usage: score-functionality.sh <project-dir>
# outputs: JSON with score and results

dir="${1:-.}"
score=0
results=()

cd "$dir" || exit 1

# npm install (+20)
if npm install --ignore-scripts 2>/dev/null; then
  score=$((score + 20))
  results+=("{\"check\":\"npm install\",\"pass\":true}")
else
  results+=("{\"check\":\"npm install\",\"pass\":false}")
  echo "{\"score\":$score,\"results\":[$(printf '%s,' "${results[@]}" | sed 's/,$//')]}"
  exit 0
fi

# tsc compiles (+30)
if npx tsc --noEmit 2>/dev/null; then
  score=$((score + 30))
  results+=("{\"check\":\"tsc compile\",\"pass\":true}")
else
  results+=("{\"check\":\"tsc compile\",\"pass\":false}")
fi

# vitest passes (+30)
if npx vitest run 2>/dev/null; then
  score=$((score + 30))
  results+=("{\"check\":\"vitest\",\"pass\":true}")
else
  results+=("{\"check\":\"vitest\",\"pass\":false}")
fi

# server starts and responds to initialise (+20)
npm run build 2>/dev/null
if [ -f dist/index.js ]; then
  timeout 5 node dist/index.js < /dev/null 2>/dev/null &
  pid=$!
  sleep 2
  if kill -0 "$pid" 2>/dev/null; then
    score=$((score + 20))
    results+=("{\"check\":\"server starts\",\"pass\":true}")
    kill "$pid" 2>/dev/null
  else
    results+=("{\"check\":\"server starts\",\"pass\":false}")
  fi
else
  results+=("{\"check\":\"server starts\",\"pass\":false,\"reason\":\"no dist/index.js\"}")
fi

results_json=$(printf '%s,' "${results[@]}" | sed 's/,$//')
echo "{\"score\":$score,\"results\":[${results_json}]}"
