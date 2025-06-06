import { VideoParams, SearchParams, TranscriptParams, ChannelParams, ChannelVideosParams, PlaylistParams, PlaylistItemsParams } from './types';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { VideoService } from './services/video';
import { TranscriptService } from './services/transcript';
import { PlaylistService } from './services/playlist';
import { ChannelService } from './services/channel';

export async function startMcpServer() {
    // Create MCP server
    const server = new McpServer({
        name: 'YouTube MCP Server',
        version: '1.0.0',
        description: 'MCP Server for interacting with YouTube content and services',
    });

    // Create service instances - they won't initialize APIs until methods are called
    const videoService = new VideoService();
    const transcriptService = new TranscriptService();
    const playlistService = new PlaylistService();
    const channelService = new ChannelService();

    // Register video tools
    server.tool('videos_getVideo', {
        description: 'Get detailed information about a YouTube video',
        inputSchema: {
            type: 'object',
            properties: {
                videoId: {
                    type: 'string',
                    description: 'The YouTube video ID',
                },
                parts: {
                    type: 'array',
                    description: 'Parts of the video to retrieve',
                    items: {
                        type: 'string',
                    },
                },
            },
            required: ['videoId'],
        },
    }, async (params) => {
        try {
            const result = await videoService.getVideo(params as VideoParams);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`
                }],
                isError: true
            };
        }
    });

    server.tool('videos_searchVideos', {
        description: 'Search for videos on YouTube',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query',
                },
                maxResults: {
                    type: 'number',
                    description: 'Maximum number of results to return',
                },
            },
            required: ['query'],
        },
    }, async (params) => {
        try {
            const result = await videoService.searchVideos(params as SearchParams);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`
                }],
                isError: true
            };
        }
    });

    // Register transcript tools
    server.tool('transcripts_getTranscript', {
        description: 'Get the transcript of a YouTube video',
        inputSchema: {
            type: 'object',
            properties: {
                videoId: {
                    type: 'string',
                    description: 'The YouTube video ID',
                },
                language: {
                    type: 'string',
                    description: 'Language code for the transcript',
                },
            },
            required: ['videoId'],
        },
    }, async (params) => {
        try {
            const result = await transcriptService.getTranscript(params as TranscriptParams);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`
                }],
                isError: true
            };
        }
    });

    // Register channel tools
    server.tool('channels_getChannel', {
        description: 'Get information about a YouTube channel',
        inputSchema: {
            type: 'object',
            properties: {
                channelId: {
                    type: 'string',
                    description: 'The YouTube channel ID',
                },
            },
            required: ['channelId'],
        },
    }, async (params) => {
        try {
            const result = await channelService.getChannel(params as ChannelParams);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`
                }],
                isError: true
            };
        }
    });

    server.tool('channels_listVideos', {
        description: 'Get videos from a specific channel',
        inputSchema: {
            type: 'object',
            properties: {
                channelId: {
                    type: 'string',
                    description: 'The YouTube channel ID',
                },
                maxResults: {
                    type: 'number',
                    description: 'Maximum number of results to return',
                },
            },
            required: ['channelId'],
        },
    }, async (params) => {
        try {
            const result = await channelService.listVideos(params as ChannelVideosParams);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`
                }],
                isError: true
            };
        }
    });

    // Register playlist tools
    server.tool('playlists_getPlaylist', {
        description: 'Get information about a YouTube playlist',
        inputSchema: {
            type: 'object',
            properties: {
                playlistId: {
                    type: 'string',
                    description: 'The YouTube playlist ID',
                },
            },
            required: ['playlistId'],
        },
    }, async (params) => {
        try {
            const result = await playlistService.getPlaylist(params as PlaylistParams);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`
                }],
                isError: true
            };
        }
    });

    server.tool('playlists_getPlaylistItems', {
        description: 'Get videos in a YouTube playlist',
        inputSchema: {
            type: 'object',
            properties: {
                playlistId: {
                    type: 'string',
                    description: 'The YouTube playlist ID',
                },
                maxResults: {
                    type: 'number',
                    description: 'Maximum number of results to return',
                },
            },
            required: ['playlistId'],
        },
    }, async (params) => {
        try {
            const result = await playlistService.getPlaylistItems(params as PlaylistItemsParams);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`
                }],
                isError: true
            };
        }
    });

    // Create transport and connect
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // Log the server info
    console.log(`YouTube MCP Server v1.0.0 started successfully`);
    console.log(`Server will validate YouTube API key when tools are called`);
    
    return server;
}
