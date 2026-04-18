import { describe, it, expect } from "vitest";

import type { ForgeConfig } from "../config.js";
import {
  loggerModule,
  securityModule,
  healthModule,
  serverEntry,
} from "../templates/modules.js";

function config(overrides: Partial<ForgeConfig> = {}): ForgeConfig {
  return {
    projectName: "mcp-test",
    serverName: "test-server",
    cliName: "testcli",
    cliDescription: "a test cli tool",
    sourceType: "cli",
    tools: [
      {
        name: "list_items",
        description: "list all items",
        params: [],
        command: "testcli",
        args: ["list"],
      },
    ],
    options: {
      docker: false,
      systemd: false,
      port: 3000,
      allowedCommands: ["testcli"],
    },
    ...overrides,
  };
}

describe("loggerModule", () => {
  it("defines LogLevel type", () => {
    expect(loggerModule()).toContain('type LogLevel = "info" | "warn" | "error"');
  });

  it("exports log function", () => {
    expect(loggerModule()).toContain("export function log(");
  });

  it("includes timestamp in log entries", () => {
    expect(loggerModule()).toContain("new Date().toISOString()");
  });

  it("writes to stderr", () => {
    expect(loggerModule()).toContain("process.stderr.write");
  });

  it("accepts meta parameter", () => {
    expect(loggerModule()).toContain("meta?: Record<string, unknown>");
  });
});

describe("securityModule", () => {
  it("includes allowed commands from config", () => {
    const result = securityModule(config());
    expect(result).toContain('"testcli"');
    expect(result).toContain("ALLOWED_COMMANDS");
  });

  it("includes multiple allowed commands", () => {
    const c = config({
      options: { ...config().options, allowedCommands: ["git", "ls", "cat"] },
    });
    const result = securityModule(c);
    expect(result).toContain('"git", "ls", "cat"');
  });

  it("exports safeExec function", () => {
    expect(securityModule(config())).toContain("export async function safeExec(");
  });

  it("exports safePath function", () => {
    expect(securityModule(config())).toContain("export function safePath(");
  });

  it("exports checkRateLimit function", () => {
    expect(securityModule(config())).toContain("export function checkRateLimit(");
  });

  it("imports execFile from node:child_process via IM pattern", () => {
    expect(securityModule(config())).toContain(
      'import { execFile } from "node:child_process"'
    );
  });

  it("imports promisify from node:util", () => {
    expect(securityModule(config())).toContain(
      'import { promisify } from "node:util"'
    );
  });

  it("imports path utilities", () => {
    expect(securityModule(config())).toContain(
      'import { resolve, normalize } from "node:path"'
    );
  });

  it("includes validateCommand that throws on disallowed commands", () => {
    const result = securityModule(config());
    expect(result).toContain("function validateCommand(");
    expect(result).toContain("Command not allowed");
  });

  it("includes ExecOptions interface", () => {
    expect(securityModule(config())).toContain("export interface ExecOptions");
  });

  it("includes RateLimit interface with defaults", () => {
    const result = securityModule(config());
    expect(result).toContain("interface RateLimit");
    expect(result).toContain("windowMs: 60_000");
    expect(result).toContain("maxRequests: 60");
  });

  it("includes path traversal protection", () => {
    expect(securityModule(config())).toContain("Path traversal blocked");
  });
});

describe("healthModule", () => {
  it("exports checkHealth function", () => {
    expect(healthModule(config())).toContain(
      "export async function checkHealth()"
    );
  });

  it("uses cli name from config for version check", () => {
    const result = healthModule(config());
    expect(result).toContain('"testcli"');
    expect(result).toContain("--version");
  });

  it("exports HealthResult interface", () => {
    expect(healthModule(config())).toContain("export interface HealthResult");
  });

  it("returns healthy states for success and failure", () => {
    const result = healthModule(config());
    expect(result).toContain("healthy: true");
    expect(result).toContain("healthy: false");
  });

  it("imports safeExec via IM pattern", () => {
    expect(healthModule(config())).toContain(
      'import { safeExec } from "./security.js"'
    );
  });

  it("uses different cli name when config changes", () => {
    const c = config({ cliName: "mycustomcli" });
    expect(healthModule(c)).toContain('"mycustomcli"');
  });
});

describe("serverEntry", () => {
  it("imports McpServer via IM pattern", () => {
    expect(serverEntry(config())).toContain(
      'import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"'
    );
  });

  it("imports StdioServerTransport", () => {
    expect(serverEntry(config())).toContain(
      'import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"'
    );
  });

  it("imports logger and health modules", () => {
    const result = serverEntry(config());
    expect(result).toContain('import { log } from "./lib/logger.js"');
    expect(result).toContain('import { checkHealth } from "./lib/health.js"');
  });

  it("imports tool registration functions", () => {
    expect(serverEntry(config())).toContain(
      'import { registerListItems } from "./tools/list-items.js"'
    );
  });

  it("registers all tools", () => {
    expect(serverEntry(config())).toContain("registerListItems(server)");
  });

  it("handles multiple tools", () => {
    const c = config({
      tools: [
        { name: "get_status", description: "d", params: [], command: "c", args: [] },
        { name: "run_build", description: "d", params: [], command: "c", args: [] },
      ],
    });
    const result = serverEntry(c);
    expect(result).toContain("registerGetStatus(server)");
    expect(result).toContain("registerRunBuild(server)");
  });

  it("creates server with correct name", () => {
    expect(serverEntry(config())).toContain('name: "test-server"');
  });

  it("includes signal handlers", () => {
    const result = serverEntry(config());
    expect(result).toContain('process.on("SIGINT"');
    expect(result).toContain('process.on("SIGTERM"');
  });

  it("includes health check on startup", () => {
    const result = serverEntry(config());
    expect(result).toContain("await checkHealth()");
    expect(result).toContain("!health.healthy");
  });

  it("connects transport and logs start", () => {
    const result = serverEntry(config());
    expect(result).toContain("await server.connect(transport)");
    expect(result).toContain("test-server started");
  });

  it("handles empty tools array", () => {
    const c = config({ tools: [] });
    const result = serverEntry(c);
    expect(result).toContain("const server = new McpServer");
    expect(result).not.toContain("registerTool");
  });
});
