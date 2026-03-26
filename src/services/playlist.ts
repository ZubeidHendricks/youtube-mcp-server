import { PlaylistParams, PlaylistItemsParams, SearchParams } from '../types.js';
import { withYouTubeClient } from './youtube-client.js';

/**
 * Service for interacting with YouTube playlists
 */
export class PlaylistService {
  /**
   * Get information about a YouTube playlist
   */
  async getPlaylist({ 
    playlistId 
  }: PlaylistParams): Promise<any> {
    try {
      const response = await withYouTubeClient((youtube) => youtube.playlists.list({
        part: ['snippet', 'contentDetails'],
        id: [playlistId]
      }));
      
      return response.data.items?.[0] || null;
    } catch (error) {
      throw new Error(`Failed to get playlist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get videos in a YouTube playlist
   */
  async getPlaylistItems({ 
    playlistId, 
    maxResults = 50 
  }: PlaylistItemsParams): Promise<any[]> {
    try {
      const response = await withYouTubeClient((youtube) => youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId,
        maxResults
      }));
      
      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to get playlist items: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search for playlists on YouTube
   */
  async searchPlaylists({ 
    query, 
    maxResults = 10 
  }: SearchParams): Promise<any[]> {
    try {
      const response = await withYouTubeClient((youtube) => youtube.search.list({
        part: ['snippet'],
        q: query,
        maxResults,
        type: ['playlist']
      }));
      
      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to search playlists: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
