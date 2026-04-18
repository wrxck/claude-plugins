import type { ToolConfig, ParamConfig } from "./config.js";

interface OpenApiParam {
  name: string;
  in: string;
  description?: string;
  required?: boolean;
  schema?: {
    type?: string;
    enum?: string[];
    default?: unknown;
    minimum?: number;
    maximum?: number;
    pattern?: string;
  };
}

interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: OpenApiParam[];
  requestBody?: {
    content?: Record<
      string,
      { schema?: { properties?: Record<string, OpenApiParam["schema"] & { description?: string }>; required?: string[] } }
    >;
  };
}

interface OpenApiSpec {
  info?: { title?: string; description?: string };
  paths?: Record<string, Record<string, OpenApiOperation>>;
}

function snakeCase(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function mapType(schema?: OpenApiParam["schema"]): ParamConfig["type"] {
  if (!schema) return "string";
  if (schema.enum) return "enum";
  switch (schema.type) {
    case "integer":
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "string";
  }
}

function extractParams(op: OpenApiOperation): ParamConfig[] {
  const params: ParamConfig[] = [];

  // query and path params
  for (const p of op.parameters ?? []) {
    if (p.in === "header" || p.in === "cookie") continue;
    params.push({
      name: snakeCase(p.name),
      type: mapType(p.schema),
      description: p.description ?? p.name,
      required: p.required ?? p.in === "path",
      default: p.schema?.default,
      enumValues: p.schema?.enum,
      min: p.schema?.minimum,
      max: p.schema?.maximum,
      pattern: p.schema?.pattern,
    });
  }

  // request body properties
  const jsonBody = op.requestBody?.content?.["application/json"];
  if (jsonBody?.schema?.properties) {
    const required = new Set(jsonBody.schema.required ?? []);
    for (const [name, schema] of Object.entries(jsonBody.schema.properties)) {
      params.push({
        name: snakeCase(name),
        type: mapType(schema as OpenApiParam["schema"]),
        description: schema.description ?? name,
        required: required.has(name),
        default: (schema as OpenApiParam["schema"])?.default,
        enumValues: (schema as OpenApiParam["schema"])?.enum,
      });
    }
  }

  return params;
}

export function parseOpenApiSpec(spec: OpenApiSpec): ToolConfig[] {
  const tools: ToolConfig[] = [];

  for (const [path, methods] of Object.entries(spec.paths ?? {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (["get", "post", "put", "patch", "delete"].indexOf(method) === -1) continue;

      const name =
        op.operationId ??
        snakeCase(`${method}_${path.replace(/[{}\/]/g, "_")}`);

      tools.push({
        name: snakeCase(name),
        description: op.summary ?? op.description ?? `${method.toUpperCase()} ${path}`,
        params: extractParams(op),
        command: "curl",
        args: [],
        isApiCall: true,
        httpMethod: method.toUpperCase(),
        httpPath: path,
      });
    }
  }

  return tools;
}

export function formatEndpointList(tools: ToolConfig[]): string {
  const lines = [
    "# mcp-forge -- endpoint selection",
    "#",
    "# delete or comment out (with #) any endpoints you do NOT want.",
    "# save and close when done.",
    "#",
    "",
  ];

  for (const t of tools) {
    lines.push(`${t.httpMethod ?? "CLI"}\t${t.httpPath ?? t.command}\t${t.description}`);
  }

  return lines.join("\n") + "\n";
}

export function parseEndpointSelection(
  text: string,
  allTools: ToolConfig[]
): ToolConfig[] {
  const selected = new Set<string>();

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("\t");
    if (parts.length >= 2) {
      const key = `${parts[0]}\t${parts[1]}`;
      selected.add(key);
    }
  }

  return allTools.filter((t) => {
    const method = t.httpMethod ?? "CLI";
    const path = t.httpPath ?? t.command;
    return selected.has(`${method}\t${path}`);
  });
}
