import { TwitterApi } from 'twitter-api-v2';

const TWITTER_API_KEY = 'Pg7qmS5OO5cjcgZSevKTpmkyA';
const TWITTER_API_SECRET = 'jXR6CVrrcGRfp5tOy3aZbCuMdbprzNiqnO4HZvZx';

interface TwitterMetrics {
  sentiment: number;
  volume24h: number;
  engagement: number;
  trending: boolean;
  error?: string; // Optional error field
}

const DEFAULT_TWITTER_METRICS: TwitterMetrics = {
  sentiment: 0,
  volume24h: 0,
  engagement: 0,
  trending: false,
};

class TwitterService {
  private client: TwitterApi;
  private static instance: TwitterService;
  private bearerToken: string | null = null;
  private initialized: boolean = false;
  private initializingPromise: Promise<void> | null = null;

  private constructor() {
    console.log('[DEBUG] TwitterService: Initializing service constructor');
    // No immediate initialization here, defer to ensure it can be awaited
  }

  private async ensureInitialized() {
    if (this.initialized) return;
    if (this.initializingPromise) return this.initializingPromise;

    this.initializingPromise = (async () => {
      try {
        console.log('[DEBUG] TwitterService: Creating app-only client (ensureInitialized)');
        const appClient = new TwitterApi({ 
          appKey: TWITTER_API_KEY, 
          appSecret: TWITTER_API_SECRET 
        });

        console.log('[DEBUG] TwitterService: Getting bearer token (ensureInitialized)');
        const { accessToken } = await appClient.appLogin();
        this.bearerToken = accessToken;
        console.log('[DEBUG] TwitterService: Bearer token obtained successfully (ensureInitialized)');

        this.client = new TwitterApi(this.bearerToken);
        this.initialized = true;
        console.log('[DEBUG] TwitterService: Client initialized successfully (ensureInitialized)');
      } catch (error) {
        this.initialized = false;
        console.error('[DEBUG] TwitterService: Twitter API initialization error (ensureInitialized):', error);
        // Do not throw here, let methods handle the uninitialized state
      } finally {
        this.initializingPromise = null;
      }
    })();
    return this.initializingPromise;
  }

  public static getInstance(): TwitterService {
    if (!TwitterService.instance) {
      console.log('[DEBUG] TwitterService: Creating singleton instance');
      TwitterService.instance = new TwitterService();
    }
    return TwitterService.instance;
  }

  async getSentimentMetrics(symbol: string): Promise<TwitterMetrics> {
    console.log(`[DEBUG] TwitterService: Getting sentiment metrics for ${symbol}`);
    await this.ensureInitialized();

    if (!this.initialized || !this.client) {
      console.error('[DEBUG] TwitterService: Client still not initialized after attempt in getSentimentMetrics.');
      return { ...DEFAULT_TWITTER_METRICS, error: 'Twitter client not initialized' };
    }

    try {
      console.log(`[DEBUG] TwitterService: Searching tweets for ${symbol}`);
      const tweets = await this.client.v2.search({
        query: `${symbol} crypto -is:retweet`,
        max_results: 100,
        'tweet.fields': ['public_metrics', 'created_at'],
      });

      console.log(`[DEBUG] TwitterService: Search completed, data status: ${tweets.data ? 'available' : 'missing'}`);
      if (!tweets.data || tweets.data.length === 0) {
        console.warn(`[DEBUG] TwitterService: No tweets found for ${symbol}`);
        return { ...DEFAULT_TWITTER_METRICS, error: 'No tweets found' };
      }

      console.log(`[DEBUG] TwitterService: Found ${tweets.data.length} tweets`);

      let totalEngagement = 0;
      let volume = tweets.data.length;
      let sentiment = 0;

      console.log('[DEBUG] TwitterService: Analyzing tweets');
      tweets.data.forEach(tweet => {
        if (tweet.public_metrics) {
          totalEngagement += 
            (tweet.public_metrics.like_count || 0) +
            (tweet.public_metrics.retweet_count || 0) +
            (tweet.public_metrics.reply_count || 0);
        }
        sentiment += this.analyzeSentiment(tweet.text);
      });

      const result = {
        sentiment: volume > 0 ? sentiment / volume : 0,
        volume24h: volume,
        engagement: volume > 0 ? totalEngagement / volume : 0,
        trending: volume > 1000, 
      };

      console.log(`[DEBUG] TwitterService: Sentiment analysis complete, result: sentiment=${result.sentiment}, volume=${result.volume24h}`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[DEBUG] TwitterService: API Error in getSentimentMetrics:', errorMessage);
      return { ...DEFAULT_TWITTER_METRICS, error: `Twitter API Error: ${errorMessage}` };
    }
  }

  private analyzeSentiment(text: string): number {
    const positiveWords = ['bullish', 'moon', 'pump', 'buy', 'up', 'gain', 'profit'];
    const negativeWords = ['bearish', 'dump', 'sell', 'down', 'loss', 'crash'];
    const words = text.toLowerCase().split(' ');
    let score = 0;
    words.forEach(word => {
      if (positiveWords.includes(word)) score++;
      if (negativeWords.includes(word)) score--;
    });
    return score;
  }

  async getTrendingTopics(): Promise<{ topics: string[], error?: string }> {
    console.log('[DEBUG] TwitterService: Getting trending topics');
    await this.ensureInitialized();

    if (!this.initialized || !this.client) {
      console.error('[DEBUG] TwitterService: Client still not initialized after attempt in getTrendingTopics.');
      return { topics: [], error: 'Twitter client not initialized' };
    }

    try {
      console.log('[DEBUG] TwitterService: Fetching trending topics');
      const trends = await this.client.v2.trendingTopics();
      
      if (!trends.data || trends.data.length === 0) {
        console.warn('[DEBUG] TwitterService: No trending topics found');
        return { topics: [] };
      }
      
      const filteredTrends = trends.data
        .filter(trend => trend.name.includes('#') || trend.name.includes('crypto'))
        .map(trend => trend.name);
        
      console.log(`[DEBUG] TwitterService: Found ${filteredTrends.length} trending topics`);
      return { topics: filteredTrends };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[DEBUG] TwitterService: Trending topics error:', errorMessage);
      return { topics: [], error: `Failed to fetch trending topics: ${errorMessage}` };
    }
  }
}

export const twitterService = TwitterService.getInstance(); 