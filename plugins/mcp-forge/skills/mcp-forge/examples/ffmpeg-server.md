# Example: FFmpeg MCP Server

Complete ForgeConfig for an ffmpeg MCP server with 5 tools.

## Config

```json
{
  "projectName": "mcp-ffmpeg",
  "serverName": "mcp-ffmpeg",
  "cliName": "ffmpeg",
  "cliDescription": "multimedia processing and conversion",
  "sourceType": "cli",
  "tools": [
    {
      "name": "ffprobe_info",
      "description": "Get media file information via ffprobe",
      "command": "ffprobe",
      "args": ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams"],
      "params": [
        {
          "name": "file",
          "type": "string",
          "description": "Path to media file",
          "required": true,
          "isPath": true
        }
      ]
    },
    {
      "name": "ffmpeg_convert",
      "description": "Convert media between formats",
      "command": "ffmpeg",
      "args": ["-y"],
      "params": [
        {
          "name": "input",
          "type": "string",
          "description": "Input file path",
          "required": true,
          "isPath": true
        },
        {
          "name": "output",
          "type": "string",
          "description": "Output file path",
          "required": true,
          "isPath": true
        },
        {
          "name": "format",
          "type": "enum",
          "description": "Output format",
          "required": false,
          "enumValues": ["mp4", "mkv", "webm", "mp3", "wav", "ogg", "flac"]
        }
      ]
    },
    {
      "name": "ffmpeg_extract_audio",
      "description": "Extract audio track from a video file",
      "command": "ffmpeg",
      "args": ["-y", "-vn"],
      "params": [
        {
          "name": "input",
          "type": "string",
          "description": "Input video file path",
          "required": true,
          "isPath": true
        },
        {
          "name": "output",
          "type": "string",
          "description": "Output audio file path",
          "required": true,
          "isPath": true
        },
        {
          "name": "codec",
          "type": "enum",
          "description": "Audio codec",
          "required": false,
          "default": "copy",
          "enumValues": ["copy", "aac", "mp3", "flac", "opus"]
        }
      ]
    },
    {
      "name": "ffmpeg_thumbnail",
      "description": "Generate a thumbnail image from a video",
      "command": "ffmpeg",
      "args": ["-y", "-frames:v", "1"],
      "params": [
        {
          "name": "input",
          "type": "string",
          "description": "Input video file path",
          "required": true,
          "isPath": true
        },
        {
          "name": "output",
          "type": "string",
          "description": "Output image file path",
          "required": true,
          "isPath": true
        },
        {
          "name": "timestamp",
          "type": "string",
          "description": "Timestamp to capture (e.g. 00:00:05)",
          "required": false,
          "default": "00:00:01",
          "pattern": "^[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]+)?$"
        }
      ]
    },
    {
      "name": "ffmpeg_trim",
      "description": "Trim a clip from a media file",
      "command": "ffmpeg",
      "args": ["-y", "-c", "copy"],
      "params": [
        {
          "name": "input",
          "type": "string",
          "description": "Input file path",
          "required": true,
          "isPath": true
        },
        {
          "name": "output",
          "type": "string",
          "description": "Output file path",
          "required": true,
          "isPath": true
        },
        {
          "name": "start",
          "type": "string",
          "description": "Start timestamp (e.g. 00:01:30)",
          "required": true,
          "pattern": "^[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]+)?$"
        },
        {
          "name": "duration",
          "type": "string",
          "description": "Duration (e.g. 00:00:30)",
          "required": false,
          "pattern": "^[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]+)?$"
        }
      ]
    }
  ],
  "options": {
    "docker": true,
    "systemd": false,
    "port": 3102,
    "allowedCommands": ["ffmpeg", "ffprobe"],
    "apkPackages": ["ffmpeg"]
  }
}
```

## Generated structure

```
mcp-ffmpeg/
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
      ffprobe-info.ts
      ffmpeg-convert.ts
      ffmpeg-extract-audio.ts
      ffmpeg-thumbnail.ts
      ffmpeg-trim.ts
      __tests__/
        ffprobe-info.test.ts
        ffmpeg-convert.test.ts
        ffmpeg-extract-audio.test.ts
        ffmpeg-thumbnail.test.ts
        ffmpeg-trim.test.ts
```

## Tool enhancement example

The `ffmpeg_thumbnail` tool needs the `-ss` flag mapped for timestamp seeking:

```typescript
// before (generated)
const cmdArgs = ["-y", "-frames:v", "1"];
cmdArgs.push("-i", input);
if (timestamp !== undefined) cmdArgs.push(String(timestamp));
cmdArgs.push(output);

// after (enhanced)
const cmdArgs = ["-y", "-ss", timestamp ?? "00:00:01", "-i", input, "-frames:v", "1", output];
```
