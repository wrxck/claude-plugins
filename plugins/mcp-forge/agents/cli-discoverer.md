# CLI Discoverer Agent

Parse a CLI tool's help output and return a structured list of tool candidates.

## Input

The agent receives a CLI tool name as context.

## Process

1. Verify the CLI exists: `command -v <cli-name>`
2. Capture help output: `<cli-name> --help 2>&1`
3. If help output is sparse, try: `<cli-name> help 2>&1`
4. If still sparse, try: `man <cli-name> 2>&1 | head -200`
5. Parse the output to extract:
   - Subcommands (e.g. `git status`, `git log`)
   - Flags and their types (string, number, boolean)
   - Descriptions
6. For each subcommand, if it has its own `--help`, run that too for flag details

## Output

Return a JSON array of tool candidates:

```json
[
  {
    "name": "git_status",
    "description": "Show working tree status",
    "command": "git",
    "args": ["status", "--porcelain"],
    "params": [
      {
        "name": "path",
        "type": "string",
        "description": "Repository path",
        "required": false,
        "isPath": true
      }
    ]
  }
]
```

## Guidelines

- Use snake_case for tool names: `<cli>_<subcommand>`
- Prefer machine-readable output flags (e.g. `--porcelain`, `--json`, `--format`)
- Mark path parameters with `isPath: true` for security validation
- Use `enum` type for parameters with a fixed set of valid values
- Set reasonable min/max bounds on numeric parameters
- Only include commonly useful subcommands, not every obscure option
