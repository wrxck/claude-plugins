import { describe, it, expect } from "vitest";

import {
  parseOpenApiSpec,
  formatEndpointList,
  parseEndpointSelection,
} from "../openapi.js";
import type { ToolConfig } from "../config.js";

describe("parseOpenApiSpec", () => {
  it("returns empty array for spec with no paths", () => {
    expect(parseOpenApiSpec({})).toEqual([]);
  });

  it("returns empty array for empty paths object", () => {
    expect(parseOpenApiSpec({ paths: {} })).toEqual([]);
  });

  it("parses a simple GET endpoint", () => {
    const spec = {
      paths: {
        "/users": {
          get: { operationId: "listUsers", summary: "list all users" },
        },
      },
    };
    const tools = parseOpenApiSpec(spec);
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe("list_users");
    expect(tools[0].description).toBe("list all users");
    expect(tools[0].httpMethod).toBe("GET");
    expect(tools[0].httpPath).toBe("/users");
    expect(tools[0].isApiCall).toBeTruthy();
    expect(tools[0].command).toBe("curl");
  });

  it("uses description when summary is missing", () => {
    const spec = {
      paths: { "/items": { get: { operationId: "getItems", description: "fetch items" } } },
    };
    expect(parseOpenApiSpec(spec)[0].description).toBe("fetch items");
  });

  it("generates fallback description from method and path", () => {
    const spec = { paths: { "/items": { get: { operationId: "getItems" } } } };
    expect(parseOpenApiSpec(spec)[0].description).toBe("GET /items");
  });

  it("generates name from method+path when operationId is missing", () => {
    const spec = { paths: { "/users/{id}": { get: {} } } };
    expect(parseOpenApiSpec(spec)[0].name).toMatch(/get_users_id/);
  });

  it("parses query parameters", () => {
    const spec = {
      paths: {
        "/search": {
          get: {
            operationId: "search",
            parameters: [
              { name: "query", in: "query", description: "search query", required: true, schema: { type: "string" } },
              { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
            ],
          },
        },
      },
    };
    const tools = parseOpenApiSpec(spec);
    expect(tools[0].params).toHaveLength(2);
    expect(tools[0].params[0].name).toBe("query");
    expect(tools[0].params[0].type).toBe("string");
    expect(tools[0].params[0].required).toBeTruthy();
    expect(tools[0].params[1].type).toBe("number");
    expect(tools[0].params[1].default).toBe(10);
  });

  it("parses path parameters (always required)", () => {
    const spec = {
      paths: {
        "/users/{userId}": {
          get: {
            operationId: "getUser",
            parameters: [{ name: "userId", in: "path", schema: { type: "string" } }],
          },
        },
      },
    };
    const tools = parseOpenApiSpec(spec);
    expect(tools[0].params[0].required).toBeTruthy();
    expect(tools[0].params[0].name).toBe("user_id");
  });

  it("skips header and cookie parameters", () => {
    const spec = {
      paths: {
        "/data": {
          get: {
            operationId: "getData",
            parameters: [
              { name: "Authorization", in: "header", schema: { type: "string" } },
              { name: "session", in: "cookie", schema: { type: "string" } },
              { name: "format", in: "query", schema: { type: "string" } },
            ],
          },
        },
      },
    };
    expect(parseOpenApiSpec(spec)[0].params).toHaveLength(1);
  });

  it("parses enum parameters", () => {
    const spec = {
      paths: {
        "/items": {
          get: {
            operationId: "listItems",
            parameters: [{ name: "sort", in: "query", schema: { type: "string", enum: ["asc", "desc"] } }],
          },
        },
      },
    };
    const p = parseOpenApiSpec(spec)[0].params[0];
    expect(p.type).toBe("enum");
    expect(p.enumValues).toEqual(["asc", "desc"]);
  });

  it("parses number constraints (min, max)", () => {
    const spec = {
      paths: {
        "/items": {
          get: {
            operationId: "listItems",
            parameters: [{ name: "page", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } }],
          },
        },
      },
    };
    const p = parseOpenApiSpec(spec)[0].params[0];
    expect(p.min).toBe(1);
    expect(p.max).toBe(100);
  });

  it("parses string pattern", () => {
    const spec = {
      paths: {
        "/items": {
          get: {
            operationId: "listItems",
            parameters: [{ name: "id", in: "query", schema: { type: "string", pattern: "^[a-z]+$" } }],
          },
        },
      },
    };
    expect(parseOpenApiSpec(spec)[0].params[0].pattern).toBe("^[a-z]+$");
  });

  it("parses request body properties", () => {
    const spec = {
      paths: {
        "/users": {
          post: {
            operationId: "createUser",
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    properties: { name: { type: "string", description: "user name" }, age: { type: "integer" } },
                    required: ["name"],
                  },
                },
              },
            },
          },
        },
      },
    };
    const params = parseOpenApiSpec(spec)[0].params;
    expect(params).toHaveLength(2);
    expect(params[0].name).toBe("name");
    expect(params[0].required).toBeTruthy();
    expect(params[0].description).toBe("user name");
    expect(params[1].type).toBe("number");
    expect(params[1].required).toBeFalsy();
  });

  it("handles request body with no required array", () => {
    const spec = {
      paths: {
        "/items": {
          post: {
            operationId: "createItem",
            requestBody: {
              content: { "application/json": { schema: { properties: { title: { type: "string" } } } } },
            },
          },
        },
      },
    };
    expect(parseOpenApiSpec(spec)[0].params[0].required).toBeFalsy();
  });

  it("uses param name as description fallback", () => {
    const spec = {
      paths: {
        "/data": {
          get: { operationId: "getData", parameters: [{ name: "myParam", in: "query", schema: { type: "string" } }] },
        },
      },
    };
    expect(parseOpenApiSpec(spec)[0].params[0].description).toBe("myParam");
  });

  it("handles param with no schema (defaults to string)", () => {
    const spec = {
      paths: { "/data": { get: { operationId: "getData", parameters: [{ name: "q", in: "query" }] } } },
    };
    expect(parseOpenApiSpec(spec)[0].params[0].type).toBe("string");
  });

  it("parses boolean schema type", () => {
    const spec = {
      paths: {
        "/data": {
          get: { operationId: "getData", parameters: [{ name: "verbose", in: "query", schema: { type: "boolean" } }] },
        },
      },
    };
    expect(parseOpenApiSpec(spec)[0].params[0].type).toBe("boolean");
  });

  it("handles multiple HTTP methods on same path", () => {
    const spec = {
      paths: { "/users": { get: { operationId: "listUsers" }, post: { operationId: "createUser" } } },
    };
    const tools = parseOpenApiSpec(spec);
    expect(tools).toHaveLength(2);
  });

  it("skips non-standard HTTP methods", () => {
    const spec = {
      paths: { "/users": { get: { operationId: "listUsers" }, options: { operationId: "opts" }, head: { operationId: "hd" } } },
    };
    expect(parseOpenApiSpec(spec)).toHaveLength(1);
  });

  it("parses all five supported HTTP methods", () => {
    const spec = {
      paths: {
        "/r": {
          get: { operationId: "g" }, post: { operationId: "p" },
          put: { operationId: "u" }, patch: { operationId: "pa" },
          delete: { operationId: "d" },
        },
      },
    };
    expect(parseOpenApiSpec(spec)).toHaveLength(5);
  });

  it("handles camelCase operationIds via snakeCase", () => {
    const spec = { paths: { "/users": { get: { operationId: "listAllUsers", summary: "test" } } } };
    expect(parseOpenApiSpec(spec)[0].name).toBe("list_all_users");
  });

  it("handles body enum properties", () => {
    const spec = {
      paths: {
        "/items": {
          post: {
            operationId: "createItem",
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    properties: { status: { type: "string", enum: ["active", "inactive"], description: "item status" } },
                    required: ["status"],
                  },
                },
              },
            },
          },
        },
      },
    };
    const p = parseOpenApiSpec(spec)[0].params[0];
    expect(p.type).toBe("enum");
    expect(p.enumValues).toEqual(["active", "inactive"]);
  });
});

