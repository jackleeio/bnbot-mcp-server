/**
 * Tweet Tools - Create and publish content on Twitter/X
 */

import { z } from 'zod';
import { readFileSync } from 'fs';
import { extname } from 'path';
import type { BnbotWsServer } from '../wsServer.js';

const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.webm'];

function localFileToDataUrl(filePath: string): { dataUrl: string; isVideo: boolean } {
  const buffer = readFileSync(filePath);
  const ext = extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo', '.webm': 'video/webm',
  };
  const mime = mimeMap[ext] || 'application/octet-stream';
  const sizeMB = buffer.length / 1024 / 1024;
  if (sizeMB > 50) {
    throw new Error(`File too large: ${sizeMB.toFixed(1)}MB (max 50MB)`);
  }
  return {
    dataUrl: `data:${mime};base64,${buffer.toString('base64')}`,
    isVideo: VIDEO_EXTS.includes(ext),
  };
}

export function registerTweetTools(server: any, wsServer: BnbotWsServer) {
  server.tool(
    'post_tweet',
    'Post a new tweet on Twitter/X. Supports text and optional images/videos.',
    {
      text: z.string().describe('Tweet text content (max 280 characters)'),
      media: z.array(z.string()).optional().describe('Array of media to attach. Supports: URLs (https://...), local file paths (/path/to/file.png, ~/Downloads/video.mp4). Images: png/jpg/gif/webp. Videos: mp4/mov/webm.'),
      draftOnly: z.boolean().optional().describe('If true, fill the tweet composer but do not click send'),
    },
    async (params: { text: string; media?: string[]; draftOnly?: boolean }) => {
      const actionParams: Record<string, unknown> = { text: params.text, draftOnly: params.draftOnly };
      if (params.media && params.media.length > 0) {
        actionParams.media = params.media.map(src => {
          if (src.startsWith('/') || src.startsWith('~')) {
            const resolved = src.replace(/^~/, process.env.HOME || '');
            const { dataUrl, isVideo } = localFileToDataUrl(resolved);
            return { type: isVideo ? 'video' : 'photo', url: dataUrl };
          }
          // URL - guess type from extension
          const isVideo = VIDEO_EXTS.some(ext => src.toLowerCase().includes(ext));
          return { type: isVideo ? 'video' : 'photo', url: src };
        });
      }
      const result = await wsServer.sendAction('post_tweet', actionParams);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'post_thread',
    'Post a thread (multiple connected tweets) on Twitter/X.',
    {
      tweets: z.array(z.object({
        text: z.string().describe('Tweet text'),
        images: z.array(z.string()).optional().describe('Image URLs for this tweet'),
      })).describe('Array of tweets in the thread, in order'),
    },
    async (params: { tweets: Array<{ text: string; images?: string[] }> }) => {
      const result = await wsServer.sendAction('post_thread', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'submit_reply',
    'Reply to a specific tweet. Navigate to the tweet first or provide the tweet URL.',
    {
      tweetUrl: z.string().optional().describe('URL of the tweet to reply to. If omitted, replies to the currently open tweet.'),
      text: z.string().describe('Reply text content'),
      image: z.string().optional().describe('Image URL to attach to the reply'),
    },
    async (params: { tweetUrl?: string; text: string; image?: string }) => {
      // 如果提供了 tweetUrl，先导航并验证地址
      if (params.tweetUrl) {
        const navResult = await wsServer.sendAction('navigate_to_tweet', { tweetUrl: params.tweetUrl });
        if (!navResult.success) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Navigation failed: ${navResult.error}` }, null, 2) }],
            isError: true,
          };
        }
        await new Promise(r => setTimeout(r, 2000));

        // 验证导航后的地址是否包含目标推文 ID
        const urlCheck = await wsServer.sendAction('get_current_url', {});
        if (urlCheck.success) {
          const urlData = urlCheck.data as Record<string, unknown> | undefined;
          const currentUrl = (urlData?.url as string) || '';
          // 从 tweetUrl 提取 status ID
          const statusMatch = params.tweetUrl.match(/status\/(\d+)/);
          if (statusMatch && !currentUrl.includes(statusMatch[1])) {
            return {
              content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Navigation verification failed: expected tweet ${statusMatch[1]}, but current URL is ${currentUrl}` }, null, 2) }],
              isError: true,
            };
          }
        }
      }

      // 1. 打开回复框
      const openResult = await wsServer.sendAction('open_reply_composer', {});
      if (!openResult.success) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Open reply composer failed: ${openResult.error}` }, null, 2) }],
          isError: true,
        };
      }

      // 2. 填充文本
      const fillResult = await wsServer.sendAction('fill_reply_text', { content: params.text });
      if (!fillResult.success) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Fill text failed: ${fillResult.error}` }, null, 2) }],
          isError: true,
        };
      }

      // 3. 上传图片（如果有）
      if (params.image) {
        const imgResult = await wsServer.sendAction('upload_image_to_reply', { imageUrl: params.image });
        if (!imgResult.success) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Upload image failed: ${imgResult.error}` }, null, 2) }],
            isError: true,
          };
        }
      }

      // 4. 提交回复（传入回复文本用于验证）
      const result = await wsServer.sendAction('submit_reply', { replyText: params.text });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );
}
