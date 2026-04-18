# Template Index

Templates are located at `${CLAUDE_PLUGIN_ROOT}/skills/mcp-forge/templates/`.

## Template Selection

| Template | File | Always | Condition |
|----------|------|--------|-----------|
| package.json | `package-json.md` | Yes | -- |
| tsconfig.json | `tsconfig-json.md` | Yes | -- |
| .gitignore | `gitignore.md` | Yes | -- |
| Server entry | `server-entry.md` | Yes | -- |
| Security module | `security-module.md` | Yes | -- |
| Logger module | `logger-module.md` | Yes | -- |
| Tool module | `tool-module.md` | Yes | One per tool |
| Test module | `test-module.md` | Yes | One per tool |
| Vitest config | `vitest-config.md` | Yes | -- |
| Health module | `health-module.md` | Yes | -- |
| README | `readme-template.md` | Yes | -- |
| Dockerfile | `dockerfile.md` | No | User opts in to Docker |
| docker-compose | `docker-compose.md` | No | User opts in to Docker |
| systemd service | `systemd-service.md` | No | User opts in to systemd |

## Placeholder Conventions

All templates use `${PLACEHOLDER}` syntax. Standard placeholders:

| Placeholder | Source | Example |
|-------------|--------|---------|
| `${PROJECT_NAME}` | User input | `mcp-git` |
| `${SERVER_NAME}` | Derived from project name | `mcp-git` |
| `${CLI_NAME}` | CLI being wrapped | `git` |
| `${CLI_DESCRIPTION}` | From CLI help | `Distributed version control` |
| `${PORT}` | User input or default 3100 | `3100` |
| `${TOOL_NAME}` | From discovered tool | `git_status` |
| `${TOOL_DESCRIPTION}` | From discovered tool | `Show working tree status` |
| `${TOOL_PARAMS}` | Generated Zod schema | `{ path: z.string() }` |
| `${TOOL_ARGS}` | Generated arg array | `["status", "--porcelain"]` |
| `${TOOLS_IMPORT_LIST}` | Generated imports | `import { registerGitStatus } from "./tools/git-status.js"` |
| `${TOOLS_REGISTER_LIST}` | Generated registrations | `registerGitStatus(server);` |

## Generation Order

1. Read `template-index.md` (this file)
2. Read `security-checklist.md` and `mcp-sdk-patterns.md`
3. Generate `src/lib/security.ts` from `security-module.md`
4. Generate `src/lib/logger.ts` from `logger-module.md`
5. Generate `src/lib/health.ts` from `health-module.md`
6. For each tool: generate `src/tools/<name>.ts` from `tool-module.md`
7. For each tool: generate `src/tools/__tests__/<name>.test.ts` from `test-module.md`
8. Generate `src/index.ts` from `server-entry.md`
9. Generate `package.json` from `package-json.md`
10. Generate `tsconfig.json` from `tsconfig-json.md`
11. Generate `vitest.config.ts` from `vitest-config.md`
12. Generate `.gitignore` from `gitignore.md`
13. If Docker: generate `Dockerfile` from `dockerfile.md`
14. If Docker: generate `docker-compose.yml` from `docker-compose.md`
15. If systemd: generate `${PROJECT_NAME}.service` from `systemd-service.md`
16. Generate `README.md` from `readme-template.md`
