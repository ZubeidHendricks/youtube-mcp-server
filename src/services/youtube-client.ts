import { google } from 'googleapis';

type YouTubeClient = ReturnType<typeof google.youtube>;

const QUOTA_ERROR_REASONS = new Set([
  'quotaExceeded',
  'dailyLimitExceeded',
  'dailyLimitExceededExceeded',
  'userRateLimitExceeded',
  'rateLimitExceeded',
]);

class YouTubeClientPool {
  private clients: YouTubeClient[] = [];
  private exhaustedClientIndexes = new Set<number>();
  private initialized = false;

  private initialize() {
    if (this.initialized) {
      return;
    }

    const apiKeys = [
      process.env.YOUTUBE_API_KEY,
      process.env.YOUTUBE_API_KEY2,
      process.env.YOUTUBE_API_KEY3,
    ].filter((value): value is string => Boolean(value && value.trim()));

    if (apiKeys.length === 0) {
      throw new Error(
        'At least one YouTube API key must be set. Supported env vars: YOUTUBE_API_KEY, YOUTUBE_API_KEY2, YOUTUBE_API_KEY3.'
      );
    }

    this.clients = apiKeys.map((apiKey) =>
      google.youtube({
        version: 'v3',
        auth: apiKey,
      })
    );

    this.initialized = true;
  }

  private isQuotaError(error: any): boolean {
    const reasons =
      error?.errors?.map((item: any) => item?.reason).filter(Boolean) ||
      error?.response?.data?.error?.errors?.map((item: any) => item?.reason).filter(Boolean) ||
      [];

    if (reasons.some((reason: string) => QUOTA_ERROR_REASONS.has(reason))) {
      return true;
    }

    const message = String(
      error?.message ||
      error?.response?.data?.error?.message ||
      ''
    ).toLowerCase();

    return (
      message.includes('quota') ||
      message.includes('daily limit') ||
      message.includes('rate limit')
    );
  }

  private availableClientIndexes(): number[] {
    const available = this.clients
      .map((_, index) => index)
      .filter((index) => !this.exhaustedClientIndexes.has(index));

    return available.length > 0
      ? available
      : this.clients.map((_, index) => index);
  }

  async execute<T>(request: (youtube: YouTubeClient) => Promise<T>): Promise<T> {
    this.initialize();

    let lastError: unknown;
    const candidates = this.availableClientIndexes();

    for (const index of candidates) {
      try {
        return await request(this.clients[index]);
      } catch (error) {
        lastError = error;

        if (this.isQuotaError(error)) {
          this.exhaustedClientIndexes.add(index);
          console.warn(`YouTube API quota exhausted for key ${index + 1}. Trying next configured key.`);
          continue;
        }

        throw error;
      }
    }

    throw new Error(
      `All configured YouTube API keys failed${lastError instanceof Error ? `: ${lastError.message}` : '.'}`
    );
  }
}

const pool = new YouTubeClientPool();

export function hasConfiguredYouTubeApiKey(): boolean {
  return Boolean(
    process.env.YOUTUBE_API_KEY ||
    process.env.YOUTUBE_API_KEY2 ||
    process.env.YOUTUBE_API_KEY3
  );
}

export async function withYouTubeClient<T>(request: (youtube: YouTubeClient) => Promise<T>): Promise<T> {
  return pool.execute(request);
}
