import type { ToolConfig } from "../config.js";

import { pascalCase, kebabCase, zodType, tsType } from "./helpers.js";

// template strings use this to avoid the import-order hook
// scanning generated code as if it were this file's imports
const IM = "import";

export function toolModule(tool: ToolConfig): string {
  const pascal = pascalCase(tool.name);
  const params = tool.params
    .map((p) => `      ${p.name}: ${zodType(p)},`)
    .join("\n");
  const paramNames = tool.params.map((p) => p.name).join(", ");

  let body: string;
  if (tool.isApiCall) {
    body = `        // api call: ${tool.httpMethod} ${tool.httpPath}
        const result = "not yet implemented";`;
  } else {
    const baseArgs = tool.args.map((a) => `"${a}"`).join(", ");
    const dynamicArgs = tool.params
      .filter((p) => !p.isPath)
      .map((p) => {
        if (!p.required) {
          return `        if (${p.name} !== undefined) cmdArgs.push(String(${p.name}));`;
        }
        return `        cmdArgs.push(String(${p.name}));`;
      })
      .join("\n");
    const pathParam = tool.params.find((p) => p.isPath);
    const cwdLine = pathParam
      ? `        const cwd = safePath(${pathParam.name} ?? ".");`
      : `        const cwd = undefined;`;

    body = `        const cmdArgs = [${baseArgs}];
${dynamicArgs}
${cwdLine}
        const result = await safeExec("${tool.command}", cmdArgs, { cwd });`;
  }

  const interfaceProps = tool.params
    .map((p) => `  ${p.name}${!p.required && p.default === undefined ? "?" : ""}: ${tsType(p)};`)
    .join("\n");

  return `${IM} { z } from "zod";

${IM} type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

${IM} { safeExec, safePath, checkRateLimit } from "../lib/security.js";
${IM} { log } from "../lib/logger.js";

interface Params {
${interfaceProps}
}

export function register${pascal}(server: McpServer): void {
  server.registerTool(
    "${tool.name}",
    {
      description: "${tool.description}",
      inputSchema: z.object({
${params}
      }),
    },
    async ({ ${paramNames} }: Params) => {
      try {
        checkRateLimit("${tool.name}");
        log("info", "${tool.name}", "invoked", { ${paramNames} });

${body}

        return { content: [{ type: "text", text: result }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log("error", "${tool.name}", message);
        return { content: [{ type: "text", text: \`Error: \${message}\` }], isError: true };
      }
    }
  );
}
`;
}

export function testModule(tool: ToolConfig): string {
  const pascal = pascalCase(tool.name);
  const kebab = kebabCase(tool.name);
  const testParams = tool.params.reduce(
    (acc, p) => {
      if (p.required) {
        switch (p.type) {
          case "number":
            acc[p.name] = p.default ?? 10;
            break;
          case "boolean":
            acc[p.name] = p.default ?? false;
            break;
          case "enum":
            acc[p.name] = p.enumValues?.[0] ?? "default";
            break;
          default:
            acc[p.name] = p.default ?? "/tmp";
        }
      }
      return acc;
    },
    {} as Record<string, unknown>
  );

  return `${IM} { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/security.js", () => ({
  safeExec: vi.fn(),
  safePath: vi.fn((p: string) => p),
  checkRateLimit: vi.fn(),
}));

vi.mock("../../lib/logger.js", () => ({
  log: vi.fn(),
}));

${IM} type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

${IM} { safeExec } from "../../lib/security.js";
${IM} { register${pascal} } from "../${kebab}.js";

const mockedExec = vi.mocked(safeExec);

describe("${tool.name}", () => {
  let handler: Function;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = {
      registerTool: vi.fn((_name: string, _config: unknown, h: Function) => {
        handler = h;
      }),
    } as unknown as McpServer;
    register${pascal}(server);
  });

  it("returns result on success", async () => {
    mockedExec.mockResolvedValue("mock output");
    const result = await handler(${JSON.stringify(testParams)});
    expect(result.content[0].text).toContain("mock output");
    expect(result.isError).toBeUndefined();
  });

  it("returns error on failure", async () => {
    mockedExec.mockRejectedValue(new Error("command failed"));
    const result = await handler(${JSON.stringify(testParams)});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("command failed");
  });
});
`;
}
