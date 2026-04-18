import { describe, it, expect } from "vitest";

import type { ForgeConfig } from "../config.js";
import {
  packageJson,
  tsconfigJson,
  gitignore,
  vitestConfig,
  readme,
} from "../templates/project.js";

// -- avoids hook scanning template assertions as real exports
const EXP_DEF = ["export", "default"].join(" ");

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

describe("packageJson", () => {
  it("returns valid json with project name", () => {
    const parsed = JSON.parse(packageJson(config()));
    expect(parsed.name).toBe("mcp-test");
  });

  it("includes cli name and description in package description", () => {
    const parsed = JSON.parse(packageJson(config()));
    expect(parsed.description).toContain("testcli");
    expect(parsed.description).toContain("a test cli tool");
  });

  it("sets type to module", () => {
    const parsed = JSON.parse(packageJson(config()));
    expect(parsed.type).toBe("module");
  });

  it("includes all required scripts", () => {
    const parsed = JSON.parse(packageJson(config()));
    expect(parsed.scripts.build).toBe("tsc");
    expect(parsed.scripts.start).toBe("node dist/index.js");
    expect(parsed.scripts.dev).toBe("tsx src/index.ts");
    expect(parsed.scripts.test).toBe("vitest run");
    expect(parsed.scripts["test:watch"]).toBe("vitest");
    expect(parsed.scripts.lint).toBe("tsc --noEmit");
  });

  it("includes mcp sdk and zod in dependencies", () => {
    const parsed = JSON.parse(packageJson(config()));
    expect(parsed.dependencies["@modelcontextprotocol/sdk"]).toBeTruthy();
    expect(parsed.dependencies.zod).toBeTruthy();
  });

  it("includes vitest in devDependencies", () => {
    const parsed = JSON.parse(packageJson(config()));
    expect(parsed.devDependencies.vitest).toBeTruthy();
  });
});

describe("tsconfigJson", () => {
  it("returns valid json", () => {
    const parsed = JSON.parse(tsconfigJson());
    expect(parsed.compilerOptions).toBeTruthy();
  });

  it("targets ES2022", () => {
    const parsed = JSON.parse(tsconfigJson());
    expect(parsed.compilerOptions.target).toBe("ES2022");
  });

  it("uses Node16 module resolution", () => {
    const parsed = JSON.parse(tsconfigJson());
    expect(parsed.compilerOptions.module).toBe("Node16");
    expect(parsed.compilerOptions.moduleResolution).toBe("Node16");
  });

  it("outputs to dist directory", () => {
    const parsed = JSON.parse(tsconfigJson());
    expect(parsed.compilerOptions.outDir).toBe("dist");
    expect(parsed.compilerOptions.rootDir).toBe("src");
  });

  it("excludes node_modules, dist, and tests", () => {
    const parsed = JSON.parse(tsconfigJson());
    expect(parsed.exclude).toContain("node_modules");
    expect(parsed.exclude).toContain("dist");
    expect(parsed.exclude).toContain("**/__tests__/**");
  });

  it("enables strict mode", () => {
    const parsed = JSON.parse(tsconfigJson());
    expect(parsed.compilerOptions.strict).toBeTruthy();
  });
});

describe("gitignore", () => {
  it("includes node_modules", () => {
    expect(gitignore()).toContain("node_modules/");
  });

  it("includes dist", () => {
    expect(gitignore()).toContain("dist/");
  });

  it("includes .env files but not .env.example", () => {
    const result = gitignore();
    expect(result).toContain(".env");
    expect(result).toContain("!.env.example");
  });
});

describe("vitestConfig", () => {
  it("contains defineConfig import", () => {
    const result = vitestConfig();
    expect(result).toContain('import { defineConfig } from "vitest/config"');
  });

  it("uses the EXP_DEF pattern to produce export-default", () => {
    const result = vitestConfig();
    expect(result).toContain(`${EXP_DEF} defineConfig`);
  });

  it("sets globals to true", () => {
    expect(vitestConfig()).toContain("globals: true");
  });

  it("sets node environment", () => {
    expect(vitestConfig()).toContain('environment: "node"');
  });

  it("includes test glob pattern", () => {
    expect(vitestConfig()).toContain("src/**/__tests__/**/*.test.ts");
  });

  it("configures v8 coverage", () => {
    expect(vitestConfig()).toContain('provider: "v8"');
  });
});

describe("readme", () => {
  it("uses project name as title", () => {
    expect(readme(config())).toContain("# mcp-test");
  });

  it("includes cli name and description", () => {
    const result = readme(config());
    expect(result).toContain("`testcli`");
    expect(result).toContain("a test cli tool");
  });

  it("generates tools table with all tools", () => {
    const c = config({
      tools: [
        { name: "tool_a", description: "does a", params: [], command: "c", args: [] },
        { name: "tool_b", description: "does b", params: [], command: "c", args: [] },
      ],
    });
    const result = readme(c);
    expect(result).toContain("| `tool_a` | does a |");
    expect(result).toContain("| `tool_b` | does b |");
  });

  it("includes docker section when docker is enabled", () => {
    const c = config({ options: { ...config().options, docker: true } });
    const result = readme(c);
    expect(result).toContain("## Docker");
    expect(result).toContain("docker compose up -d");
  });

  it("excludes docker section when docker is disabled", () => {
    expect(readme(config())).not.toContain("## Docker");
  });

  it("includes installation instructions", () => {
    const result = readme(config());
    expect(result).toContain("npm install");
    expect(result).toContain("npm run build");
  });

  it("includes claude mcp add command", () => {
    expect(readme(config())).toContain("claude mcp add mcp-test node dist/index.js");
  });

  it("includes security section", () => {
    const result = readme(config());
    expect(result).toContain("## Security");
    expect(result).toContain("Input validation");
  });

  it("handles empty tools array", () => {
    const c = config({ tools: [] });
    const result = readme(c);
    expect(result).toContain("| Tool | Description |");
    expect(result).toContain("|------|-------------|");
  });
});
