# Example: Git MCP Server

Complete ForgeConfig for a git MCP server with 5 tools.

## Config

```json
{
  "projectName": "mcp-git",
  "serverName": "mcp-git",
  "cliName": "git",
  "cliDescription": "distributed version control system",
  "sourceType": "cli",
  "tools": [
    {
      "name": "git_status",
      "description": "Show working tree status",
      "command": "git",
      "args": ["status", "--porcelain"],
      "params": [
        {
          "name": "path",
          "type": "string",
          "description": "Repository path",
          "required": false,
          "isPath": true
        }
      ]
    },
    {
      "name": "git_log",
      "description": "Show commit history",
      "command": "git",
      "args": ["log", "--oneline"],
      "params": [
        {
          "name": "count",
          "type": "number",
          "description": "Number of commits to show",
          "required": false,
          "default": 10,
          "min": 1,
          "max": 100
        },
        {
          "name": "path",
          "type": "string",
          "description": "Repository path",
          "required": false,
          "isPath": true
        }
      ]
    },
    {
      "name": "git_diff",
      "description": "Show changes between commits or working tree",
      "command": "git",
      "args": ["diff"],
      "params": [
        {
          "name": "staged",
          "type": "boolean",
          "description": "Show staged changes only",
          "required": false,
          "default": false
        },
        {
          "name": "path",
          "type": "string",
          "description": "Repository path",
          "required": false,
          "isPath": true
        }
      ]
    },
    {
      "name": "git_branch",
      "description": "List branches",
      "command": "git",
      "args": ["branch", "--list"],
      "params": [
        {
          "name": "all",
          "type": "boolean",
          "description": "Include remote branches",
          "required": false,
          "default": false
        },
        {
          "name": "path",
          "type": "string",
          "description": "Repository path",
          "required": false,
          "isPath": true
        }
      ]
    },
    {
      "name": "git_show",
      "description": "Show commit details",
      "command": "git",
      "args": ["show", "--stat"],
      "params": [
        {
          "name": "ref",
          "type": "string",
          "description": "Commit reference",
          "required": false,
          "default": "HEAD",
          "pattern": "^[a-zA-Z0-9._\\/-]+$"
        },
        {
          "name": "path",
          "type": "string",
          "description": "Repository path",
          "required": false,
          "isPath": true
        }
      ]
    }
  ],
  "options": {
    "docker": true,
    "systemd": false,
    "port": 3100,
    "allowedCommands": ["git"],
    "apkPackages": ["git"]
  }
}
```

## Generated structure

```
mcp-git/
  package.json
  tsconfig.json
  vitest.config.ts
  .gitignore
  Dockerfile
  docker-compose.yml
  README.md
  src/
    index.ts
    lib/
      logger.ts
      security.ts
      health.ts
    tools/
      git-status.ts
      git-log.ts
      git-diff.ts
      git-branch.ts
      git-show.ts
      __tests__/
        git-status.test.ts
        git-log.test.ts
        git-diff.test.ts
        git-branch.test.ts
        git-show.test.ts
```

## Tool enhancement example

The generator creates a working `git-diff.ts` but the `staged` flag needs manual argument mapping:

```typescript
// before (generated boilerplate)
const cmdArgs = ["diff"];
if (staged !== undefined) cmdArgs.push(String(staged));

// after (manual fix)
const cmdArgs = ["diff"];
if (staged) cmdArgs.push("--staged");
```
