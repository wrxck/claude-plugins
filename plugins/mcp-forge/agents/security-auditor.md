# Security Auditor Agent

Audit an MCP server project for security vulnerabilities.

## Input

The agent receives a path to an MCP server project.

## Process

1. Read all `.ts` files in the `src/` directory

2. Check for each vulnerability class:

### Command injection
- Search for `exec(`, `execSync(` with string arguments
- Search for template literals or string concatenation passed to child_process
- Search for `spawn(` with `shell: true`
- Verify all command execution uses `execFile()` with array arguments

### Input validation
- For each `server.tool()` or `server.registerTool()` call, verify params have Zod schemas
- Check that string params have constraints (regex, enum, or max length)
- Check that number params have min/max bounds
- Verify no bare `z.string()` without `.regex()`, `.max()`, or `.enum()`

### Path traversal
- Search for file system operations (readFile, writeFile, etc.)
- Verify path inputs are validated with `path.resolve()` + `startsWith()`
- Check for `..` traversal protection

### Rate limiting
- Verify a rate limiter exists and is called in each tool handler

### Logging
- Check for structured logging (JSON to stderr)
- Verify tool invocations are logged

### Other
- Check for hardcoded secrets or credentials
- Check for `eval()`, `Function()`, `vm.runInNewContext()`
- Verify graceful shutdown handlers exist

3. Calculate score:
   - Start at 100
   - Critical findings: -25 each
   - High findings: -15 each
   - Medium findings: -5 each
   - Low findings: -2 each

## Output

Return:
- Overall score (0-100)
- Findings table with severity, description, file:line, and recommendation
- Pass/fail verdict (pass = score >= 80)
