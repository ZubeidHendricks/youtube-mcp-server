#!/usr/bin/env node

import 'dotenv/config';
import { startMcpServer } from './server.js';
import { hasConfiguredYouTubeApiKey } from './services/youtube-client.js';
import { remoteAuthorizationEnabled } from './services/request-auth.js';

// With remote authorization every HTTP request brings its own token, so the
// server needs no key of its own. It only makes sense over HTTP: STDIO has no
// per-request header to carry one.
if (remoteAuthorizationEnabled()) {
    if ((process.env.MCP_TRANSPORT || 'stdio').toLowerCase() !== 'http') {
        console.error('Error: MCP_REMOTE_AUTHORIZATION=true requires MCP_TRANSPORT=http.');
        process.exit(1);
    }
} else if (!hasConfiguredYouTubeApiKey()) {
    console.error('Error: at least one YouTube API key is required.');
    console.error('Set YOUTUBE_API_KEY, YOUTUBE_API_KEY2, or YOUTUBE_API_KEY3 before running this server.');
    process.exit(1);
}

// Start the MCP server
startMcpServer()
    .then(() => {
        console.error('YouTube MCP Server started successfully');
    })
    .catch(error => {
        console.error('Failed to start YouTube MCP Server:', error);
        process.exit(1);
    });
