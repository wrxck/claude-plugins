import { describe, it, expect } from "vitest";

import type { ForgeConfig } from "../config.js";
import { dockerfile, dockerCompose, systemdService } from "../templates/infra.js";

function config(overrides: Partial<ForgeConfig> = {}): ForgeConfig {
  return {
    projectName: "mcp-test",
    serverName: "test-server",
    cliName: "testcli",
    cliDescription: "a test cli tool",
    sourceType: "cli",
    tools: [],
    options: {
      docker: true,
      systemd: true,
      port: 3000,
      allowedCommands: ["testcli"],
    },
    ...overrides,
  };
}

describe("dockerfile", () => {
  it("uses node:22-alpine base image", () => {
    expect(dockerfile(config())).toContain("FROM node:22-alpine");
  });

  it("uses multi-stage build", () => {
    const result = dockerfile(config());
    expect(result).toContain("FROM node:22-alpine AS builder");
    expect(result).toContain("COPY --from=builder /app/dist ./dist");
  });

  it("installs cli name as apk package by default", () => {
    expect(dockerfile(config())).toContain("apk add --no-cache testcli");
  });

  it("installs custom apk packages when specified", () => {
    const c = config({
      options: { ...config().options, apkPackages: ["git", "curl", "jq"] },
    });
    expect(dockerfile(c)).toContain("apk add --no-cache git curl jq");
  });

  it("runs npm ci for both stages", () => {
    const result = dockerfile(config());
    expect(result).toContain("RUN npm ci --ignore-scripts");
    expect(result).toContain("RUN npm ci --omit=dev --ignore-scripts");
  });

  it("copies source and builds", () => {
    const result = dockerfile(config());
    expect(result).toContain("COPY src/ ./src/");
    expect(result).toContain("RUN npm run build");
  });

  it("runs as non-root user", () => {
    expect(dockerfile(config())).toContain("USER node");
  });

  it("sets entrypoint to node dist/index.js", () => {
    expect(dockerfile(config())).toContain('ENTRYPOINT ["node", "dist/index.js"]');
  });
});

describe("dockerCompose", () => {
  it("uses project name", () => {
    expect(dockerCompose(config())).toContain("name: mcp-test");
  });

  it("sets container name to project name", () => {
    expect(dockerCompose(config())).toContain("container_name: mcp-test");
  });

  it("uses build context", () => {
    expect(dockerCompose(config())).toContain("build: .");
  });

  it("sets restart policy", () => {
    expect(dockerCompose(config())).toContain("restart: unless-stopped");
  });

  it("enables stdin", () => {
    expect(dockerCompose(config())).toContain("stdin_open: true");
  });

  it("sets NODE_ENV to production", () => {
    expect(dockerCompose(config())).toContain("NODE_ENV=production");
  });
});

describe("systemdService", () => {
  it("uses server name in description", () => {
    expect(systemdService(config())).toContain(
      "Description=test-server Docker Service"
    );
  });

  it("requires docker.service", () => {
    const result = systemdService(config());
    expect(result).toContain("Requires=docker.service");
    expect(result).toContain("After=docker.service network-online.target");
  });

  it("uses default working directory based on project name", () => {
    expect(systemdService(config())).toContain(
      "WorkingDirectory=/home/matt/mcp-test"
    );
  });

  it("uses custom working directory when specified", () => {
    const c = config({
      options: { ...config().options, workingDirectory: "/opt/services/mcp-test" },
    });
    expect(systemdService(c)).toContain(
      "WorkingDirectory=/opt/services/mcp-test"
    );
  });

  it("is a oneshot service with RemainAfterExit", () => {
    const result = systemdService(config());
    expect(result).toContain("Type=oneshot");
    expect(result).toContain("RemainAfterExit=yes");
  });

  it("includes docker compose commands", () => {
    const result = systemdService(config());
    expect(result).toContain("ExecStartPre=-/usr/bin/docker compose down");
    expect(result).toContain(
      "ExecStart=/usr/bin/docker compose up -d --force-recreate"
    );
    expect(result).toContain("ExecStop=/usr/bin/docker compose down --timeout 30");
    expect(result).toContain("ExecReload=/usr/bin/docker compose restart");
  });

  it("sets appropriate timeouts", () => {
    const result = systemdService(config());
    expect(result).toContain("TimeoutStartSec=300");
    expect(result).toContain("TimeoutStopSec=60");
  });

  it("configures restart on failure", () => {
    const result = systemdService(config());
    expect(result).toContain("Restart=on-failure");
    expect(result).toContain("RestartSec=10");
  });

  it("targets multi-user", () => {
    expect(systemdService(config())).toContain("WantedBy=multi-user.target");
  });
});
