import { VideoParams, SearchParams, TrendingParams, RelatedVideosParams } from '../types.js';
import { withYouTubeClient } from './youtube-client.js';
import { ChannelService } from './channel.js';

/**
 * Service for interacting with YouTube videos
 */
export class VideoService {
  private channelService = new ChannelService();

  /**
   * Get detailed information about a YouTube video
   */
  async getVideo({ 
    videoId, 
    parts = ['snippet', 'contentDetails', 'statistics'] 
  }: VideoParams): Promise<any> {
    try {
      const response = await withYouTubeClient((youtube) => youtube.videos.list({
        part: parts,
        id: [videoId]
      }));
      
      return response.data.items?.[0] || null;
    } catch (error) {
      throw new Error(`Failed to get video: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search for videos on YouTube
   */
  async searchVideos({ 
    query, 
    maxResults = 10,
    order = 'relevance',
    publishedAfter,
    publishedBefore,
    channelId,
    uniqueChannels = false,
    channelMinSubscribers,
    channelMaxSubscribers,
    channelLastUploadAfter,
    channelLastUploadBefore,
    creatorOnly = false,
    sortBy = 'relevance'
  }: SearchParams): Promise<any[]> {
    try {
      const params: any = {
        part: ['snippet'],
        q: query,
        maxResults,
        order,
        type: ['video']
      };

      if (publishedAfter) {
        params.publishedAfter = publishedAfter;
      }

      if (publishedBefore) {
        params.publishedBefore = publishedBefore;
      }

      if (channelId) {
        params.channelId = channelId;
      }

      const response = await withYouTubeClient((youtube) => youtube.search.list(params));
      let items: any[] = response.data.items || [];

      const needsChannelFiltering =
        uniqueChannels ||
        creatorOnly ||
        typeof channelMinSubscribers === 'number' ||
        typeof channelMaxSubscribers === 'number' ||
        Boolean(channelLastUploadAfter) ||
        Boolean(channelLastUploadBefore) ||
        sortBy !== 'relevance';

      if (!needsChannelFiltering) {
        return items;
      }

      const uniqueChannelIds = Array.from(new Set(
        items.map((item) => item?.snippet?.channelId).filter(Boolean)
      ));

      const enrichedChannels = await this.channelService.getChannels({
        channelIds: uniqueChannelIds,
        includeLatestUpload: true
      });
      const channelMap = new Map(enrichedChannels.map((channel) => [channel.id, channel]));

      items = items.filter((item) => {
        const channel = channelMap.get(item?.snippet?.channelId);
        const metadata = channel?.normalizedMetadata;

        if (!channel || !metadata) {
          return false;
        }

        if (typeof channelMinSubscribers === 'number' && metadata.subscriberCount < channelMinSubscribers) {
          return false;
        }

        if (typeof channelMaxSubscribers === 'number' && metadata.subscriberCount > channelMaxSubscribers) {
          return false;
        }

        if (channelLastUploadAfter && (!channel.latestVideoPublishedAt || new Date(channel.latestVideoPublishedAt).getTime() < new Date(channelLastUploadAfter).getTime())) {
          return false;
        }

        if (channelLastUploadBefore && (!channel.latestVideoPublishedAt || new Date(channel.latestVideoPublishedAt).getTime() > new Date(channelLastUploadBefore).getTime())) {
          return false;
        }

        if (creatorOnly && metadata.channelTypeHeuristic !== 'creator') {
          return false;
        }

        return true;
      }).map((item) => ({
        ...item,
        channelMetadata: channelMap.get(item?.snippet?.channelId)?.normalizedMetadata || null,
        latestChannelUploadAt: channelMap.get(item?.snippet?.channelId)?.latestVideoPublishedAt || null,
      }));

      if (uniqueChannels) {
        const seenChannelIds = new Set<string>();
        items = items.filter((item) => {
          const currentChannelId = item?.snippet?.channelId;
          if (!currentChannelId || seenChannelIds.has(currentChannelId)) {
            return false;
          }

          seenChannelIds.add(currentChannelId);
          return true;
        });
      }

      if (sortBy === 'subscribers_asc' || sortBy === 'indie_priority') {
        items.sort((left, right) => (left.channelMetadata?.subscriberCount || 0) - (right.channelMetadata?.subscriberCount || 0));
      } else if (sortBy === 'subscribers_desc') {
        items.sort((left, right) => (right.channelMetadata?.subscriberCount || 0) - (left.channelMetadata?.subscriberCount || 0));
      } else if (sortBy === 'recent_activity') {
        items.sort((left, right) => new Date(right.latestChannelUploadAt || 0).getTime() - new Date(left.latestChannelUploadAt || 0).getTime());
      }

      return items;
    } catch (error) {
      throw new Error(`Failed to search videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get video statistics like views, likes, and comments
   */
  async getVideoStats({ 
    videoId 
  }: { videoId: string }): Promise<any> {
    try {
      const response = await withYouTubeClient((youtube) => youtube.videos.list({
        part: ['statistics'],
        id: [videoId]
      }));
      
      return response.data.items?.[0]?.statistics || null;
    } catch (error) {
      throw new Error(`Failed to get video stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get trending videos
   */
  async getTrendingVideos({ 
    regionCode = 'US', 
    maxResults = 10,
    videoCategoryId = ''
  }: TrendingParams): Promise<any[]> {
    try {
      const params: any = {
        part: ['snippet', 'contentDetails', 'statistics'],
        chart: 'mostPopular',
        regionCode,
        maxResults
      };
      
      if (videoCategoryId) {
        params.videoCategoryId = videoCategoryId;
      }
      
      const response = await withYouTubeClient((youtube) => youtube.videos.list(params));
      
      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to get trending videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get related videos for a specific video
   */
  async getRelatedVideos({ 
    videoId, 
    maxResults = 10 
  }: RelatedVideosParams): Promise<any[]> {
    try {
      const params: any = {
        part: ['snippet'],
        relatedToVideoId: videoId,
        maxResults,
        type: ['video']
      };

      const response = await withYouTubeClient((youtube) => youtube.search.list(params));
      
      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to get related videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
