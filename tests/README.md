# Test Scripts

This directory contains test scripts for the YouTube MCP Server.

## Comments Test

**File:** `comments.test.ts`

Tests the comment retrieval functionality of the MCP server.

### Usage

```bash
# Set your API key
export YOUTUBE_API_KEY=your_youtube_api_key

# Run the test
npm run test:comments <YouTube URL or Video ID>
```

### Examples

```bash
# Full YouTube URL
npm run test:comments "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Short URL
npm run test:comments "https://youtu.be/dQw4w9WgXcQ"

# Video ID
npm run test:comments "dQw4w9WgXcQ"
```

### Output

The script displays:

1. **Formatted Comments** - Human-readable display of 10 comments with parent IDs
2. **Optimized MCP Response** - The exact JSON structure returned by the MCP server
3. **Size Comparison** - Metrics showing the reduction in response size (~96% smaller)

### What It Tests

- Video ID extraction from various URL formats
- Comment retrieval via the CommentService
- Response optimization (removing unnecessary metadata)
- Token consumption reduction

