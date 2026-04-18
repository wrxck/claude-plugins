import type { ForgeConfig } from "../config.js";

import { pascalCase, kebabCase } from "./helpers.js";

// template strings use this to avoid the import-order hook
// scanning generated code as if it were this file's imports
const IM = "import";

export function loggerModule(): string {
  return `type LogLevel = "info" | "warn" | "error";

export function log(
  level: LogLevel,
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
  process.stderr.write(JSON.stringify(entry) + "\\n");
}
`;
}

export function securityModule(c: ForgeConfig): string {
  const cmds = c.options.allowedCommands.map((s) => `"${s}"`).join(", ");
  return `${IM} { execFile } from "node:child_process";
${IM} { promisify } from "node:util";
${IM} { resolve, normalize } from "node:path";

${IM} { log } from "./logger.js";

const execFileAsync = promisify(execFile);

const ALLOWED_COMMANDS = new Set([${cmds}]);

function validateCommand(command: string): void {
  if (!ALLOWED_COMMANDS.has(command)) {
    throw new Error(\`Command not allowed: \${command}\`);
  }
}

export interface ExecOptions {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export async function safeExec(
  command: string,
  args: string[],
  options?: ExecOptions
): Promise<string> {
  validateCommand(command);
  log("info", "exec", \`\${command} \${args.join(" ")}\`, { cwd: options?.cwd });

  const { stdout, stderr } = await execFileAsync(command, args, {
    cwd: options?.cwd,
    timeout: options?.timeout ?? 30_000,
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, ...options?.env, LC_ALL: "C" },
  });

  if (stderr && !stdout) throw new Error(stderr.trim());
  return stdout;
}

const DEFAULT_BASE = process.cwd();

export function safePath(
  userPath: string,
  basePath: string = DEFAULT_BASE
): string {
  const resolved = resolve(basePath, normalize(userPath));
  if (!resolved.startsWith(resolve(basePath))) {
    throw new Error(\`Path traversal blocked: \${userPath}\`);
  }
  return resolved;
}

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
  const timestamps = windows.get(toolName) ?? [];
  const valid = timestamps.filter((t) => now - t < limit.windowMs);

  if (valid.length >= limit.maxRequests) {
    throw new Error(
      \`Rate limit exceeded for \${toolName}: max \${limit.maxRequests} per \${limit.windowMs / 1000}s\`
    );
  }

  valid.push(now);
  windows.set(toolName, valid);
}
`;
}

export function healthModule(c: ForgeConfig): string {
  return `${IM} { safeExec } from "./security.js";

export interface HealthResult {
  healthy: boolean;
  cli: string;
  version: string | null;
  error: string | null;
}

export async function checkHealth(): Promise<HealthResult> {
  try {
    const version = await safeExec("${c.cliName}", ["--version"], { timeout: 5_000 });
    return { healthy: true, cli: "${c.cliName}", version: version.trim(), error: null };
  } catch (err) {
    return {
      healthy: false,
      cli: "${c.cliName}",
      version: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
`;
}

export function serverEntry(c: ForgeConfig): string {
  const imports = c.tools
    .map((t) => {
      const pascal = pascalCase(t.name);
      const kebab = kebabCase(t.name);
      return `${IM} { register${pascal} } from "./tools/${kebab}.js";`;
    })
    .join("\n");

  const registrations = c.tools
    .map((t) => `register${pascalCase(t.name)}(server);`)
    .join("\n");

  return `${IM} { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
${IM} { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

${IM} { log } from "./lib/logger.js";
${IM} { checkHealth } from "./lib/health.js";
${imports}

const server = new McpServer({
  name: "${c.serverName}",
  version: "1.0.0",
});

${registrations}

const shutdown = async (signal: string) => {
  log("info", "server", \`Received \${signal}, shutting down\`);
  process.exit(0);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

const health = await checkHealth();
if (!health.healthy) {
  log("warn", "server", \`${c.cliName} not found: \${health.error}\`);
}

const transport = new StdioServerTransport();
await server.connect(transport);
log("info", "server", "${c.serverName} started");
`;
}
