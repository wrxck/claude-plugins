# /mcp-forge:audit

Security audit an existing MCP server project.

## Usage

```
/mcp-forge:audit [path]
```

If `path` is omitted, audit the current directory.

## Flow

1. Verify the path contains an MCP server project (look for `package.json` with `@modelcontextprotocol/sdk` dependency)

2. Spawn the `security-auditor` agent with the project path

3. The agent checks for:

### Critical (instant fail)
- `exec()` or `execSync()` with string arguments (command injection)
- Template literal or string concatenation in shell commands
- Missing input validation on any tool parameter
- `eval()`, `Function()`, or `vm.runInNewContext()` usage

### High severity
- Missing path traversal protection (`..` in paths not validated)
- No rate limiting
- Secrets/credentials in source code
- `child_process.spawn()` with `shell: true`

### Medium severity
- Missing structured logging
- No graceful shutdown handlers
- Missing error handling in tool callbacks
- Overly permissive Zod schemas (bare `z.string()` without constraints)

### Low severity
- Missing health check endpoint
- No TypeScript strict mode
- Missing tests
- No Dockerfile

4. Output a score (0-100) and findings table:

| Severity | Finding | File:Line | Recommendation |
|----------|---------|-----------|----------------|
| CRITICAL | `exec()` with string | src/tools/run.ts:15 | Use `execFile()` with args array |

5. Score calculation:
   - Start at 100
   - Critical: -25 each
   - High: -15 each
   - Medium: -5 each
   - Low: -2 each
   - Minimum: 0
