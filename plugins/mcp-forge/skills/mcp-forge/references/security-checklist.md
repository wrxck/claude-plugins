# Security Checklist -- 4 Layers

Every generated MCP server must implement all four layers. 43% of early MCP servers had command injection vulnerabilities -- these layers prevent that.

## Layer 1: Input Validation

Every tool parameter gets a Zod schema with constraints. Never pass raw user input to commands.

```typescript
// GOOD -- allowlist enum
z.enum(["status", "log", "diff"]).describe("Git subcommand")

// GOOD -- constrained string
z.string().regex(/^[a-zA-Z0-9._-]+$/).describe("Branch name")

// GOOD -- bounded number
z.number().int().min(1).max(1000).default(100).describe("Line count")

// BAD -- unconstrained string passed to shell
z.string().describe("Command to run")
```

### Path Parameters

```typescript
z.string()
  .regex(/^[a-zA-Z0-9._\/-]+$/)
  .describe("File path (no special characters)")
```

## Layer 2: Injection Prevention

Never use `exec()` or `execSync()` with string commands. Always use `execFile()` or `execFileSync()` with argument arrays.

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// GOOD -- arguments as array, never interpolated into string
export async function safeExec(
  command: string,
  args: string[],
  options?: { cwd?: string; timeout?: number }
): Promise<string> {
  const { stdout, stderr } = await execFileAsync(command, args, {
    cwd: options?.cwd,
    timeout: options?.timeout ?? 30_000,
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, LC_ALL: "C" },
  });
  if (stderr && !stdout) throw new Error(stderr);
  return stdout;
}

// BAD -- string interpolation = command injection
exec(`git log --oneline -${count} ${path}`);

// GOOD -- array args = safe
execFile("git", ["log", "--oneline", `-${count}`, path]);
```

### Command Allowlist

Restrict which binaries can be executed:

```typescript
const ALLOWED_COMMANDS = new Set(["git", "docker", "npm"]);

export function validateCommand(command: string): void {
  if (!ALLOWED_COMMANDS.has(command)) {
    throw new Error(`Command not allowed: ${command}`);
  }
}
```

## Layer 3: Path Safety

Validate all file paths to prevent directory traversal:

```typescript
import { resolve, normalize } from "node:path";

const DEFAULT_BASE = process.cwd();

export function safePath(
  userPath: string,
  basePath: string = DEFAULT_BASE
): string {
  const resolved = resolve(basePath, normalize(userPath));
  if (!resolved.startsWith(basePath)) {
    throw new Error(`Path traversal blocked: ${userPath}`);
  }
  return resolved;
}
```

### Symlink Awareness

For sensitive operations, also check `realpath`:

```typescript
import { realpath } from "node:fs/promises";

export async function safePathStrict(
  userPath: string,
  basePath: string
): Promise<string> {
  const resolved = resolve(basePath, normalize(userPath));
  if (!resolved.startsWith(basePath)) {
    throw new Error(`Path traversal blocked: ${userPath}`);
  }
  const real = await realpath(resolved);
  if (!real.startsWith(basePath)) {
    throw new Error(`Symlink traversal blocked: ${userPath}`);
  }
  return real;
}
```

## Layer 4: Rate Limiting

Prevent abuse with a sliding window rate limiter:

```typescript
interface RateLimit {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_LIMIT: RateLimit = { windowMs: 60_000, maxRequests: 60 };

const windows = new Map<string, number[]>();

export function checkRateLimit(
  toolName: string,
  limit: RateLimit = DEFAULT_LIMIT
): void {
  const now = Date.now();
  const key = toolName;
  const timestamps = windows.get(key) ?? [];
  const valid = timestamps.filter((t) => now - t < limit.windowMs);
  if (valid.length >= limit.maxRequests) {
    throw new Error(
      `Rate limit exceeded for ${toolName}: ${limit.maxRequests} requests per ${limit.windowMs / 1000}s`
    );
  }
  valid.push(now);
  windows.set(key, valid);
}
```

## Additional: Structured Logging

Log all tool invocations for audit trail:

```typescript
export function log(
  level: "info" | "warn" | "error",
  tool: string,
  message: string,
  meta?: Record<string, unknown>
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    tool,
    message,
    ...meta,
  };
  process.stderr.write(JSON.stringify(entry) + "\n");
}
```

## Additional: Graceful Shutdown

Handle SIGINT/SIGTERM for clean exit:

```typescript
function setupShutdown(cleanup?: () => Promise<void>): void {
  const handler = async (signal: string) => {
    log("info", "server", `Received ${signal}, shutting down`);
    if (cleanup) await cleanup();
    process.exit(0);
  };
  process.on("SIGINT", () => handler("SIGINT"));
  process.on("SIGTERM", () => handler("SIGTERM"));
}
```
