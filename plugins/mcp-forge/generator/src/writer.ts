import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";

import type { ForgeConfig } from "./config.js";
import * as t from "./templates/index.js";

function kebabCase(s: string): string {
  return s.replace(/_/g, "-");
}

function write(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf-8");
  process.stderr.write(`  wrote ${path}\n`);
}

export function generate(config: ForgeConfig, outputDir: string): string[] {
  const files: string[] = [];
  const out = (rel: string, content: string) => {
    const full = join(outputDir, rel);
    write(full, content);
    files.push(rel);
  };

  out("package.json", t.packageJson(config));
  out("tsconfig.json", t.tsconfigJson());
  out(".gitignore", t.gitignore());
  out("vitest.config.ts", t.vitestConfig());

  out("src/lib/logger.ts", t.loggerModule());
  out("src/lib/security.ts", t.securityModule(config));
  out("src/lib/health.ts", t.healthModule(config));

  for (const tool of config.tools) {
    const kebab = kebabCase(tool.name);
    out(`src/tools/${kebab}.ts`, t.toolModule(tool));
    out(`src/tools/__tests__/${kebab}.test.ts`, t.testModule(tool));
  }

  out("src/index.ts", t.serverEntry(config));

  if (config.options.docker) {
    out("Dockerfile", t.dockerfile(config));
    out("docker-compose.yml", t.dockerCompose(config));
  }

  if (config.options.systemd) {
    out(`${config.projectName}.service`, t.systemdService(config));
  }

  out("README.md", t.readme(config));

  return files;
}
