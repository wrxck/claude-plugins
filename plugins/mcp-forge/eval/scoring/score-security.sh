#!/bin/bash
# score security patterns in a generated MCP server project
# usage: score-security.sh <project-dir>
# outputs: JSON with score and findings

dir="${1:-.}"
score=100
findings=()

# check for exec/execSync with strings (-50 each)
count=$(grep -rn 'exec(' "$dir/src" --include='*.ts' | grep -v 'execFile' | grep -v 'node_modules' | grep -v '__tests__' | wc -l)
if [ "$count" -gt 0 ]; then
  score=$((score - count * 50))
  findings+=("{\"severity\":\"critical\",\"finding\":\"exec() with string found\",\"count\":$count}")
fi

count=$(grep -rn 'execSync(' "$dir/src" --include='*.ts' | grep -v 'execFileSync' | grep -v 'node_modules' | grep -v '__tests__' | wc -l)
if [ "$count" -gt 0 ]; then
  score=$((score - count * 50))
  findings+=("{\"severity\":\"critical\",\"finding\":\"execSync() with string found\",\"count\":$count}")
fi

# check for execFile usage (+25)
has_execfile=$(grep -rn 'execFile' "$dir/src" --include='*.ts' | grep -v 'node_modules' | grep -v '__tests__' | wc -l)
if [ "$has_execfile" -eq 0 ]; then
  score=$((score - 25))
  findings+=("{\"severity\":\"high\",\"finding\":\"no execFile usage found\"}")
fi

# check for zod validation (+25)
tool_count=$(grep -rn 'registerTool\|server\.tool' "$dir/src" --include='*.ts' | grep -v 'node_modules' | grep -v '__tests__' | wc -l)
zod_count=$(grep -rn 'z\.\(string\|number\|boolean\|enum\)' "$dir/src" --include='*.ts' | grep -v 'node_modules' | grep -v '__tests__' | wc -l)
if [ "$zod_count" -eq 0 ] && [ "$tool_count" -gt 0 ]; then
  score=$((score - 25))
  findings+=("{\"severity\":\"high\",\"finding\":\"no zod validation found\"}")
fi

# check for path validation (+25)
has_path_check=$(grep -rn 'startsWith\|safePath\|path\.resolve' "$dir/src" --include='*.ts' | grep -v 'node_modules' | grep -v '__tests__' | wc -l)
if [ "$has_path_check" -eq 0 ]; then
  score=$((score - 25))
  findings+=("{\"severity\":\"high\",\"finding\":\"no path validation found\"}")
fi

# check for rate limiting (+15)
has_rate_limit=$(grep -rn 'rateLimit\|rateLimi\|checkRateLimit' "$dir/src" --include='*.ts' | grep -v 'node_modules' | grep -v '__tests__' | wc -l)
if [ "$has_rate_limit" -eq 0 ]; then
  score=$((score - 15))
  findings+=("{\"severity\":\"medium\",\"finding\":\"no rate limiting found\"}")
fi

# check for structured logging (+10)
has_logging=$(grep -rn 'process\.stderr\.write\|logger\|log(' "$dir/src" --include='*.ts' | grep -v 'node_modules' | grep -v '__tests__' | wc -l)
if [ "$has_logging" -eq 0 ]; then
  score=$((score - 10))
  findings+=("{\"severity\":\"low\",\"finding\":\"no structured logging found\"}")
fi

# clamp
[ "$score" -lt 0 ] && score=0

# output
findings_json=$(printf '%s,' "${findings[@]}" | sed 's/,$//')
echo "{\"score\":$score,\"findings\":[${findings_json}]}"
