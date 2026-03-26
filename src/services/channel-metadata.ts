const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_REGEX = /\bhttps?:\/\/[^\s<>"')]+/gi;

const BRAND_KEYWORDS = [
  'official',
  'records',
  'vevo',
  'music',
  'news',
  'network',
  'media',
  'trailer',
  'trailers',
  'studio',
  'studios',
  'tv',
  'television',
  'clips',
  'highlights',
  'publisher',
  'developer',
  'esports',
  'radio',
  'topic',
];

const CREATOR_KEYWORDS = [
  'i play',
  'my channel',
  'my videos',
  'my content',
  'i upload',
  'let\'s play',
  'lets play',
  'streamer',
  'content creator',
  'creator',
  'reviewer',
];

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function toNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function extractEmails(text?: string | null) {
  return uniq((text || '').match(EMAIL_REGEX) || []);
}

export function extractContactLinks(text?: string | null) {
  return uniq((text || '').match(URL_REGEX) || []);
}

export function buildChannelUrl(channelId?: string | null, customUrl?: string | null) {
  if (customUrl) {
    return `https://www.youtube.com/${customUrl}`;
  }

  return channelId ? `https://www.youtube.com/channel/${channelId}` : null;
}

export function classifyChannel(channel: any) {
  const title = String(channel?.snippet?.title || '').toLowerCase();
  const description = String(
    channel?.brandingSettings?.channel?.description ||
    channel?.snippet?.description ||
    ''
  ).toLowerCase();
  const text = `${title} ${description}`;

  const matchedBrandKeywords = BRAND_KEYWORDS.filter((keyword) => text.includes(keyword));
  const matchedCreatorKeywords = CREATOR_KEYWORDS.filter((keyword) => text.includes(keyword));

  let channelTypeHeuristic: 'creator' | 'brand_or_media' | 'unknown' = 'unknown';

  if (matchedBrandKeywords.length >= 2 && matchedBrandKeywords.length > matchedCreatorKeywords.length) {
    channelTypeHeuristic = 'brand_or_media';
  } else if (matchedCreatorKeywords.length > 0 && matchedCreatorKeywords.length >= matchedBrandKeywords.length) {
    channelTypeHeuristic = 'creator';
  }

  return {
    channelTypeHeuristic,
    brandKeywordHits: matchedBrandKeywords,
    creatorKeywordHits: matchedCreatorKeywords,
    heuristicConfidence: Math.max(matchedBrandKeywords.length, matchedCreatorKeywords.length),
  };
}

export function normalizeChannel(channel: any, latestVideoPublishedAt?: string | null) {
  const snippet = channel?.snippet || {};
  const statistics = channel?.statistics || {};
  const branding = channel?.brandingSettings?.channel || {};
  const description = branding.description || snippet.description || '';
  const customUrl = snippet.customUrl || null;
  const channelId = channel?.id || null;
  const emailsFound = extractEmails(description);
  const contactLinks = extractContactLinks(description);
  const heuristic = classifyChannel(channel);

  return {
    ...channel,
    latestVideoPublishedAt: latestVideoPublishedAt || null,
    normalizedMetadata: {
      channelId,
      title: snippet.title || null,
      description,
      customUrl,
      url: buildChannelUrl(channelId, customUrl),
      country: branding.country || snippet.country || null,
      defaultLanguage: branding.defaultLanguage || snippet.defaultLanguage || null,
      joinedAt: snippet.publishedAt || null,
      uploadsPlaylistId: channel?.contentDetails?.relatedPlaylists?.uploads || null,
      subscriberCount: toNumber(statistics.subscriberCount),
      videoCount: toNumber(statistics.videoCount),
      viewCount: toNumber(statistics.viewCount),
      emailsFound,
      contactLinks,
      businessEmail: null,
      contactExtractionNote: 'YouTube Data API does not expose business email. Emails and links are parsed from channel description only.',
      ...heuristic,
    },
  };
}

export function isAfter(dateValue?: string | null, threshold?: string | null) {
  if (!threshold) {
    return true;
  }

  if (!dateValue) {
    return false;
  }

  return new Date(dateValue).getTime() >= new Date(threshold).getTime();
}

export function isBefore(dateValue?: string | null, threshold?: string | null) {
  if (!threshold) {
    return true;
  }

  if (!dateValue) {
    return false;
  }

  return new Date(dateValue).getTime() <= new Date(threshold).getTime();
}

export function inSubscriberRange(subscriberCount: number, minSubscribers?: number, maxSubscribers?: number) {
  if (typeof minSubscribers === 'number' && subscriberCount < minSubscribers) {
    return false;
  }

  if (typeof maxSubscribers === 'number' && subscriberCount > maxSubscribers) {
    return false;
  }

  return true;
}
