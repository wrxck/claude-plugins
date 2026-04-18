# mcp-forge

A Claude Code plugin that scaffolds hardened MCP servers wrapping CLI tools and APIs. Every generated server ships with four security layers baked in -- input validation, injection prevention, path safety, and rate limiting.

## The problem

43% of early MCP servers had command injection vulnerabilities. Developers reach for `exec()` with string interpolation, skip input validation, and leave path traversal wide open. mcp-forge eliminates these patterns by generating secure boilerplate programmatically, then letting Claude enhance the tool-specific logic.

## How it works

```
/mcp-forge git
```

1. **Discovery** -- asks what you're wrapping (CLI, API, or hybrid), then follows a chain: OpenAPI spec > documentation URL > CLI `--help` > manual description
2. **Selection** -- presents discovered tools/endpoints. For large APIs (10+), opens `$EDITOR` with a selectable list
3. **Configuration** -- project name, output directory, Docker/systemd support
4. **Generation** -- runs a TypeScript generator that emits a complete project: server entry, security module, logger, tool modules, tests, Dockerfile, README
5. **Enhancement** -- Claude reads the generated tool files and adds CLI-specific argument mapping, output parsing, and schema refinements
6. **Verification** -- `npm install && npm run build && npm test`

## Commands

| Command | Description |
|---------|-------------|
| `/mcp-forge <target>` | Scaffold a hardened MCP server |
| `/mcp-forge:audit [path]` | Security audit an existing MCP server |
| `/mcp-forge:install [path]` | Register a generated server with Claude Code |
| `/mcp-forge:eval [task]` | Run benchmark evaluation suite |

## Security layers

Every generated server includes:

| Layer | Implementation |
|-------|---------------|
| Input validation | Zod schemas with allowlists, regex patterns, and bounds on every parameter |
| Injection prevention | `execFile()` with argument arrays -- never `exec()` with string interpolation |
| Path safety | `path.resolve()` + `startsWith()` validation, directory traversal rejection |
| Rate limiting | Sliding window per-tool rate limiter |
| Structured logging | JSON to stderr with timestamps, tool names, and outcomes |
| Graceful shutdown | SIGINT/SIGTERM handlers with clean exit |

## Generated project structure

```
mcp-<target>/
  src/
    index.ts              # server bootstrap
    lib/
      security.ts         # execFile wrapper, path validator, rate limiter
      logger.ts           # structured JSON logging
      health.ts           # CLI availability check
    tools/
      <tool-name>.ts      # one module per tool
      __tests__/
        <tool-name>.test.ts
  package.json
  tsconfig.json           # strict mode
  vitest.config.ts
  Dockerfile              # multi-stage, non-root
  docker-compose.yml
  README.md
```

## Architecture

The plugin uses a programmatic TypeScript generator rather than markdown templates. Claude produces a config object, the generator emits all boilerplate files, and Claude enhances the tool implementations. This keeps context costs low -- roughly 500 tokens at rest versus 15K if everything were loaded upfront.

```
/mcp-forge <target>
  |
  +-- Discovery (OpenAPI > docs URL > CLI --help > manual)
  +-- Tool selection (inline or $EDITOR for 10+ endpoints)
  +-- Config generation (ForgeConfig JSON)
  +-- Programmatic scaffold (generator/src/index.ts)
  +-- Claude enhancement (tool-specific logic)
  +-- Verification (install, build, test)
```

## Eval framework

The eval suite scores generated servers on three axes:

| Metric | Max | What it measures |
|--------|-----|------------------|
| Security | 100 | execFile usage, Zod validation, path safety, rate limiting, logging |
| Functionality | 100 | npm install, tsc compile, vitest pass, server starts |
| Quality | 100 | Strict TS, README, Dockerfile, error handling, shutdown, structure |

```bash
bash eval/run-eval.sh           # run all tasks
bash eval/run-eval.sh git-server # run one task
bash eval/charts/generate-charts.sh # generate comparison SVG
```

## Installation

```bash
# add the plugin
claude plugin add wrxck/mcp-forge

# or from the marketplace
claude plugin marketplace add wrxck/claude-plugins
claude plugin install mcp-forge@wrxck-claude-plugins
```

## Licence

MIT
