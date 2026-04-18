# mcp-forge

Scaffold hardened MCP servers wrapping CLI tools.

## Routing

| Command | Action |
|---------|--------|
| `/mcp-forge <cli-name>` | Run the main scaffold generator |
| `/mcp-forge:audit [path]` | Security audit an MCP server project |
| `/mcp-forge:install [path]` | Register generated server with Claude Code |
| `/mcp-forge:eval` | Run benchmarks (dev only) |

## References

Load these on demand -- do not read all upfront:

- `${CLAUDE_PLUGIN_ROOT}/skills/mcp-forge/references/mcp-sdk-patterns.md` -- MCP SDK v1.27.x API
- `${CLAUDE_PLUGIN_ROOT}/skills/mcp-forge/references/security-checklist.md` -- Security layers
- `${CLAUDE_PLUGIN_ROOT}/skills/mcp-forge/references/template-index.md` -- Template map
- `${CLAUDE_PLUGIN_ROOT}/skills/mcp-forge/references/eval-guide.md` -- Eval framework

## Templates

Located at `${CLAUDE_PLUGIN_ROOT}/skills/mcp-forge/templates/`. Read `template-index.md` first, then load individual templates as needed during generation.

## Examples

Complete worked examples at `${CLAUDE_PLUGIN_ROOT}/skills/mcp-forge/examples/`.

## Agents

- **cli-discoverer** -- Parses CLI help/man output into structured tool list
- **scaffold-writer** -- Reads templates, generates project files
- **security-auditor** -- Audits MCP server code for vulnerabilities
