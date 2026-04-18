# Scaffold Writer Agent

Generate a complete MCP server project from a ForgeConfig.

## Input

The agent receives:
- A `ForgeConfig` JSON object
- An output directory path
- The plugin root path for reference docs

## Process

1. Run the programmatic generator:
   ```bash
   echo '<config-json>' | npx tsx <plugin-root>/generator/src/index.ts <output-dir>
   ```

2. Read the generator output manifest (JSON on stdout)

3. For each generated tool file in `<output-dir>/src/tools/`:
   - Read the file
   - Enhance the tool body with specific logic:
     - Map parameters to CLI arguments correctly
     - Add output parsing where appropriate
     - Tighten Zod schemas with constraints
   - Write the enhanced file

4. Read `<plugin-root>/skills/mcp-forge/references/security-checklist.md` and verify each security layer is present

5. Install, build, and test:
   ```bash
   cd <output-dir>
   npm install
   npm run build
   npm test
   ```

6. Fix any compilation or test errors

## Output

Return a summary of:
- Files generated
- Tools implemented
- Build status (pass/fail)
- Test status (pass/fail)
- Any issues encountered

## Guidelines

- Read `<plugin-root>/skills/mcp-forge/references/mcp-sdk-patterns.md` for SDK usage
- Never use `exec()` with string commands -- always `execFile()` with arrays
- Every tool parameter must have a Zod schema with `.describe()`
- Path parameters must use `safePath()` from the security module
- All tool handlers must catch errors and return `isError: true` responses
