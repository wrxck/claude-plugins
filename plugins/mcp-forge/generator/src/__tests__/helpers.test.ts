import { describe, it, expect } from "vitest";

import { pascalCase, kebabCase, tsType, zodType } from "../templates/helpers.js";
import type { ParamConfig } from "../config.js";

// -- helper to build a param config with sensible defaults
function param(overrides: Partial<ParamConfig> = {}): ParamConfig {
  return {
    name: "test_param",
    type: "string",
    description: "a test parameter",
    required: true,
    ...overrides,
  };
}

describe("pascalCase", () => {
  it("converts kebab-case to PascalCase", () => {
    expect(pascalCase("list-files")).toBe("ListFiles");
  });

  it("converts snake_case to PascalCase", () => {
    expect(pascalCase("get_user_info")).toBe("GetUserInfo");
  });

  it("handles single word", () => {
    expect(pascalCase("status")).toBe("Status");
  });

  it("handles multiple separators", () => {
    expect(pascalCase("a-b_c")).toBe("ABC");
  });

  it("handles empty string segments from leading separator", () => {
    expect(pascalCase("-leading")).toBe("Leading");
  });
});

describe("kebabCase", () => {
  it("replaces underscores with hyphens", () => {
    expect(kebabCase("get_user")).toBe("get-user");
  });

  it("leaves already-kebab strings unchanged", () => {
    expect(kebabCase("already-kebab")).toBe("already-kebab");
  });

  it("handles strings with no underscores", () => {
    expect(kebabCase("nochange")).toBe("nochange");
  });

  it("handles multiple underscores", () => {
    expect(kebabCase("a_b_c_d")).toBe("a-b-c-d");
  });
});

describe("tsType", () => {
  it("returns 'string' for string type", () => {
    expect(tsType(param({ type: "string" }))).toBe("string");
  });

  it("returns 'number' for number type", () => {
    expect(tsType(param({ type: "number" }))).toBe("number");
  });

  it("returns 'boolean' for boolean type", () => {
    expect(tsType(param({ type: "boolean" }))).toBe("boolean");
  });

  it("returns union of quoted values for enum type", () => {
    const p = param({ type: "enum", enumValues: ["asc", "desc"] });
    expect(tsType(p)).toBe('"asc" | "desc"');
  });

  it("returns empty string for enum with no values", () => {
    const p = param({ type: "enum", enumValues: [] });
    expect(tsType(p)).toBe("");
  });

  it("returns empty string for enum with undefined enumValues", () => {
    const p = param({ type: "enum", enumValues: undefined });
    expect(tsType(p)).toBe("");
  });

  it("returns enum with undefined when not required and no default", () => {
    const p = param({ type: "enum", enumValues: ["a"], required: false });
    expect(tsType(p)).toBe('"a" | undefined');
  });

  it("appends '| undefined' when not required and no default", () => {
    const p = param({ required: false });
    expect(tsType(p)).toBe("string | undefined");
  });

  it("does not append '| undefined' when not required but has a default", () => {
    const p = param({ required: false, default: "foo" });
    expect(tsType(p)).toBe("string");
  });

  it("does not append '| undefined' when required", () => {
    const p = param({ required: true });
    expect(tsType(p)).toBe("string");
  });
});

describe("zodType", () => {
  it("generates z.string() for string params", () => {
    const result = zodType(param());
    expect(result).toContain("z.string()");
    expect(result).toContain('.describe("a test parameter")');
  });

  it("adds .regex() for string with pattern", () => {
    const result = zodType(param({ pattern: "^[a-z]+$" }));
    expect(result).toContain(".regex(/^[a-z]+$/)");
  });

  it("generates z.number() for number params", () => {
    const result = zodType(param({ type: "number" }));
    expect(result).toContain("z.number()");
  });

  it("adds .min() and .max() for number with constraints", () => {
    const result = zodType(param({ type: "number", min: 1, max: 100 }));
    expect(result).toContain(".min(1)");
    expect(result).toContain(".max(100)");
  });

  it("adds only .min() when max is not set", () => {
    const result = zodType(param({ type: "number", min: 0 }));
    expect(result).toContain(".min(0)");
    expect(result).not.toContain(".max(");
  });

  it("adds only .max() when min is not set", () => {
    const result = zodType(param({ type: "number", max: 50 }));
    expect(result).not.toContain(".min(");
    expect(result).toContain(".max(50)");
  });

  it("generates z.boolean() for boolean params", () => {
    const result = zodType(param({ type: "boolean" }));
    expect(result).toContain("z.boolean()");
  });

  it("generates z.enum() for enum params", () => {
    const result = zodType(param({ type: "enum", enumValues: ["a", "b"] }));
    expect(result).toContain('z.enum(["a", "b"])');
  });

  it("generates z.enum() with empty array when no values", () => {
    const result = zodType(param({ type: "enum" }));
    expect(result).toContain("z.enum([])");
  });

  it("adds .optional() when not required", () => {
    const result = zodType(param({ required: false }));
    expect(result).toContain(".optional()");
  });

  it("does not add .optional() when required", () => {
    const result = zodType(param({ required: true }));
    expect(result).not.toContain(".optional()");
  });

  it("adds .default() when a default is set", () => {
    const result = zodType(param({ default: "hello" }));
    expect(result).toContain('.default("hello")');
  });

  it("adds numeric .default()", () => {
    const result = zodType(param({ type: "number", default: 42 }));
    expect(result).toContain(".default(42)");
  });

  it("adds .describe() with description", () => {
    const result = zodType(param({ description: "some desc" }));
    expect(result).toContain('.describe("some desc")');
  });
});
