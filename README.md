# claude-plugins

Curated Claude Code plugins by Matt Hesketh.

## Available plugins

### Development

| Plugin | Description |
|--------|-------------|
| [mcp-forge](https://github.com/wrxck/mcp-forge) | Scaffold hardened MCP servers wrapping CLI tools |
| [git-workflow](https://github.com/wrxck/git-workflow) | Commit validation, conventional commits, PRs, releases, code review |

### Code Quality

| Plugin | Description |
|--------|-------------|
| [typescript-quality](https://github.com/wrxck/typescript-quality) | No any types, named exports, no console.log/debugger |
| [react-quality](https://github.com/wrxck/react-quality) | Accessibility, semantic HTML, no inline styles |
| [jest-quality](https://github.com/wrxck/jest-quality) | Proper mock typing with jest.mocked() patterns |
| [cpp-safety](https://github.com/wrxck/cpp-safety) | Memory safety checks, smart pointers, safe string functions |
| [code-style](https://github.com/wrxck/code-style) | Comments, imports, file length, icons, TODOs, library choices |
| [package-guard](https://github.com/wrxck/package-guard) | Enforce exact versions, check outdated/vulnerable packages |

### Security

| Plugin | Description |
|--------|-------------|
| [security-guard](https://github.com/wrxck/security-guard) | Prevent secret leaks and block sudo commands |
| [db-safety](https://github.com/wrxck/db-safety) | Prevent accidental data destruction, migration safety |

### Infrastructure

| Plugin | Description |
|--------|-------------|
| [docker-guard](https://github.com/wrxck/docker-guard) | Dockerfile best practices, compose validation, dangerous command blocking |
| [infra-guard](https://github.com/wrxck/infra-guard) | Nginx security, port exposure, infra changes, env sync, hardening audits |
| [deploy-guard](https://github.com/wrxck/deploy-guard) | Smoke tests, perf regression detection, test gates, CI scaffolding |

### Documentation

| Plugin | Description |
|--------|-------------|
| [diagram-expert](https://github.com/wrxck/diagram-expert) | Create detailed Mermaid diagrams and improve READMEs |

## Installation

```bash
claude plugin marketplace add wrxck/claude-plugins
claude plugin install <plugin-name>@wrxck-claude-plugins
```

## Licence

MIT
