#!/usr/bin/env node
/**
 * Test script to fetch 10 comments from a YouTube video
 *
 * Usage:
 *   npm run test:comments "https://www.youtube.com/watch?v=VIDEO_ID"
 *   or
 *   YOUTUBE_API_KEY=your_key npm run test:comments "https://www.youtube.com/watch?v=VIDEO_ID"
 */

import { CommentService } from '../src/services/comment.js';

/**
 * Extract video ID from various YouTube URL formats
 */
function extractVideoId(url: string): string {
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  throw new Error(
    `Invalid YouTube URL or video ID. Please provide a valid URL like:\n` +
    `  - https://www.youtube.com/watch?v=dQw4w9WgXcQ\n` +
    `  - https://youtu.be/dQw4w9WgXcQ\n` +
    `  - dQw4w9WgXcQ`
  );
}

/**
 * Format comment for display
 * Works with optimized comment structure {parentId, text}
 */
function formatComment(comment: any, index: number): string {
  // Handle optimized comment structure (from production service)
  if (comment.parentId && comment.text) {
    return `
${'-'.repeat(80)}
Comment ${index}:
Parent ID: ${comment.parentId}
${'-'.repeat(80)}
${comment.text}
`;
  }

  // Fallback for full API response (shouldn't happen now)
  const snippet = comment.snippet?.topLevelComment?.snippet;
  if (!snippet) return '';

  const authorName = snippet.authorDisplayName || 'Unknown';
  const text = snippet.textDisplay || 'No text';
  const likes = snippet.likeCount || 0;
  const replyCount = comment.snippet?.totalReplyCount || 0;

  return `
${'-'.repeat(80)}
Comment ${index}:
Author: ${authorName}
Likes: ${likes} | Replies: ${replyCount}
${'-'.repeat(80)}
${text}
`;
}

/**
 * Pretty print JSON with indentation
 */
function prettyPrintJson(obj: any): string {
  return JSON.stringify(obj, null, 2);
}

/**
 * Extract only essential comment data (parent ID and text)
 * Handles both raw YouTube API responses and already-optimized comments
 */
function extractEssentialComments(comments: any[]): any[] {
  return comments.map((comment) => {
    // Check if already optimized (has parentId and text, no snippet)
    if (comment.parentId && comment.text && !comment.snippet) {
      return comment;
    }

    // Extract from full YouTube API response
    const topLevelSnippet = comment.snippet?.topLevelComment?.snippet;
    const parentId = comment.id;
    const text = topLevelSnippet?.textDisplay || '';

    return {
      parentId,
      text
    };
  });
}

/**
 * Main function
 */
async function main() {
  const videoUrlOrId = process.argv[2];

  if (!videoUrlOrId) {
    console.error('❌ Error: Please provide a YouTube URL or video ID');
    console.error('');
    console.error('Usage:');
    console.error('  npm run test:comments <YouTube URL or Video ID>');
    console.error('');
    console.error('Examples:');
    console.error('  npm run test:comments https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    console.error('  npm run test:comments dQw4w9WgXcQ');
    process.exit(1);
  }

  if (!process.env.YOUTUBE_API_KEY) {
    console.error('❌ Error: YOUTUBE_API_KEY environment variable is not set');
    console.error('');
    console.error('Please set your YouTube API key:');
    console.error('  export YOUTUBE_API_KEY=your_api_key_here');
    process.exit(1);
  }

  try {
    console.log('🔍 Extracting video ID...');
    const videoId = extractVideoId(videoUrlOrId);
    console.log(`✅ Video ID: ${videoId}`);

    console.log('\n📝 Fetching 10 comments...');
    const commentService = new CommentService();
    const result = await commentService.getVideoComments({
      videoId,
      maxResults: 10,
      textFormat: 'plainText'
    });

    const comments = result.comments || [];
    const pageInfo = result.pageInfo || {};

    if (comments.length === 0) {
      console.log('\n⚠️  No comments found for this video');
      return;
    }

    console.log(`\n✅ Successfully fetched ${comments.length} comments`);
    console.log(`📊 Total comments on video: ${pageInfo.totalResults || 'Unknown'}`);
    console.log(`\n${'='.repeat(80)}`);
    console.log('FORMATTED COMMENTS');
    console.log(`${'='.repeat(80)}`);

    comments.forEach((comment, index) => {
      console.log(formatComment(comment, index + 1));
    });

    console.log(`${'='.repeat(80)}`);
    console.log(`✅ Fetched ${comments.length} comments successfully!`);

    // Display the optimized MCP server response (only parentId and text)
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('OPTIMIZED MCP SERVER RESPONSE');
    console.log('(Only parentId and comment text - reduced token consumption)');
    console.log(`${'='.repeat(80)}\n`);

    const essentialComments = extractEssentialComments(result.comments || []);
    const optimizedMcpResponse = {
      type: 'success',
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            comments: essentialComments,
            pageInfo: result.pageInfo || {}
          })
        }
      ]
    };

    console.log(prettyPrintJson(optimizedMcpResponse));

    // Show the size comparison
    const fullResponse = {
      type: 'success',
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            comments: result.comments || [],
            pageInfo: result.pageInfo || {}
          })
        }
      ]
    };

    const fullSize = JSON.stringify(fullResponse).length;
    const optimizedSize = JSON.stringify(optimizedMcpResponse).length;
    const reduction = ((1 - optimizedSize / fullSize) * 100).toFixed(2);

    console.log(`\n${'='.repeat(80)}`);
    console.log('SIZE COMPARISON');
    console.log(`${'='.repeat(80)}`);
    console.log(`Full response size: ${fullSize} bytes`);
    console.log(`Optimized response size: ${optimizedSize} bytes`);
    console.log(`Reduction: ${reduction}% smaller`);
    console.log(`Tokens saved: ~${Math.round((fullSize - optimizedSize) / 4)} tokens (estimated)`);
  } catch (error) {
    console.error(
      '❌ Error:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();
