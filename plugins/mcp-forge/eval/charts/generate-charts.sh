#!/bin/bash
# generate svg chart from eval results
# requires: npx vl2svg (from vega-lite-cli)

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
results_dir="$script_dir/../results"

if [ ! -f "$results_dir/summary.json" ]; then
  echo "no summary.json found in $results_dir" >&2
  exit 1
fi

npx --yes vl2svg "$script_dir/chart-spec.json" "$results_dir/comparison.svg"
echo "wrote $results_dir/comparison.svg"
