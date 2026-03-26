import { createServer as createHttpServer, IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { VideoService } from './services/video.js';
import { TranscriptService } from './services/transcript.js';
import { PlaylistService } from './services/playlist.js';
import { ChannelService } from './services/channel.js';
import {
    VideoParams,
    SearchParams,
    TranscriptParams,
    ChannelParams,
    ChannelsParams,
    ChannelSearchParams,
    ChannelVideosParams,
    CreatorDiscoveryParams,
    PlaylistParams,
    PlaylistItemsParams,
} from './types.js';

function safeSerialize(value: unknown, maxLength = 4000) {
    try {
        const serialized = JSON.stringify(value);
        if (!serialized) {
            return String(value);
        }

        return serialized.length > maxLength
            ? `${serialized.slice(0, maxLength)}... [truncated ${serialized.length - maxLength} chars]`
            : serialized;
    } catch (error) {
        return `[unserializable: ${error instanceof Error ? error.message : String(error)}]`;
    }
}

function summarizeResult(result: unknown) {
    if (Array.isArray(result)) {
        return `array(length=${result.length})`;
    }

    if (result && typeof result === 'object') {
        const record = result as Record<string, unknown>;
        const keys = Object.keys(record);

        if (Array.isArray(record.transcript)) {
            return `object(keys=${keys.join(',')}; transcript=${record.transcript.length})`;
        }

        if (Array.isArray(record.timestampedTranscript)) {
            return `object(keys=${keys.join(',')}; timestampedTranscript=${record.timestampedTranscript.length})`;
        }

        return `object(keys=${keys.join(',')})`;
    }

    return `${typeof result}(${String(result)})`;
}

function createMcpServer() {
    const server = new Server(
        {
            name: 'zubeid-youtube-mcp-server',
            version: '1.0.0',
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    const videoService = new VideoService();
    const transcriptService = new TranscriptService();
    const playlistService = new PlaylistService();
    const channelService = new ChannelService();

    server.setRequestHandler(ListToolsRequestSchema, async () => {
        console.log('[MCP] list_tools requested');
        return {
            tools: [
                {
                    name: 'videos_getVideo',
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
                },
                {
                    name: 'videos_searchVideos',
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
                            order: {
                                type: 'string',
                                description: 'Sort order for results, such as relevance or date',
                            },
                            publishedAfter: {
                                type: 'string',
                                description: 'Only include videos published after this ISO 8601 date',
                            },
                            publishedBefore: {
                                type: 'string',
                                description: 'Only include videos published before this ISO 8601 date',
                            },
                            channelId: {
                                type: 'string',
                                description: 'Restrict results to a specific channel ID',
                            },
                            uniqueChannels: {
                                type: 'boolean',
                                description: 'Return only one matched video per unique channel',
                            },
                            channelMinSubscribers: {
                                type: 'number',
                                description: 'Minimum subscriber count for the matched video channel',
                            },
                            channelMaxSubscribers: {
                                type: 'number',
                                description: 'Maximum subscriber count for the matched video channel',
                            },
                            channelLastUploadAfter: {
                                type: 'string',
                                description: 'Only include videos whose channel latest upload is after this ISO 8601 date',
                            },
                            channelLastUploadBefore: {
                                type: 'string',
                                description: 'Only include videos whose channel latest upload is before this ISO 8601 date',
                            },
                            creatorOnly: {
                                type: 'boolean',
                                description: 'Only include channels heuristically classified as creators',
                            },
                            sortBy: {
                                type: 'string',
                                description: 'Optional ranking mode such as relevance, indie_priority, subscribers_asc, subscribers_desc, or recent_activity',
                            },
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'transcripts_getTranscript',
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
                },
                {
                    name: 'channels_getChannel',
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
                },
                {
                    name: 'channels_getChannels',
                    description: 'Get information about multiple YouTube channels',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            channelIds: {
                                type: 'array',
                                description: 'A list of YouTube channel IDs',
                                items: {
                                    type: 'string',
                                },
                            },
                            parts: {
                                type: 'array',
                                description: 'Parts of the channel resource to retrieve',
                                items: {
                                    type: 'string',
                                },
                            },
                            includeLatestUpload: {
                                type: 'boolean',
                                description: 'Whether to include the latestVideoPublishedAt enrichment field',
                            },
                        },
                        required: ['channelIds'],
                    },
                },
                {
                    name: 'channels_searchChannels',
                    description: 'Search for YouTube channels by handle, name, or query',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'Channel search query or handle',
                            },
                            maxResults: {
                                type: 'number',
                                description: 'Maximum number of results to return',
                            },
                            order: {
                                type: 'string',
                                description: 'Sort order for results, such as relevance',
                            },
                            channelType: {
                                type: 'string',
                                description: 'Restrict to channel type such as any or show',
                            },
                            minSubscribers: {
                                type: 'number',
                                description: 'Minimum subscriber count for returned channels',
                            },
                            maxSubscribers: {
                                type: 'number',
                                description: 'Maximum subscriber count for returned channels',
                            },
                            lastUploadAfter: {
                                type: 'string',
                                description: 'Only include channels whose latest upload is after this ISO 8601 date',
                            },
                            lastUploadBefore: {
                                type: 'string',
                                description: 'Only include channels whose latest upload is before this ISO 8601 date',
                            },
                            creatorOnly: {
                                type: 'boolean',
                                description: 'Only include channels heuristically classified as creators',
                            },
                            sortBy: {
                                type: 'string',
                                description: 'Optional ranking mode such as relevance, indie_priority, subscribers_asc, subscribers_desc, or recent_activity',
                            },
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'channels_findCreators',
                    description: 'Find creator channels from video mentions with subscriber band and recent activity filters in one call',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'Search query such as a game name or topic mention',
                            },
                            maxResults: {
                                type: 'number',
                                description: 'Maximum number of video matches to scan before channel enrichment',
                            },
                            order: {
                                type: 'string',
                                description: 'Search ordering such as relevance or date',
                            },
                            videoPublishedAfter: {
                                type: 'string',
                                description: 'Only include matched videos published after this ISO 8601 date',
                            },
                            videoPublishedBefore: {
                                type: 'string',
                                description: 'Only include matched videos published before this ISO 8601 date',
                            },
                            channelMinSubscribers: {
                                type: 'number',
                                description: 'Minimum subscriber count for returned creator channels',
                            },
                            channelMaxSubscribers: {
                                type: 'number',
                                description: 'Maximum subscriber count for returned creator channels',
                            },
                            channelLastUploadAfter: {
                                type: 'string',
                                description: 'Only include channels whose latest upload is after this ISO 8601 date',
                            },
                            channelLastUploadBefore: {
                                type: 'string',
                                description: 'Only include channels whose latest upload is before this ISO 8601 date',
                            },
                            creatorOnly: {
                                type: 'boolean',
                                description: 'Only include channels heuristically classified as creators',
                            },
                            sortBy: {
                                type: 'string',
                                description: 'Optional ranking mode such as relevance, indie_priority, subscribers_asc, subscribers_desc, or recent_activity',
                            },
                            sampleVideosPerChannel: {
                                type: 'number',
                                description: 'How many matched video samples to include per returned channel',
                            },
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'channels_listVideos',
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
                },
                {
                    name: 'playlists_getPlaylist',
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
                },
                {
                    name: 'playlists_getPlaylistItems',
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
                },
            ],
        };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        const startedAt = Date.now();

        console.log(`[MCP] tool.start name=${name} args=${safeSerialize(args)}`);

        try {
            let result: unknown;

            switch (name) {
                case 'videos_getVideo':
                    result = await videoService.getVideo(args as unknown as VideoParams);
                    break;
                case 'videos_searchVideos':
                    result = await videoService.searchVideos(args as unknown as SearchParams);
                    break;
                case 'transcripts_getTranscript':
                    result = await transcriptService.getTranscript(args as unknown as TranscriptParams);
                    break;
                case 'channels_getChannel':
                    result = await channelService.getChannel(args as unknown as ChannelParams);
                    break;
                case 'channels_getChannels':
                    result = await channelService.getChannels(args as unknown as ChannelsParams);
                    break;
                case 'channels_searchChannels':
                    result = await channelService.searchChannels(args as unknown as ChannelSearchParams);
                    break;
                case 'channels_findCreators':
                    result = await channelService.findCreators(args as unknown as CreatorDiscoveryParams);
                    break;
                case 'channels_listVideos':
                    result = await channelService.listVideos(args as unknown as ChannelVideosParams);
                    break;
                case 'playlists_getPlaylist':
                    result = await playlistService.getPlaylist(args as unknown as PlaylistParams);
                    break;
                case 'playlists_getPlaylistItems':
                    result = await playlistService.getPlaylistItems(args as unknown as PlaylistItemsParams);
                    break;
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }

            console.log(
                `[MCP] tool.success name=${name} durationMs=${Date.now() - startedAt} summary=${summarizeResult(result)}`
            );

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } catch (error) {
            console.error(
                `[MCP] tool.error name=${name} durationMs=${Date.now() - startedAt} error=${error instanceof Error ? error.stack || error.message : String(error)}`
            );
            return {
                content: [{
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`
                }],
                isError: true
            };
        }
    });

    return server;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];

    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    if (chunks.length === 0) {
        return undefined;
    }

    const raw = Buffer.concat(chunks).toString('utf8').trim();

    if (!raw) {
        return undefined;
    }

    return JSON.parse(raw);
}

function writeJson(res: ServerResponse, statusCode: number, payload: unknown) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
}

async function startStdioServer() {
    const server = createMcpServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);
    
    // Log the server info
    console.error(`YouTube MCP Server v1.0.0 started successfully`);
    console.error(`Server will validate YouTube API key when tools are called`);
    
    return server;
}

async function startHttpMcpServer() {
    const host = process.env.MCP_HOST || '0.0.0.0';
    const port = Number(process.env.MCP_PORT || '8088');
    const stateless = process.env.MCP_STATELESS !== 'false';

    const httpServer = createHttpServer(async (req, res) => {
        const requestStartedAt = Date.now();
        const origin = `http://${req.headers.host || `${host}:${port}`}`;
        const url = new URL(req.url || '/', origin);

        res.on('finish', () => {
            console.log(
                `[HTTP] ${req.method} ${url.pathname} status=${res.statusCode} durationMs=${Date.now() - requestStartedAt}`
            );
        });

        if (url.pathname === '/ready') {
            writeJson(res, 200, {
                status: 'ok',
                transport: 'http',
                stateless,
            });
            return;
        }

        if (url.pathname !== '/mcp') {
            writeJson(res, 404, {
                error: 'Not found',
            });
            return;
        }

        let parsedBody: unknown;

        if (req.method === 'POST') {
            try {
                parsedBody = await readJsonBody(req);
                console.log(`[HTTP] request.body method=${req.method} path=${url.pathname} body=${safeSerialize(parsedBody)}`);
            } catch (error) {
                writeJson(res, 400, {
                    jsonrpc: '2.0',
                    error: {
                        code: -32700,
                        message: `Invalid JSON body: ${error instanceof Error ? error.message : String(error)}`,
                    },
                    id: null,
                });
                return;
            }
        }

        const server = createMcpServer();
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: stateless ? undefined : () => randomUUID(),
            enableJsonResponse: stateless,
        });

        res.on('close', () => {
            transport.close().catch(() => undefined);
            server.close().catch(() => undefined);
        });

        try {
            await server.connect(transport);
            await transport.handleRequest(req, res, parsedBody);
        } catch (error) {
            console.error('Error handling HTTP MCP request:', error);

            if (!res.headersSent) {
                writeJson(res, 500, {
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: error instanceof Error ? error.message : 'Internal server error',
                    },
                    id: null,
                });
            }
        }
    });

    await new Promise<void>((resolve, reject) => {
        httpServer.once('error', reject);
        httpServer.listen(port, host, () => {
            httpServer.off('error', reject);
            resolve();
        });
    });

    console.log('YouTube MCP Server v1.0.0 started successfully over HTTP');
    console.log(`Listening on http://${host}:${port}/mcp`);
    console.log(`Readiness endpoint available at http://${host}:${port}/ready`);
    console.log('Server will validate YouTube API key when tools are called');

    return httpServer;
}

export async function startMcpServer() {
    const transport = (process.env.MCP_TRANSPORT || 'stdio').toLowerCase();

    if (transport === 'http') {
        return startHttpMcpServer();
    }

    return startStdioServer();
}
