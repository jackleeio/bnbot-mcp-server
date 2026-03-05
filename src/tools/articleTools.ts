/**
 * Article Tools - Create and publish Twitter/X articles
 */

import { z } from 'zod';
import type { BnbotWsServer } from '../wsServer.js';

export function registerArticleTools(server: any, wsServer: BnbotWsServer) {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function sendWithTimeoutRetry(
    actionType: string,
    params: Record<string, unknown>,
    timeout = 60000,
    retries = 1
  ) {
    let last = await wsServer.sendAction(actionType, params, timeout);
    let attempts = 0;
    while (!last.success && (last.error || '').includes('timed out') && attempts < retries) {
      attempts++;
      await sleep(1500);
      last = await wsServer.sendAction(actionType, params, timeout);
    }
    return last;
  }

  server.tool(
    'create_article',
    'Create and publish a Twitter/X article (long-form content). Handles the full flow: open editor, fill title, fill body, and optionally publish.',
    {
      title: z.string().describe('Article title'),
      content: z.string().describe('Article body content'),
      publish: z.boolean().optional().describe('Whether to publish immediately (default: false, saves as draft)'),
    },
    async (params: { title: string; content: string; publish?: boolean }) => {
      // 1. Open article editor
      const openResult = await wsServer.sendAction('open_article_editor', {});
      if (!openResult.success) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Open editor failed: ${openResult.error}` }, null, 2) }],
          isError: true,
        };
      }
      // Give SPA route/editor a moment to stabilize before typing.
      await sleep(2500);

      // 2. Fill title
      const titleResult = await sendWithTimeoutRetry('fill_article_title', { title: params.title });
      if (!titleResult.success) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Fill title failed: ${titleResult.error}` }, null, 2) }],
          isError: true,
        };
      }
      await sleep(800);

      // 3. Fill body
      const bodyResult = await sendWithTimeoutRetry('fill_article_body', { content: params.content });
      if (!bodyResult.success) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Fill body failed: ${bodyResult.error}` }, null, 2) }],
          isError: true,
        };
      }

      // 4. Publish or save as draft
      const publishResult = await wsServer.sendAction('publish_article', { asDraft: !params.publish });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(publishResult, null, 2) }],
        isError: !publishResult.success,
      };
    }
  );
}
