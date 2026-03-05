/**
 * Media Utilities - Shared helpers for local file to data URL conversion
 */

import { readFileSync } from 'fs';
import { extname } from 'path';

export const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.webm'];

export function localFileToDataUrl(filePath: string): { dataUrl: string; isVideo: boolean } {
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

export function resolveMediaList(sources: string[]): Array<{ type: string; url: string }> {
  return sources.map(src => {
    if (src.startsWith('/') || src.startsWith('~')) {
      const resolved = src.replace(/^~/, process.env.HOME || '');
      const { dataUrl, isVideo } = localFileToDataUrl(resolved);
      return { type: isVideo ? 'video' : 'photo', url: dataUrl };
    }
    const isVideo = VIDEO_EXTS.some(ext => src.toLowerCase().includes(ext));
    return { type: isVideo ? 'video' : 'photo', url: src };
  });
}
