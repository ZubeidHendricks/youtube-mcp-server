# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YouTube MCP Server is a Model Context Protocol (MCP) server implementation that enables AI language models to interact with YouTube content. It provides tools for accessing video information, transcripts, channel data, playlist management, and comment retrieval through standardized MCP interfaces.

## Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Start the server (requires YOUTUBE_API_KEY environment variable)
npm start

# Development mode with auto-rebuild and hot reload
npm run dev
```

## Architecture

### Core Structure

The project uses a **service-based architecture** with clear separation of concerns:

1. **Entry Point** (`src/cli.ts`): Validates required environment variables and starts the MCP server
2. **Server** (`src/server.ts`): Configures the MCP server, registers tools via schema handlers, and routes tool calls to services
3. **Services** (`src/services/`): Core business logic that wraps YouTube API interactions
   - `VideoService` (`src/services/video.ts`): Video details and search
   - `TranscriptService` (`src/services/transcript.ts`): Transcript retrieval
   - `PlaylistService` (`src/services/playlist.ts`): Playlist and playlist item operations
   - `ChannelService` (`src/services/channel.ts`): Channel details and video listing
   - `CommentService` (`src/services/comment.ts`): Video comments and comment replies
4. **Types** (`src/types.ts`): Shared TypeScript interfaces for service parameters
5. **Functions** (`src/functions/`): Extended functionality (excluded from compilation, available for future features)

### MCP Tool Architecture

Tools are registered through two schema handlers in `src/server.ts`:

- **ListToolsRequestSchema**: Returns the list of available tools. Each tool defines:
  - `name`: Follows pattern `{service}_{operation}` (e.g., `videos_getVideo`)
  - `description`: User-facing description for the AI model
  - `inputSchema`: JSON Schema defining required and optional parameters

- **CallToolRequestSchema**: Routes incoming tool calls by matching tool names to service methods via a switch statement. Tool arguments are passed directly to service methods, which return JSON-stringified responses.

### API Integration

All services use the **Google APIs Node.js client** (`googleapis` package):

- **Lazy Initialization**: YouTube API client is created only when a service method is first called (not in constructor)
- **Environment Configuration**: API key is loaded from `YOUTUBE_API_KEY` at initialization time
- **Error Handling**: Services catch API errors and return human-readable error messages to the MCP client

### Module System

The project uses **ES modules** (ESNext):

- `package.json`: `"type": "module"` enables ES module support
- `tsconfig.json`: `"module": "ESNext"`, `"moduleResolution": "bundler"`
- All relative imports use `.js` extensions (e.g., `import { VideoService } from './services/video.js'`)
- This setup maintains compatibility with MCP client integrations like LibreChat

## Configuration

### Environment Variables

**Required:**
- `YOUTUBE_API_KEY`: YouTube Data API v3 key from Google Cloud Console

**Optional:**
- `YOUTUBE_TRANSCRIPT_LANG`: Default language code for transcripts (defaults to 'en')

### MCP Client Configuration

The server can be configured in MCP client applications (e.g., Claude Desktop, LibreChat) using the `.mcp.json` configuration file. See `.mcp.json.example` for a template:

```json
{
  "servers": {
    "youtube-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/cli.js"],
      "env": {
        "YOUTUBE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Available Tools

The MCP server exposes the following tools:

| Tool | Purpose |
|------|---------|
| `videos_getVideo` | Get detailed video information (title, description, duration, stats) |
| `videos_searchVideos` | Search for videos on YouTube by query |
| `transcripts_getTranscript` | Retrieve video transcript with optional language selection |
| `channels_getChannel` | Get channel details and statistics |
| `channels_listVideos` | List all videos from a channel |
| `playlists_getPlaylist` | Get playlist details |
| `playlists_getPlaylistItems` | List all items in a playlist |
| `comments_getVideoComments` | Fetch top-level comments on a video (default 20, with optional reply snippets) |
| `comments_getCommentReplies` | Fetch replies to a specific comment thread |

## Build and Distribution

**Building:**
```bash
npm run build
```
TypeScript compiles to JavaScript in the `dist/` directory. The binary entry point `bin.zubeid-youtube-mcp-server` resolves to `dist/cli.js`.

**Publishing:**
```bash
npm run prepublishOnly
```
Builds the project and publishes to npm as `zubeid-youtube-mcp-server`.

**Deployment:**
- **Global Installation**: `npm install -g zubeid-youtube-mcp-server`
- **Via NPX**: `npx -y zubeid-youtube-mcp-server`
- **Via Smithery**: `npx -y @smithery/cli install @ZubeidHendricks/youtube --client claude`

## Code Style and Patterns

**Key Considerations When Making Changes:**

1. **ES Module Imports**: All relative imports require `.js` extensions. This is non-negotiable for module resolution.
2. **Service Methods**: Service methods accept parameters as plain objects matching the type interfaces in `src/types.ts`. Always ensure new parameters are properly typed.
3. **Tool Registration**: When adding new tools, register them in both the `ListToolsRequestSchema` handler (for discovery) and the `CallToolRequestSchema` handler (for execution).
4. **Error Responses**: Services return error information as JSON-stringified strings. The MCP transport layer handles serialization.
5. **No Strict Type Checking**: `tsconfig.json` has `strict: false` and `noImplicitAny: false`. While not required, consider the maintainability of new code.

## Validation and Testing

When making changes:

1. Build the project: `npm run build`
2. Start the server in development: `npm run dev` (or `npm start` with valid API key)
3. The server will validate the API key on startup via `src/cli.ts`

There are currently no automated tests configured. Manual validation involves setting `YOUTUBE_API_KEY` and verifying the server starts without errors.
