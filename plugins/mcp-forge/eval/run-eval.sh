#!/bin/bash
# run mcp-forge eval suite
# usage: run-eval.sh [task-name]

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
forge_dir="$(dirname "$script_dir")"
tasks_dir="$script_dir/tasks"
scoring_dir="$script_dir/scoring"
results_dir="$script_dir/results"

mkdir -p "$results_dir"

tasks=("git-server" "docker-server" "ffmpeg-server")
if [ -n "${1:-}" ]; then
  tasks=("$1")
fi

all_results=()

for task in "${tasks[@]}"; do
  echo "=== evaluating: $task ==="
  task_file="$tasks_dir/$task.md"
  if [ ! -f "$task_file" ]; then
    echo "task file not found: $task_file" >&2
    continue
  fi

  output_dir="$results_dir/$task"
  rm -rf "$output_dir"

  # generate with plugin
  config_file="$forge_dir/skills/mcp-forge/examples/${task%-server}-server.md"
  if [ -f "$config_file" ]; then
    echo "  generating with plugin..."

    # extract json config from example markdown
    config_json=$(sed -n '/^```json$/,/^```$/p' "$config_file" | sed '1d;$d')

    if [ -n "$config_json" ]; then
      echo "$config_json" | npx tsx "$forge_dir/generator/src/index.ts" "$output_dir" 2>/dev/null
    fi
  fi

  if [ ! -d "$output_dir" ]; then
    echo "  generation failed, skipping" >&2
    continue
  fi

  # score
  echo "  scoring security..."
  security=$(bash "$scoring_dir/score-security.sh" "$output_dir")

  echo "  scoring quality..."
  quality=$(bash "$scoring_dir/score-quality.sh" "$output_dir")

  result="{\"task\":\"$task\",\"security\":$security,\"quality\":$quality}"
  all_results+=("$result")

  echo "$result" > "$results_dir/$task.json"
  echo "  done: $results_dir/$task.json"
done

# aggregate
results_json=$(printf '%s,' "${all_results[@]}" | sed 's/,$//')
echo "[${results_json}]" > "$results_dir/summary.json"
echo ""
echo "=== results written to $results_dir/summary.json ==="
