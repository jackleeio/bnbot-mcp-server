# BNBOT MCP 剩余工具手工测试清单

更新时间：2026-03-05

## 0. 前置环境

- MCP Server：`/Users/jacklee/Projects/bnbot-mcp-server` 启动（默认 `18900`）
- 插件：`/Users/jacklee/Projects/bnbot-extension-new` 已加载，OpenClaw/MCP 开关开启，端口一致
- X 页面：已登录
- 后端：`/Users/jacklee/Projects/BNBOT` 可用（内容搬运/下载类工具建议开启）

## 1. 测试顺序（逐项）

| # | 工具 | 参数（最小用例） | 通过标准 | 结果 | 备注 |
|---|---|---|---|---|---|
| 1 | `navigate_to_bookmarks` | `{}` | 成功跳转到 `/i/bookmarks` | ⬜ | |
| 2 | `scrape_bookmarks` | `{ "limit": 5 }` | 返回 `success=true` 且 `count>0` | ⬜ | |
| 3 | `navigate_to_notifications` | `{}` | 成功跳转到 `/notifications` | ⬜ | |
| 4 | `quote_tweet` | `{ "text": "MCP quote test", "draftOnly": true }` | 打开引用推文框并填入文本，不发送 | ⬜ | 先用 `navigate_to_tweet` 到目标推文 |
| 5 | `scrape_thread` | `{ "maxScrolls": 5 }` | 返回同作者 thread，`count>=1` | ⬜ | 先用 `navigate_to_tweet` 到 thread 首条 |
| 6 | `account_analytics` | `{ "startDate": "2026-03-01", "endDate": "2026-03-05" }` | 返回 `followers/timeSeries` 或明确错误 | ⬜ | 当前实现疑似参数名不一致 |
| 7 | `create_article` | `{ "title": "MCP Test Article", "content": "Hello from MCP", "publish": false }` | 进入文章编辑页并保存草稿 | ⬜ | |
| 8 | `fetch_wechat_article` | `{ "url": "<微信文章URL>" }` | 返回标题/正文等结构化数据 | ⬜ | |
| 9 | `fetch_tiktok_video` | `{ "url": "<TikTok URL>" }` | 返回视频元数据，若可下载则含本地文件信息 | ⬜ | |
| 10 | `fetch_youtube_video` | `{ "url": "<YouTube URL>" }` | 返回 `title/author/videoId` | ⬜ | |
| 11 | `post_thread` | `{ "tweets": [{ "text": "Thread test 1" }, { "text": "Thread test 2" }], "draftOnly": true }` | 至少能稳定填充 thread 草稿 | ⬜ | 已知高风险项 |
| 12 | `download_youtube_video` | `{ "url": "<YouTube URL>" }` | 成功下载并保存本地 MP4 | ⬜ | 当前标记为搁置 |

## 2. 推荐执行原则

- 每次只测 1 个工具，立即记录结果和错误原文
- 涉及发帖默认用 `draftOnly=true`，避免误发
- 失败时先复现 2 次再定性为稳定失败

