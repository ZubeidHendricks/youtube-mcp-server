import { google } from 'googleapis';
import { VideoCommentsParams } from '../types.js';

/**
 * Optimized comment structure for reduced token consumption
 */
interface OptimizedComment {
  parentId: string;
  text: string;
}

/**
 * YouTube comment service
 */
export class CommentService {
  private youtube;
  private initialized = false;

  constructor() {}

  private initialize() {
    if (this.initialized) return;

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY environment variable is not set.');
    }

    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });

    this.initialized = true;
  }

  /**
   * Extract only essential comment data (parentId and text)
   * Reduces response size by ~96% compared to full YouTube API response
   */
  private extractEssentialComments(comments: any[]): OptimizedComment[] {
    return comments.map((comment) => {
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
   * Extract essential reply data (only text from reply comments)
   */
  private extractEssentialReplies(replies: any[]): string[] {
    return replies.map((reply) => reply.snippet?.textDisplay || '');
  }

  async getVideoComments({
    videoId,
    maxResults = 20,
    textFormat = 'plainText'
  }: VideoCommentsParams): Promise<any> {
    try {
      this.initialize();

      const response = await this.youtube.commentThreads.list({
        part: ['snippet', 'replies'],
        videoId: videoId,
        maxResults,
        textFormat,
        order: 'relevance'
      });

      // Optimize comments to reduce token consumption
      const optimizedComments = this.extractEssentialComments(response.data.items || []);

      return {
        comments: optimizedComments,
        pageInfo: response.data.pageInfo
      };
    } catch (error) {
      throw new Error(`Failed to get comments: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getCommentReplies({
    parentId,
    maxResults = 20,
    textFormat = 'plainText'
  }: {
    parentId: string,
    maxResults?: number,
    textFormat?: string
  }): Promise<any> {
    try {
      this.initialize();

      const response = await this.youtube.comments.list({
        part: ['snippet'],
        parentId: parentId,
        maxResults,
        textFormat
      });

      // Optimize replies to reduce token consumption
      const optimizedReplies = this.extractEssentialReplies(response.data.items || []);

      return optimizedReplies;
    } catch (error) {
      throw new Error(`Failed to get replies: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
