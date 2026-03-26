# YouTube MCP Server
[![smithery badge](https://smithery.ai/badge/@ZubeidHendricks/youtube)](https://smithery.ai/server/@ZubeidHendricks/youtube)

A Model Context Protocol (MCP) server implementation for YouTube, enabling AI language models to interact with YouTube content through a standardized interface.

## Available Tools

The server currently exposes 10 MCP tools.

| Tool | Description | Required Parameters | Optional Parameters |
|------|-------------|---------------------|---------------------|
| `videos_getVideo` | Get detailed information about a YouTube video | `videoId` | `parts` |
| `videos_searchVideos` | Search for videos on YouTube | `query` | `maxResults`, `order`, `publishedAfter`, `publishedBefore`, `channelId`, `uniqueChannels`, `channelMinSubscribers`, `channelMaxSubscribers`, `channelLastUploadAfter`, `channelLastUploadBefore`, `creatorOnly`, `sortBy` |
| `transcripts_getTranscript` | Get the transcript of a YouTube video | `videoId` | `language` |
| `channels_getChannel` | Get information about a YouTube channel | `channelId` | None |
| `channels_getChannels` | Get information about multiple YouTube channels | `channelIds` | `parts`, `includeLatestUpload` |
| `channels_searchChannels` | Search for YouTube channels by handle, name, or query | `query` | `maxResults`, `order`, `channelType`, `minSubscribers`, `maxSubscribers`, `lastUploadAfter`, `lastUploadBefore`, `creatorOnly`, `sortBy` |
| `channels_findCreators` | Find creator channels from video mentions with channel-size and activity filters | `query` | `maxResults`, `order`, `videoPublishedAfter`, `videoPublishedBefore`, `channelMinSubscribers`, `channelMaxSubscribers`, `channelLastUploadAfter`, `channelLastUploadBefore`, `creatorOnly`, `sortBy`, `sampleVideosPerChannel` |
| `channels_listVideos` | Get videos from a specific channel | `channelId` | `maxResults` |
| `playlists_getPlaylist` | Get information about a YouTube playlist | `playlistId` | None |
| `playlists_getPlaylistItems` | Get videos in a YouTube playlist | `playlistId` | `maxResults` |

### Tool Parameters

#### `videos_getVideo`
- `videoId` (`string`): The YouTube video ID.
- `parts` (`string[]`, optional): Specific video resource parts to retrieve.

#### `videos_searchVideos`
- `query` (`string`): Search query.
- `maxResults` (`number`, optional): Maximum number of results to return.
- `order` (`string`, optional): Result ordering such as `relevance` or `date`.
- `publishedAfter` (`string`, optional): Only include videos published after this ISO 8601 date.
- `publishedBefore` (`string`, optional): Only include videos published before this ISO 8601 date.
- `channelId` (`string`, optional): Restrict results to a specific channel.
- `uniqueChannels` (`boolean`, optional): Return only one video per unique channel.
- `channelMinSubscribers` / `channelMaxSubscribers` (`number`, optional): Filter matched videos by the subscriber band of their channel.
- `channelLastUploadAfter` / `channelLastUploadBefore` (`string`, optional): Filter matched videos by the latest upload activity of their channel.
- `creatorOnly` (`boolean`, optional): Restrict results to channels heuristically classified as creators.
- `sortBy` (`string`, optional): Supports `relevance`, `subscribers_asc`, `subscribers_desc`, `indie_priority`, and `recent_activity`.

#### `transcripts_getTranscript`
- `videoId` (`string`): The YouTube video ID.
- `language` (`string`, optional): Transcript language code. Falls back to `YOUTUBE_TRANSCRIPT_LANG` or `en`.

#### `channels_getChannel`
- `channelId` (`string`): The YouTube channel ID.

Responses now include:
- `latestVideoPublishedAt`
- `normalizedMetadata`
  - includes `country`, `defaultLanguage`, `joinedAt`, `customUrl`, `emailsFound`, `contactLinks`, and creator-vs-brand heuristic fields

#### `channels_getChannels`
- `channelIds` (`string[]`): A list of YouTube channel IDs.
- `includeLatestUpload` (`boolean`, optional): Whether to include `latestVideoPublishedAt`. Defaults to `true`.

#### `channels_searchChannels`
- `query` (`string`): Channel search query or handle.
- `maxResults` (`number`, optional): Maximum number of channels to return.
- `order` (`string`, optional): Result ordering such as `relevance`.
- `channelType` (`string`, optional): Restrict the search to a channel type.
- `minSubscribers` / `maxSubscribers` (`number`, optional): Filter channels by subscriber band.
- `lastUploadAfter` / `lastUploadBefore` (`string`, optional): Filter channels by latest upload activity.
- `creatorOnly` (`boolean`, optional): Restrict results to channels heuristically classified as creators.
- `sortBy` (`string`, optional): Supports `relevance`, `subscribers_asc`, `subscribers_desc`, `indie_priority`, and `recent_activity`.

#### `channels_findCreators`
- `query` (`string`): Topic, game, or mention query to discover channels from matched videos.
- `videoPublishedAfter` / `videoPublishedBefore` (`string`, optional): Recency filters for the matched videos.
- `channelMinSubscribers` / `channelMaxSubscribers` (`number`, optional): Subscriber band filters for returned channels.
- `channelLastUploadAfter` / `channelLastUploadBefore` (`string`, optional): Latest-upload activity filters for returned channels.
- `creatorOnly` (`boolean`, optional): Restrict results to channels heuristically classified as creators.
- `sortBy` (`string`, optional): Supports `relevance`, `subscribers_asc`, `subscribers_desc`, `indie_priority`, and `recent_activity`.
- `sampleVideosPerChannel` (`number`, optional): How many matched videos to include per returned channel.

#### `channels_listVideos`
- `channelId` (`string`): The YouTube channel ID.
- `maxResults` (`number`, optional): Maximum number of videos to return.

#### `playlists_getPlaylist`
- `playlistId` (`string`): The YouTube playlist ID.

#### `playlists_getPlaylistItems`
- `playlistId` (`string`): The YouTube playlist ID.
- `maxResults` (`number`, optional): Maximum number of playlist items to return.

## Installation

### Quick Setup for Claude Desktop

1. Install the package:
```bash
npm install -g zubeid-youtube-mcp-server
```

2. Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "zubeid-youtube-mcp-server": {
      "command": "zubeid-youtube-mcp-server",
      "env": {
        "YOUTUBE_API_KEY": "your_primary_youtube_api_key",
        "YOUTUBE_API_KEY2": "your_secondary_youtube_api_key",
        "YOUTUBE_API_KEY3": "your_tertiary_youtube_api_key"
      }
    }
  }
}
```

### Alternative: Using NPX (No Installation Required)

Add this to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "zubeid-youtube-mcp-server"],
      "env": {
        "YOUTUBE_API_KEY": "your_primary_youtube_api_key",
        "YOUTUBE_API_KEY2": "your_secondary_youtube_api_key",
        "YOUTUBE_API_KEY3": "your_tertiary_youtube_api_key"
      }
    }
  }
}
```