describe("formatEndpointList", () => {
  it("generates header comments", () => {
    const result = formatEndpointList([]);
    expect(result).toContain("# mcp-forge -- endpoint selection");
  });

  it("formats api tools with method and path", () => {
    const tools: ToolConfig[] = [
      { name: "list_users", description: "list all users", params: [], command: "curl", args: [], httpMethod: "GET", httpPath: "/users" },
    ];
    expect(formatEndpointList(tools)).toContain("GET\t/users\tlist all users");
  });

  it("formats cli tools with CLI label", () => {
    const tools: ToolConfig[] = [
      { name: "list_files", description: "list files", params: [], command: "ls", args: [] },
    ];
    expect(formatEndpointList(tools)).toContain("CLI\tls\tlist files");
  });

  it("ends with newline", () => {
    expect(formatEndpointList([])).toMatch(/\n$/);
  });
});

describe("parseEndpointSelection", () => {
  const allTools: ToolConfig[] = [
    { name: "list_users", description: "list", params: [], command: "curl", args: [], httpMethod: "GET", httpPath: "/users" },
    { name: "create_user", description: "create", params: [], command: "curl", args: [], httpMethod: "POST", httpPath: "/users" },
    { name: "delete_user", description: "delete", params: [], command: "curl", args: [], httpMethod: "DELETE", httpPath: "/users/{id}" },
  ];

  it("returns all matching tools from selection text", () => {
    const text = "GET\t/users\tlist\nPOST\t/users\tcreate\n";
    expect(parseEndpointSelection(text, allTools)).toHaveLength(2);
  });

  it("skips commented lines", () => {
    const text = "# GET\t/users\tlist\nPOST\t/users\tcreate\n";
    expect(parseEndpointSelection(text, allTools)).toHaveLength(1);
  });

  it("skips empty lines", () => {
    const text = "\n\nGET\t/users\tlist\n\n";
    expect(parseEndpointSelection(text, allTools)).toHaveLength(1);
  });

  it("returns empty array when all lines are comments", () => {
    expect(parseEndpointSelection("# comment\n", allTools)).toEqual([]);
  });

  it("returns empty array for empty text", () => {
    expect(parseEndpointSelection("", allTools)).toEqual([]);
  });

  it("handles cli tools without httpMethod/httpPath", () => {
    const cliTools: ToolConfig[] = [
      { name: "list_files", description: "list files", params: [], command: "ls", args: [] },
    ];
    expect(parseEndpointSelection("CLI\tls\tlist files\n", cliTools)).toHaveLength(1);
  });

  it("skips lines with fewer than 2 tab-separated parts", () => {
    expect(parseEndpointSelection("invalid line\nGET\t/users\tlist\n", allTools)).toHaveLength(1);
  });

  it("handles whitespace-only lines", () => {
    expect(parseEndpointSelection("   \n\t\nGET\t/users\tlist\n", allTools)).toHaveLength(1);
  });
});
