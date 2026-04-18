# /mcp-forge

Scaffold a hardened MCP server wrapping a CLI tool or API.

## Usage

```
/mcp-forge <target>
```

Where `<target>` is a CLI command name (e.g. `git`, `docker`, `ffmpeg`) or an API name.

## Flow

### 1. Ask what we're wrapping

Ask the user: "What are you wrapping?"

Options:
- **CLI tool** -- a local command-line tool (git, docker, ffmpeg, etc.)
- **HTTP API** -- a remote API with documentation or an OpenAPI/Swagger spec
- **Hybrid** -- a CLI tool that also has an API

### 2. Discovery chain

Depending on the source type, follow this chain to discover available tools/endpoints:

#### For APIs (or hybrid API part):

1. **OpenAPI/Swagger spec** -- Ask if they have an OpenAPI spec URL or file path. If yes:
   - Fetch/read the spec
   - Parse it using the generator's OpenAPI parser (read `${CLAUDE_PLUGIN_ROOT}/generator/src/openapi.ts` for the parser interface)
   - Extract all endpoints as tool candidates

2. **Documentation URL** -- If no spec, ask if there's online documentation. If yes:
   - Fetch the docs URL
   - Extract endpoints, methods, and parameters from the documentation

3. **Manual** -- If neither, ask the user to describe the API endpoints they want to wrap

#### For CLI tools (or hybrid CLI part):

1. Run `command -v <target>` to verify the CLI exists
2. Run `<target> --help` and parse the output for subcommands
3. If `--help` is sparse, try `man <target>` for more detail
4. Extract subcommands, flags, and descriptions into tool candidates

### 3. Tool/endpoint selection

Present discovered tools to the user for selection:

- **10 or fewer**: List them and ask the user to pick which ones to include
- **More than 10**: Write them to a temp file and open `$EDITOR` (defaulting to `nano`). The file format is tab-separated: `METHOD\tPATH\tDESCRIPTION`. Lines starting with `#` or deleted lines are excluded. Wait for the user to save and close, then parse the remaining lines.

Use `${CLAUDE_PLUGIN_ROOT}/generator/src/openapi.ts` functions `formatEndpointList()` and `parseEndpointSelection()` for the file format.

### 4. Configuration

Ask the user for:
- **Project name** (default: `mcp-<target>`)
- **Output directory** (default: `./<project-name>`)
- **Include Docker support?** (Dockerfile + docker-compose.yml)
- **Include systemd service?** (for server deployment)
- **Port** (default: 3100, only if Docker)

### 5. Generate config and run generator

Build a `ForgeConfig` JSON object (see `${CLAUDE_PLUGIN_ROOT}/generator/src/config.ts` for the schema) and pipe it to the generator:

```bash
echo '<config-json>' | npx tsx ${CLAUDE_PLUGIN_ROOT}/generator/src/index.ts <output-dir>
```

The generator writes all boilerplate files and outputs a manifest JSON to stdout.

### 6. Enhance tool implementations

Read the generated tool files in `<output-dir>/src/tools/`. For each tool:
- Review the generated boilerplate
- Add specific CLI argument mapping, output parsing, or API call logic
- Ensure Zod schemas have proper constraints (enums, patterns, bounds)
- Add any tool-specific error handling

Read `${CLAUDE_PLUGIN_ROOT}/skills/mcp-forge/references/security-checklist.md` for security patterns to follow during enhancement.

### 7. Install, build, and test

```bash
cd <output-dir>
npm install
npm run build
npm test
```

Report results to the user. If tests fail, fix and retry.

## References

- `${CLAUDE_PLUGIN_ROOT}/skills/mcp-forge/references/mcp-sdk-patterns.md` -- MCP SDK API
- `${CLAUDE_PLUGIN_ROOT}/skills/mcp-forge/references/security-checklist.md` -- Security layers
- `${CLAUDE_PLUGIN_ROOT}/skills/mcp-forge/examples/` -- Worked examples