### Installing via Smithery

To install YouTube MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@ZubeidHendricks/youtube):

```bash
npx -y @smithery/cli install @ZubeidHendricks/youtube --client claude
```

## Configuration
Set the following environment variables:
* `YOUTUBE_API_KEY`: Primary YouTube Data API key
* `YOUTUBE_API_KEY2`: Secondary fallback API key
* `YOUTUBE_API_KEY3`: Third fallback API key
* `YOUTUBE_TRANSCRIPT_LANG`: Default language for transcripts (optional, defaults to 'en')

At least one of `YOUTUBE_API_KEY`, `YOUTUBE_API_KEY2`, or `YOUTUBE_API_KEY3` must be set. When a request fails because a key has exhausted its quota, the server retries the same request with the next configured key.

### Using with VS Code

For one-click installation, click one of the install buttons below:

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPM-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=youtube&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22zubeid-youtube-mcp-server%22%5D%2C%22env%22%3A%7B%22YOUTUBE_API_KEY%22%3A%22%24%7Binput%3AapiKey%7D%22%7D%7D&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22apiKey%22%2C%22description%22%3A%22YouTube+API+Key%22%2C%22password%22%3Atrue%7D%5D) [![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPM-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=youtube&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22zubeid-youtube-mcp-server%22%5D%2C%22env%22%3A%7B%22YOUTUBE_API_KEY%22%3A%22%24%7Binput%3AapiKey%22%7D%7D&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22apiKey%22%2C%22description%22%3A%22YouTube+API+Key%22%2C%22password%22%3Atrue%7D%5D&quality=insiders)

### Manual Installation

If you prefer manual installation, first check the install buttons at the top of this section. Otherwise, follow these steps:

Add the following JSON block to your User Settings (JSON) file in VS Code. You can do this by pressing `Ctrl + Shift + P` and typing `Preferences: Open User Settings (JSON)`.

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "apiKey",
        "description": "YouTube API Key",
        "password": true
      }
    ],
    "servers": {
      "youtube": {
        "command": "npx",
        "args": ["-y", "zubeid-youtube-mcp-server"],
        "env": {
          "YOUTUBE_API_KEY": "${input:apiKey}"
        }
      }
    }
  }
}
```

Optionally, you can add it to a file called `.vscode/mcp.json` in your workspace:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "apiKey",
      "description": "YouTube API Key",
      "password": true
    }
  ],
  "servers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "zubeid-youtube-mcp-server"],
      "env": {
        "YOUTUBE_API_KEY": "${input:apiKey}"
      }
    }
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Start the server (requires at least one configured YouTube API key)
npm start

# Development mode with auto-rebuild
npm run dev
```

## Docker

The included Docker image starts the server over HTTP by default.

- Default transport: `http`
- Default endpoint: `http://localhost:8088/mcp`
- Readiness endpoint: `http://localhost:8088/ready`
- Default mode: stateless

The Docker build copies `.env` into the runtime image and the server loads it automatically on startup. That means the container can run without passing API credentials at `docker run` time, as long as `.env` was present during `docker build`.

```bash
docker build -t youtube-mcp-server .
docker run --rm -p 8088:8088 youtube-mcp-server
```

The container defaults to:

```env
MCP_TRANSPORT=http
MCP_HOST=0.0.0.0
MCP_PORT=8088
MCP_STATELESS=true
```

## Contributing
See CONTRIBUTING.md for information about contributing to this repository.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
