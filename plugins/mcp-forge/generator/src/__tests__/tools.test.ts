import { describe, it, expect } from "vitest";

import type { ToolConfig, ParamConfig } from "../config.js";
import { toolModule, testModule } from "../templates/tools.js";

function param(overrides: Partial<ParamConfig> = {}): ParamConfig {
  return {
    name: "test_param",
    type: "string",
    description: "a test parameter",
    required: true,
    ...overrides,
  };
}

function tool(overrides: Partial<ToolConfig> = {}): ToolConfig {
  return {
    name: "list_files",
    description: "list files in a directory",
    params: [param()],
    command: "ls",
    args: ["-la"],
    ...overrides,
  };
}

describe("toolModule", () => {
  it("generates function named after tool in PascalCase", () => {
    expect(toolModule(tool())).toContain(
      "export function registerListFiles(server: McpServer)"
    );
  });

  it("registers tool with correct name and description", () => {
    const result = toolModule(tool());
    expect(result).toContain('"list_files"');
    expect(result).toContain('"list files in a directory"');
  });

  it("generates zod schema for params", () => {
    const result = toolModule(tool());
    expect(result).toContain("z.object({");
    expect(result).toContain("test_param:");
  });

  it("generates interface with param types", () => {
    const result = toolModule(tool());
    expect(result).toContain("interface Params");
    expect(result).toContain("test_param: string;");
  });

  it("generates cli exec body for non-api tools", () => {
    const result = toolModule(tool());
    expect(result).toContain('const cmdArgs = ["-la"]');
    expect(result).toContain('await safeExec("ls", cmdArgs');
  });

  it("generates api call body for api tools", () => {
    const t = tool({ isApiCall: true, httpMethod: "GET", httpPath: "/users" });
    const result = toolModule(t);
    expect(result).toContain("// api call: GET /users");
    expect(result).toContain('"not yet implemented"');
  });

  it("handles path params with safePath", () => {
    const t = tool({
      params: [param({ name: "directory", isPath: true, required: false })],
    });
    expect(toolModule(t)).toContain("safePath(directory");
  });

  it("handles non-path params without safePath cwd", () => {
    const t = tool({ params: [param({ name: "count", type: "number" })] });
    expect(toolModule(t)).toContain("const cwd = undefined");
  });

  it("generates conditional push for optional params", () => {
    const t = tool({
      params: [param({ name: "verbose", type: "boolean", required: false })],
    });
    expect(toolModule(t)).toContain("if (verbose !== undefined) cmdArgs.push");
  });

  it("generates unconditional push for required params", () => {
    const t = tool({ params: [param({ name: "target", required: true })] });
    expect(toolModule(t)).toContain("cmdArgs.push(String(target))");
  });

  it("imports zod via IM pattern", () => {
    expect(toolModule(tool())).toContain('import { z } from "zod"');
  });

  it("imports security and logger modules via IM pattern", () => {
    const result = toolModule(tool());
    expect(result).toContain('import { safeExec, safePath, checkRateLimit }');
    expect(result).toContain('import { log } from "../lib/logger.js"');
  });

  it("includes rate limiting call", () => {
    expect(toolModule(tool())).toContain('checkRateLimit("list_files")');
  });

  it("includes error handling", () => {
    const result = toolModule(tool());
    expect(result).toContain("catch (err)");
    expect(result).toContain("isError: true");
  });

  it("handles tool with no params", () => {
    const result = toolModule(tool({ params: [] }));
    expect(result).toContain("z.object({");
    expect(result).toContain("interface Params");
  });

  it("handles multiple base args", () => {
    const t = tool({ args: ["--format", "json", "--verbose"] });
    expect(toolModule(t)).toContain('"--format", "json", "--verbose"');
  });

  it("makes optional params optional in interface", () => {
    const t = tool({
      params: [param({ name: "verbose", type: "boolean", required: false })],
    });
    expect(toolModule(t)).toContain("verbose?: boolean | undefined;");
  });
});

describe("testModule", () => {
  it("generates test file with correct imports via IM pattern", () => {
    expect(testModule(tool())).toContain(
      'import { describe, it, expect, vi, beforeEach } from "vitest"'
    );
  });

  it("mocks security and logger modules", () => {
    const result = testModule(tool());
    expect(result).toContain('vi.mock("../../lib/security.js"');
    expect(result).toContain('vi.mock("../../lib/logger.js"');
  });

  it("imports the registration function", () => {
    expect(testModule(tool())).toContain(
      'import { registerListFiles } from "../list-files.js"'
    );
  });

  it("generates success test", () => {
    const result = testModule(tool());
    expect(result).toContain("returns result on success");
    expect(result).toContain('mockedExec.mockResolvedValue("mock output")');
  });

  it("generates failure test", () => {
    const result = testModule(tool());
    expect(result).toContain("returns error on failure");
    expect(result).toContain('new Error("command failed")');
  });

  it("uses string default /tmp for required string params", () => {
    const t = tool({ params: [param({ name: "path", required: true })] });
    expect(testModule(t)).toContain("/tmp");
  });

  it("uses 10 as default for required number params", () => {
    const t = tool({
      params: [param({ name: "count", type: "number", required: true })],
    });
    expect(testModule(t)).toContain("10");
  });

  it("uses false as default for required boolean params", () => {
    const t = tool({
      params: [param({ name: "verbose", type: "boolean", required: true })],
    });
    expect(testModule(t)).toContain("false");
  });

  it("uses first enum value as test default", () => {
    const t = tool({
      params: [
        param({ name: "fmt", type: "enum", enumValues: ["json", "csv"], required: true }),
      ],
    });
    expect(testModule(t)).toContain('"json"');
  });

  it("uses 'default' when enum has no values", () => {
    const t = tool({
      params: [param({ name: "mode", type: "enum", enumValues: [], required: true })],
    });
    expect(testModule(t)).toContain('"default"');
  });

  it("skips optional params in test params", () => {
    const t = tool({
      params: [
        param({ name: "required_param", required: true }),
        param({ name: "optional_param", required: false }),
      ],
    });
    const result = testModule(t);
    expect(result).toContain("required_param");
    expect(result).not.toContain('"optional_param"');
  });

  it("uses explicit default over type default", () => {
    const t = tool({
      params: [param({ name: "count", type: "number", required: true, default: 99 })],
    });
    expect(testModule(t)).toContain("99");
  });

  it("handles tool with no params (empty test params)", () => {
    expect(testModule(tool({ params: [] }))).toContain("await handler({})");
  });
});
