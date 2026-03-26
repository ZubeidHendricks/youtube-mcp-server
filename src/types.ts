/**
 * Video details parameters
 */
export interface VideoParams {
  videoId: string;
  parts?: string[];
}

/**
 * Search videos parameters
 */
export interface SearchParams {
  query: string;
  maxResults?: number;
  order?: string;
  publishedAfter?: string;
  publishedBefore?: string;
  channelId?: string;
  uniqueChannels?: boolean;
  channelMinSubscribers?: number;
  channelMaxSubscribers?: number;
  channelLastUploadAfter?: string;
  channelLastUploadBefore?: string;
  creatorOnly?: boolean;
  sortBy?: 'relevance' | 'date' | 'subscribers_asc' | 'subscribers_desc' | 'indie_priority' | 'recent_activity';
}

/**
 * Trending videos parameters
 */
export interface TrendingParams {
  regionCode?: string;
  maxResults?: number;
  videoCategoryId?: string;
}

/**
 * Related videos parameters
 */
export interface RelatedVideosParams {
  videoId: string;
  maxResults?: number;
}

/**
 * Transcript parameters
 */
export interface TranscriptParams {
  videoId: string;
  language?: string;
}

/**
 * Search transcript parameters
 */
export interface SearchTranscriptParams {
  videoId: string;
  query: string;
  language?: string;
}

/**
 * Channel parameters
 */
export interface ChannelParams {
  channelId: string;
}

/**
 * Channel lookup parameters
 */
export interface ChannelsParams {
  channelIds: string[];
  parts?: string[];
  includeLatestUpload?: boolean;
}

/**
 * Channel search parameters
 */
export interface ChannelSearchParams {
  query: string;
  maxResults?: number;
  order?: string;
  channelType?: string;
  minSubscribers?: number;
  maxSubscribers?: number;
  lastUploadAfter?: string;
  lastUploadBefore?: string;
  creatorOnly?: boolean;
  sortBy?: 'relevance' | 'subscribers_asc' | 'subscribers_desc' | 'indie_priority' | 'recent_activity';
}

/**
 * Creator discovery parameters
 */
export interface CreatorDiscoveryParams {
  query: string;
  maxResults?: number;
  order?: string;
  videoPublishedAfter?: string;
  videoPublishedBefore?: string;
  channelMinSubscribers?: number;
  channelMaxSubscribers?: number;
  channelLastUploadAfter?: string;
  channelLastUploadBefore?: string;
  creatorOnly?: boolean;
  sortBy?: 'relevance' | 'subscribers_asc' | 'subscribers_desc' | 'indie_priority' | 'recent_activity';
  sampleVideosPerChannel?: number;
}

/**
 * Channel videos parameters
 */
export interface ChannelVideosParams {
  channelId: string;
  maxResults?: number;
}

/**
 * Playlist parameters
 */
export interface PlaylistParams {
  playlistId: string;
}

/**
 * Playlist items parameters
 */
export interface PlaylistItemsParams {
  playlistId: string;
  maxResults?: number;
}
