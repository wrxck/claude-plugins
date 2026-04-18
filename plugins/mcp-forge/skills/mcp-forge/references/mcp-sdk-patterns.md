# MCP SDK Patterns (v1.27.x)

## Dependencies

```json
{
  "@modelcontextprotocol/sdk": "1.27.0",
  "zod": "3.25.76"
}
```

## Server Bootstrap

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "${SERVER_NAME}",
  version: "1.0.0",
});
```

## Tool Registration

```typescript
server.registerTool(
  "tool_name",           // snake_case identifier
  {
    description: "Description string",
    inputSchema: z.object({
      param: z.string().describe("Param description"),
      optional: z.number().optional().default(10).describe("Optional param"),
    }),
  },
  async ({ param, optional }) => {
    // Tool implementation
    return {
      content: [{ type: "text", text: "result" }],
    };
  }
);
```

## No-Param Tools

```typescript
server.registerTool("tool_name", { description: "Description" }, async () => {
  return { content: [{ type: "text", text: "result" }] };
});
```

## Transport Connection

```typescript
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Error Handling

Return errors as text content -- do not throw from tool handlers:

```typescript
server.registerTool(
  "example",
  {
    description: "Example",
    inputSchema: z.object({ path: z.string() }),
  },
  async ({ path }) => {
    try {
      const result = await doWork(path);
      return { content: [{ type: "text", text: result }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  }
);
```

## Helper Pattern

```typescript
function text(msg: string) {
  return { content: [{ type: "text" as const, text: msg }] };
}
```

## Import Paths

Always use the full sub-path imports:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
```

Do NOT use barrel imports like `@modelcontextprotocol/sdk`.

## Zod Schema Conventions

- Use `.describe()` on every parameter for MCP tool discovery
- Use `.optional()` for non-required params
- Use `.default()` to set sensible defaults
- Use `z.enum()` for fixed option sets
- Use `z.array()` for list params
