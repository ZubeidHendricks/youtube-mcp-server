#!/usr/bin/env node

import 'dotenv/config';
import { startMcpServer } from './server.js';
import { hasConfiguredYouTubeApiKey } from './services/youtube-client.js';

// Check for required environment variables
if (!hasConfiguredYouTubeApiKey()) {
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
