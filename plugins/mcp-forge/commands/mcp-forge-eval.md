# /mcp-forge:eval

Run the mcp-forge evaluation suite.

## Usage

```
/mcp-forge:eval [task-name]
```

If `task-name` is omitted, runs all tasks (git-server, docker-server, ffmpeg-server).

## Flow

1. Run the eval script:
   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/eval/run-eval.sh [task-name]
   ```

2. Parse the results from `eval/results/summary.json`

3. Present a results table:

   | Task | Security | Quality |
   |------|----------|---------|
   | git-server | 100 | 100 |
   | docker-server | 100 | 95 |
   | ffmpeg-server | 100 | 100 |

4. Optionally generate a chart:
   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/eval/charts/generate-charts.sh
   ```

## References

- `${CLAUDE_PLUGIN_ROOT}/skills/mcp-forge/references/eval-guide.md` -- Full eval framework documentation
