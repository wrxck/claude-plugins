import type { ParamConfig } from "../config.js";

export function pascalCase(s: string): string {
  return s
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

export function kebabCase(s: string): string {
  return s.replace(/_/g, "-");
}

export function tsType(p: ParamConfig): string {
  let base: string;
  switch (p.type) {
    case "enum":
      base = (p.enumValues ?? []).map((v) => `"${v}"`).join(" | ");
      break;
    case "number":
      base = "number";
      break;
    case "boolean":
      base = "boolean";
      break;
    default:
      base = "string";
  }
  if (!p.required && p.default === undefined) return `${base} | undefined`;
  return base;
}

export function zodType(p: ParamConfig): string {
  let t: string;
  switch (p.type) {
    case "enum":
      t = `z.enum([${(p.enumValues ?? []).map((v) => `"${v}"`).join(", ")}])`;
      break;
    case "number":
      t = "z.number()";
      if (p.min !== undefined) t += `.min(${p.min})`;
      if (p.max !== undefined) t += `.max(${p.max})`;
      break;
    case "boolean":
      t = "z.boolean()";
      break;
    default:
      t = "z.string()";
      if (p.pattern) t += `.regex(/${p.pattern}/)`;
      break;
  }
  if (!p.required) t += ".optional()";
  if (p.default !== undefined) t += `.default(${JSON.stringify(p.default)})`;
  t += `.describe("${p.description}")`;
  return t;
}
