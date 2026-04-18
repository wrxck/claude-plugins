import { readFileSync } from "node:fs";

import type { ForgeConfig } from "./config.js";
import { generate } from "./writer.js";

const input = readFileSync(process.stdin.fd, "utf-8");
const config: ForgeConfig = JSON.parse(input);

const outputDir = process.argv[2] ?? config.projectName;

process.stderr.write(`\nmcp-forge: generating ${config.projectName} -> ${outputDir}\n\n`);

const files = generate(config, outputDir);

process.stderr.write(`\nmcp-forge: wrote ${files.length} files\n`);

const manifest = {
  projectName: config.projectName,
  outputDir,
  files,
  toolCount: config.tools.length,
  hasDocker: config.options.docker,
  hasSystemd: config.options.systemd,
};

process.stdout.write(JSON.stringify(manifest, null, 2) + "\n");
