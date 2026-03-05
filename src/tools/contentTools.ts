/**
 * Content Tools - Fetch content from external platforms (WeChat, TikTok, Xiaohongshu)
 */

import { z } from 'zod';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { BnbotWsServer } from '../wsServer.js';

export function registerContentTools(server: any, wsServer: BnbotWsServer) {
  server.tool(
    'fetch_wechat_article',
    'Fetch and extract content from a WeChat Official Account article. Returns markdown-formatted article content including title, author, and body text.',
    {
      url: z.string().describe('WeChat article URL (mp.weixin.qq.com)'),
    },
    async (params: { url: string }) => {
      const result = await wsServer.sendAction('fetch_wechat_article', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'fetch_tiktok_video',
    'Fetch TikTok video metadata including description, author info, and video download URL. Automatically downloads the video via the browser extension and saves it locally.',
    {
      url: z.string().describe('TikTok video URL'),
      savePath: z.string().optional().describe('Local path to save the video file. Defaults to ~/Downloads/tiktok_{video_id}.mp4'),
    },
    async (params: { url: string; savePath?: string }) => {
      const result = await wsServer.sendAction('fetch_tiktok_video', { url: params.url }, 60000);
      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      const data = result.data as Record<string, unknown>;
      const videoBase64 = data?.video_base64 as string | undefined;

      if (videoBase64) {
        const videoId = (data?.video_id as string) || 'unknown';
        const filePath = params.savePath || join(homedir(), 'Downloads', `tiktok_${videoId}.mp4`);
        try {
          const buffer = Buffer.from(videoBase64, 'base64');
          writeFileSync(filePath, buffer);
          // Remove base64 from response to keep it clean
          delete data.video_base64;
          (data as Record<string, unknown>).local_file = filePath;
          (data as Record<string, unknown>).file_size_mb = +(buffer.length / 1024 / 1024).toFixed(2);
        } catch (e) {
          (data as Record<string, unknown>).download_error = e instanceof Error ? e.message : 'Failed to save file';
        }
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: false,
      };
    }
  );

  server.tool(
    'fetch_xiaohongshu_note',
    'Fetch content from a Xiaohongshu (Little Red Book) note including text, images, author, and engagement metrics.',
    {
      url: z.string().describe('Xiaohongshu note URL (xiaohongshu.com or xhslink.com)'),
    },
    async (params: { url: string }) => {
      const result = await wsServer.sendAction('fetch_xiaohongshu_note', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'fetch_youtube_video',
    'Fetch YouTube video metadata including title, author, and thumbnail via oEmbed API.',
    {
      url: z.string().describe('YouTube video URL'),
    },
    async (params: { url: string }) => {
      const result = await wsServer.sendAction('fetch_youtube_video', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );
}
