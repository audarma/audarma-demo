/**
 * Hacker News API client
 * Fetches live tech stories for translation demo
 */

export interface HNStory {
  id: number;
  title: string;
  text?: string;
  by: string;
  score: number;
  time: number;
  url?: string;
  descendants?: number; // comment count
}

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

/**
 * Fetch top stories from Hacker News
 */
export async function getTopStories(limit = 10): Promise<HNStory[]> {
  try {
    // Get top story IDs
    const response = await fetch(`${HN_API_BASE}/topstories.json?print=pretty`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error('Failed to fetch top stories');
    }

    const storyIds: number[] = await response.json();
    const topIds = storyIds.slice(0, limit);

    // Fetch story details
    const stories = await Promise.all(
      topIds.map(async (id) => {
        const storyResponse = await fetch(`${HN_API_BASE}/item/${id}.json?print=pretty`, {
          next: { revalidate: 300 }
        });

        if (!storyResponse.ok) {
          return null;
        }

        return storyResponse.json() as Promise<HNStory>;
      })
    );

    // Filter out nulls and stories without titles
    return stories.filter((story): story is HNStory =>
      story !== null && Boolean(story.title)
    );

  } catch (error) {
    console.error('[HN] Error fetching stories:', error);
    return [];
  }
}

/**
 * Get story summary (first 200 chars of text, or generate from title)
 */
export function getStorySummary(story: HNStory): string {
  if (story.text) {
    // Strip HTML tags and get first 200 chars
    const text = story.text.replace(/<[^>]*>/g, '');
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  }

  // If no text, create a summary from title
  return `Discussion about: ${story.title}`;
}

/**
 * Get story age data for translation
 */
export function getStoryAge(timestamp: number): { value: number; unit: 'minute' | 'hour' | 'day'; text: string } {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return {
      value: mins,
      unit: 'minute',
      text: `${mins} minute${mins !== 1 ? 's' : ''} ago`
    };
  }

  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return {
      value: hours,
      unit: 'hour',
      text: `${hours} hour${hours !== 1 ? 's' : ''} ago`
    };
  }

  const days = Math.floor(diff / 86400);
  return {
    value: days,
    unit: 'day',
    text: `${days} day${days !== 1 ? 's' : ''} ago`
  };
}
