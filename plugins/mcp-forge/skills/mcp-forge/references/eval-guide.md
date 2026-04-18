# Eval Framework Guide

## Overview

The eval framework measures mcp-forge's output quality across three dimensions: security, functionality, and code quality. It can compare plugin-assisted generation against baseline (no plugin) generation.

## Running Evals

```bash
# run all tasks
bash eval/run-eval.sh

# run a single task
bash eval/run-eval.sh git-server
```

## Scoring

### Security (0-100)

Checks for:
- `execFile` usage vs `exec` with strings
- Zod validation on tool parameters
- Path traversal protection
- Rate limiting
- Structured logging

Scoring: start at 100, subtract for missing patterns. Critical violations (exec with strings) subtract 50 each.

### Functionality (0-100)

Checks for:
- `npm install` succeeds (20 points)
- TypeScript compiles (30 points)
- Tests pass (30 points)
- Server starts (20 points)

### Quality (0-100)

Checks for:
- Strict TypeScript (30 points)
- README (10 points)
- .gitignore (5 points)
- Dockerfile (10 points)
- Error handling (15 points)
- Graceful shutdown (10 points)
- Correct project structure (20 points)

## Chart Generation

After running evals, generate a comparison chart:

```bash
bash eval/charts/generate-charts.sh
```

Outputs `eval/results/comparison.svg` using Vega-Lite.

## Adding New Tasks

1. Create a task prompt in `eval/tasks/<name>.md`
2. Optionally add a config example in `skills/mcp-forge/examples/<name>.md`
3. Run `bash eval/run-eval.sh <name>`
