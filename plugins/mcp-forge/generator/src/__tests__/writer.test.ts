import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { describe, it, expect, vi, beforeEach } from "vitest";

import type { ForgeConfig } from "../config.js";

// -- mock fs operations to avoid actual disk writes
vi.mock("node:fs", () => ({
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
}));

// -- capture stderr writes without printing
const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

import { generate } from "../writer.js";

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

describe("generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns list of generated file paths", () => {
    const files = generate(config(), "/out");
    expect(files).toBeInstanceOf(Array);
    expect(files.length).toBeGreaterThan(0);
  });

  it("always generates core project files", () => {
    const files = generate(config(), "/out");
    expect(files).toContain("package.json");
    expect(files).toContain("tsconfig.json");
    expect(files).toContain(".gitignore");
    expect(files).toContain("vitest.config.ts");
    expect(files).toContain("README.md");
  });

  it("generates module files", () => {
    const files = generate(config(), "/out");
    expect(files).toContain("src/lib/logger.ts");
    expect(files).toContain("src/lib/security.ts");
    expect(files).toContain("src/lib/health.ts");
    expect(files).toContain("src/index.ts");
  });

  it("generates tool files for each tool", () => {
    const files = generate(config(), "/out");
    expect(files).toContain("src/tools/list-items.ts");
    expect(files).toContain("src/tools/__tests__/list-items.test.ts");
  });

  it("converts underscores to hyphens in tool filenames", () => {
    const c = config({
      tools: [{ name: "get_user_info", description: "get user info", params: [], command: "cmd", args: [] }],
    });
    const files = generate(c, "/out");
    expect(files).toContain("src/tools/get-user-info.ts");
    expect(files).toContain("src/tools/__tests__/get-user-info.test.ts");
  });

  it("generates multiple tool files", () => {
    const c = config({
      tools: [
        { name: "tool_a", description: "a", params: [], command: "c", args: [] },
        { name: "tool_b", description: "b", params: [], command: "c", args: [] },
      ],
    });
    const files = generate(c, "/out");
    expect(files).toContain("src/tools/tool-a.ts");
    expect(files).toContain("src/tools/tool-b.ts");
  });

  it("generates docker files when docker option is enabled", () => {
    const c = config({ options: { ...config().options, docker: true } });
    const files = generate(c, "/out");
    expect(files).toContain("Dockerfile");
    expect(files).toContain("docker-compose.yml");
  });

  it("skips docker files when docker option is disabled", () => {
    const files = generate(config(), "/out");
    expect(files).not.toContain("Dockerfile");
    expect(files).not.toContain("docker-compose.yml");
  });

  it("generates systemd service when systemd option is enabled", () => {
    const c = config({ options: { ...config().options, systemd: true } });
    const files = generate(c, "/out");
    expect(files).toContain("mcp-test.service");
  });

  it("skips systemd service when systemd option is disabled", () => {
    const files = generate(config(), "/out");
    expect(files).not.toContain("mcp-test.service");
  });

  it("creates directories recursively before writing", () => {
    generate(config(), "/out");
    expect(mkdirSync).toHaveBeenCalled();
    const calls = vi.mocked(mkdirSync).mock.calls;
    for (const call of calls) {
      expect(call[1]).toEqual({ recursive: true });
    }
  });

  it("writes files with utf-8 encoding", () => {
    generate(config(), "/out");
    const calls = vi.mocked(writeFileSync).mock.calls;
    for (const call of calls) {
      expect(call[2]).toBe("utf-8");
    }
  });

  it("writes to correct output directory", () => {
    generate(config(), "/my/output");
    const calls = vi.mocked(writeFileSync).mock.calls;
    for (const call of calls) {
      expect(String(call[0])).toMatch(/^\/my\/output/);
    }
  });

  it("logs each file write to stderr", () => {
    generate(config(), "/out");
    expect(stderrSpy).toHaveBeenCalled();
    const writes = stderrSpy.mock.calls.map((c) => String(c[0]));
    expect(writes.some((w) => w.includes("wrote"))).toBeTruthy();
  });

  it("handles empty tools array", () => {
    const c = config({ tools: [] });
    const files = generate(c, "/out");
    expect(files).toContain("package.json");
    expect(files).toContain("src/index.ts");
    const toolFiles = files.filter((f) => f.startsWith("src/tools/"));
    expect(toolFiles).toHaveLength(0);
  });

  it("generates both docker and systemd when both enabled", () => {
    const c = config({ options: { ...config().options, docker: true, systemd: true } });
    const files = generate(c, "/out");
    expect(files).toContain("Dockerfile");
    expect(files).toContain("mcp-test.service");
  });

  it("writes non-empty content for every file", () => {
    generate(config(), "/out");
    const calls = vi.mocked(writeFileSync).mock.calls;
    for (const call of calls) {
      expect(String(call[1]).length).toBeGreaterThan(0);
    }
  });

  it("joins output dir with relative paths", () => {
    generate(config(), "/base");
    const calls = vi.mocked(writeFileSync).mock.calls;
    const paths = calls.map((c) => String(c[0]));
    expect(paths).toContain(join("/base", "package.json"));
    expect(paths).toContain(join("/base", "src/index.ts"));
  });
});
