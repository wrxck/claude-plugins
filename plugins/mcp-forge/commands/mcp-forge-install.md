# /mcp-forge:install

Register a generated MCP server with Claude Code.

## Usage

```
/mcp-forge:install [path]
```

If `path` is omitted, use the current directory.

## Flow

1. Verify the path contains a built MCP server (check for `dist/index.js`)

2. If not built, run `npm run build` first

3. Detect the Claude CLI location using `${CLAUDE_PLUGIN_ROOT}/scripts/detect-claude.sh`

4. Read the project's `package.json` to get the server name

5. Generate and run the registration command:

```bash
<claude-path> mcp add <server-name> node <absolute-path>/dist/index.js
```

6. Confirm registration was successful

7. Print usage instructions:

```
Server registered. You can now use it in Claude Code:
  claude mcp list          # verify registration
  claude mcp remove <name> # to unregister
```
