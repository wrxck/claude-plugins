#!/bin/bash
# enhance generated MCP server tool files with LLM
# usage: enhance-with-llm.sh <project-dir> <cli-name>
# requires: claude CLI (npx @anthropic-ai/claude-code)

set -euo pipefail

project_dir="${1:?usage: enhance-with-llm.sh <project-dir> <cli-name>}"
cli_name="${2:?usage: enhance-with-llm.sh <project-dir> <cli-name>}"

if [ ! -d "$project_dir/src/tools" ]; then
  echo "error: no src/tools directory in $project_dir" >&2
  exit 1
fi

# collect tool files (excluding tests)
tool_files=()
for f in "$project_dir"/src/tools/*.ts; do
  [ -f "$f" ] || continue
  tool_files+=("$f")
done

if [ ${#tool_files[@]} -eq 0 ]; then
  echo "error: no tool files found in $project_dir/src/tools/" >&2
  exit 1
fi

# build file listing for context
tool_listing=""
for f in "${tool_files[@]}"; do
  basename=$(basename "$f")
  tool_listing="$tool_listing- src/tools/$basename
"
done

prompt="You are enhancing an auto-generated MCP server that wraps the '$cli_name' CLI.

The project uses these security helpers from src/lib/security.ts:
- safeExec(command, args, options?) — executes whitelisted commands via execFile (no shell)
- safePath(userPath, basePath?) — prevents directory traversal
- checkRateLimit(toolName, limit?) — sliding window rate limiter
- ALLOWED_COMMANDS — Set of whitelisted command names

The generated tool files are boilerplate scaffolds. Enhance them by:

1. **Flag mapping**: Map tool parameters to correct CLI flags. Boolean params should use --flag (present/absent), not --flag=true. String/enum params should use --param value format. Check that flag names match actual $cli_name CLI flags.

2. **Output parsing**: Where $cli_name outputs structured data (JSON, tabular), parse it into structured MCP responses instead of returning raw stdout. Use JSON.parse() where the CLI supports --format=json or similar.

3. **Zod schema tightening**: Add .min()/.max() constraints for numbers, .regex() for strings where appropriate, .describe() with helpful descriptions. Use z.enum() for params with known valid values.

4. **Error messages**: Make error responses actionable — include what went wrong and how to fix it.

5. **IMPORTANT — preserve all security layers**:
   - Keep safeExec() for all command execution (never use exec/execSync)
   - Keep safePath() for all path parameters
   - Keep checkRateLimit() calls
   - Keep ALLOWED_COMMANDS whitelist
   - Do NOT import child_process directly

Tool files to enhance:
${tool_listing}
Read each tool file in src/tools/ (not __tests__/), enhance it, and write it back. Do NOT modify src/lib/, src/index.ts, or any test files."

echo "  invoking claude for LLM enhancement..."
npx @anthropic-ai/claude-code \
  -p "$prompt" \
  --allowedTools "Edit,Read,Bash" \
  --cwd "$project_dir" \
  --max-turns 20 \
  > /dev/null 2>&1

echo "  LLM enhancement complete"
