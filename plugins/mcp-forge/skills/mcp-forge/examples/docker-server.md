# Example: Docker MCP Server

Complete ForgeConfig for a docker MCP server with 6 tools.

## Config

```json
{
  "projectName": "mcp-docker",
  "serverName": "mcp-docker",
  "cliName": "docker",
  "cliDescription": "container runtime and management",
  "sourceType": "cli",
  "tools": [
    {
      "name": "docker_ps",
      "description": "List running containers",
      "command": "docker",
      "args": ["ps", "--format", "json"],
      "params": [
        {
          "name": "all",
          "type": "boolean",
          "description": "Show all containers (including stopped)",
          "required": false,
          "default": false
        }
      ]
    },
    {
      "name": "docker_images",
      "description": "List local images",
      "command": "docker",
      "args": ["images", "--format", "json"],
      "params": []
    },
    {
      "name": "docker_logs",
      "description": "Fetch container logs",
      "command": "docker",
      "args": ["logs"],
      "params": [
        {
          "name": "container",
          "type": "string",
          "description": "Container name or ID",
          "required": true,
          "pattern": "^[a-zA-Z0-9._-]+$"
        },
        {
          "name": "tail",
          "type": "number",
          "description": "Number of lines from the end",
          "required": false,
          "default": 100,
          "min": 1,
          "max": 10000
        }
      ]
    },
    {
      "name": "docker_inspect",
      "description": "Inspect a container",
      "command": "docker",
      "args": ["inspect"],
      "params": [
        {
          "name": "target",
          "type": "string",
          "description": "Container or image name/ID",
          "required": true,
          "pattern": "^[a-zA-Z0-9._:/-]+$"
        }
      ]
    },
    {
      "name": "docker_stats",
      "description": "Show container resource usage",
      "command": "docker",
      "args": ["stats", "--no-stream", "--format", "json"],
      "params": []
    },
    {
      "name": "docker_compose_ps",
      "description": "List compose project containers",
      "command": "docker",
      "args": ["compose", "ps", "--format", "json"],
      "params": [
        {
          "name": "project",
          "type": "string",
          "description": "Compose project directory",
          "required": false,
          "isPath": true
        }
      ]
    }
  ],
  "options": {
    "docker": true,
    "systemd": false,
    "port": 3101,
    "allowedCommands": ["docker"],
    "apkPackages": ["docker-cli"]
  }
}
```

## Tool enhancement example

The `docker_logs` tool needs the `--tail` flag mapped correctly:

```typescript
// before (generated)
const cmdArgs = ["logs"];
cmdArgs.push(String(container));
if (tail !== undefined) cmdArgs.push(String(tail));

// after (enhanced)
const cmdArgs = ["logs", "--tail", String(tail ?? 100), container];
```
