/**
 * Scrape Tools - Data collection from Twitter/X
 */

import { z } from 'zod';
import type { BnbotWsServer } from '../wsServer.js';

export function registerScrapeTools(server: any, wsServer: BnbotWsServer) {
  server.tool(
    'scrape_timeline',
    'Scrape tweets from the Twitter/X timeline. Returns tweet text, author, metrics, and URLs. Navigate to the timeline first if not already there.',
    {
      limit: z.number().default(20).describe('Maximum number of tweets to collect'),
      scrollAttempts: z.number().default(5).describe('Number of scroll attempts to load more tweets'),
    },
    async (params: { limit: number; scrollAttempts: number }) => {
      const result = await wsServer.sendAction('scrape_timeline', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'scrape_bookmarks',
    'Scrape bookmarked tweets from Twitter/X. Automatically navigates to the bookmarks page.',
    {
      limit: z.number().default(20).describe('Maximum number of bookmarks to collect'),
    },
    async (params: { limit: number }) => {
      const result = await wsServer.sendAction('scrape_bookmarks', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'scrape_search_results',
    'Search for tweets and scrape the results. Navigates to search page with the given query.',
    {
      query: z.string().describe('Search query'),
      limit: z.number().default(20).describe('Maximum number of results to collect'),
    },
    async (params: { query: string; limit: number }) => {
      const result = await wsServer.sendAction('scrape_search_results', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'scrape_current_view',
    'Scrape tweets currently visible on the page without scrolling.',
    {},
    async () => {
      const result = await wsServer.sendAction('scrape_current_view', {});
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'scrape_thread',
    'Scrape all tweets from a Twitter/X thread. Must be on a tweet detail page (/status/ URL). Collects all tweets by the same author, returns individual tweets and merged text.',
    {
      maxScrolls: z.number().default(10).describe('Maximum scroll attempts to load more tweets'),
    },
    async (params: { maxScrolls: number }) => {
      const result = await wsServer.sendAction('scrape_thread', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'account_analytics',
    'Get Twitter/X account analytics data for a date range.',
    {
      startDate: z.string().optional().describe('Start date in YYYY-MM-DD format'),
      endDate: z.string().optional().describe('End date in YYYY-MM-DD format'),
      granularity: z.enum(['Daily', 'Weekly', 'Monthly']).optional().describe('Aggregation level for time series data'),
    },
    async (params: { startDate?: string; endDate?: string; granularity?: 'Daily' | 'Weekly' | 'Monthly' }) => {
      const fromTime = params.startDate
        ? `${params.startDate}T00:00:00.000Z`
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const toTime = params.endDate
        ? `${params.endDate}T23:59:59.999Z`
        : new Date().toISOString();

      const result = await wsServer.sendAction('account_analytics', {
        fromTime,
        toTime,
        granularity: params.granularity || 'Daily',
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );
}
