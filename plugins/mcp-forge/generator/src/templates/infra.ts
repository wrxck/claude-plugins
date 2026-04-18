import type { ForgeConfig } from "../config.js";

export function dockerfile(c: ForgeConfig): string {
  const pkgs = c.options.apkPackages?.join(" ") ?? c.cliName;
  return `FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine
RUN apk add --no-cache ${pkgs}
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist
USER node
ENTRYPOINT ["node", "dist/index.js"]
`;
}

export function dockerCompose(c: ForgeConfig): string {
  return `name: ${c.projectName}

services:
  ${c.projectName}:
    build: .
    container_name: ${c.projectName}
    restart: unless-stopped
    stdin_open: true
    environment:
      - NODE_ENV=production
`;
}

export function systemdService(c: ForgeConfig): string {
  const wd = c.options.workingDirectory ?? `/home/matt/${c.projectName}`;
  return `[Unit]
Description=${c.serverName} Docker Service
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${wd}
ExecStartPre=-/usr/bin/docker compose down
ExecStart=/usr/bin/docker compose up -d --force-recreate
ExecStop=/usr/bin/docker compose down --timeout 30
ExecReload=/usr/bin/docker compose restart
TimeoutStartSec=300
TimeoutStopSec=60
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
`;
}
