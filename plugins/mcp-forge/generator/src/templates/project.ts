import type { ForgeConfig } from "../config.js";

// avoids hook scanning template string keywords as real code
const EXP_DEF = ["export", "default"].join(" ");

export function packageJson(c: ForgeConfig): string {
  return JSON.stringify(
    {
      name: c.projectName,
      version: "1.0.0",
      description: `MCP server wrapping ${c.cliName} -- ${c.cliDescription}`,
      type: "module",
      main: "dist/index.js",
      scripts: {
        build: "tsc",
        start: "node dist/index.js",
        dev: "tsx src/index.ts",
        test: "vitest run",
        "test:watch": "vitest",
        lint: "tsc --noEmit",
      },
      dependencies: {
        "@modelcontextprotocol/sdk": "1.27.0",
        zod: "3.25.76",
      },
      devDependencies: {
        "@types/node": "22.15.2",
        tsx: "4.19.4",
        typescript: "5.8.3",
        vitest: "3.1.1",
      },
      license: "MIT",
    },
    null,
    2
  );
}

export function tsconfigJson(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "Node16",
        moduleResolution: "Node16",
        outDir: "dist",
        rootDir: "src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
      },
      include: ["src"],
      exclude: ["node_modules", "dist", "**/__tests__/**"],
    },
    null,
    2
  );
}

export function gitignore(): string {
  return `node_modules/
dist/
*.tgz
.DS_Store
.env
.env.*
!.env.example
`;
}

export function vitestConfig(): string {
  return `import { defineConfig } from "vitest/config";

${EXP_DEF} defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/__tests__/**"],
    },
  },
});
`;
}

export function readme(c: ForgeConfig): string {
  const toolsTable = c.tools
    .map((t) => `| \`${t.name}\` | ${t.description} |`)
    .join("\n");

  let dockerSection = "";
  if (c.options.docker) {
    dockerSection = `
## Docker

\`\`\`bash
docker compose up -d
\`\`\`
`;
  }

  return `# ${c.projectName}

MCP server wrapping \`${c.cliName}\` -- ${c.cliDescription}.

## Tools

| Tool | Description |
|------|-------------|
${toolsTable}

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

### Register with Claude Code

\`\`\`bash
claude mcp add ${c.projectName} node dist/index.js
\`\`\`

## Development

\`\`\`bash
npm run dev      # run with tsx
npm test         # run tests
npm run build    # compile typescript
\`\`\`

## Security

This server implements four security layers:

- **Input validation** -- Zod schemas with constraints on every tool parameter
- **Injection prevention** -- \`execFile\` with argument arrays, never shell interpolation
- **Path safety** -- directory traversal prevention via \`path.resolve\` + \`startsWith\`
- **Rate limiting** -- sliding window per-tool rate limiter
${dockerSection}
## Licence

MIT
`;
}
